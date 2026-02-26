
"""
Quantum Chimera LLM - Conversation Memory
==========================================
Rolling conversation memory with compression for older messages.
"""

import hashlib
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import threading

from llm.config import get_config
from llm.src.logger import get_logger

logger = get_logger()

@dataclass
class Message:
	role: str
	content: str
	timestamp: str

@dataclass
class Conversation:
	session_id: str
	messages: List[Message]
	created_at: str
	last_updated: str
	summary: str = ""

class ConversationMemory:
	"""
	Rolling conversation memory with compression.
	Keeps last N messages, compresses older ones into summaries.
	"""
	def __init__(self):
		self.config = get_config()
		self.conversations: Dict[str, Conversation] = {}
		self._lock = threading.RLock()
		logger.info("ConversationMemory initialized", max_messages=getattr(self.config, 'MAX_CONVERSATION_MESSAGES', 20))

	def _generate_session_id(self, messages: List[Dict[str, str]]) -> str:
		for msg in messages:
			if msg.get("role") == "user":
				content = msg.get("content", "")
				return hashlib.md5(content[:100].encode()).hexdigest()[:16]
		import uuid
		return str(uuid.uuid4())[:16]

	def _compress_messages(self, messages: List[Message], compressor_fn: Optional[Any] = None) -> str:
		if not messages:
			return ""
		parts = []
		for msg in messages:
			prefix = "User" if msg.role == "user" else "Assistant"
			content = msg.content[:200]
			if len(msg.content) > 200:
				content += "..."
			parts.append(f"{prefix}: {content}")
		summary = " | ".join(parts)
		if len(summary) > 2000:
			summary = summary[:2000] + "... [truncated]"
		return summary

	def add_message(self, session_id: str, role: str, content: str, compressor_fn: Optional[Any] = None):
		if not getattr(self.config, 'ENABLE_CONVERSATION_MEMORY', True):
			return
		with self._lock:
			if session_id not in self.conversations:
				self.conversations[session_id] = Conversation(
					session_id=session_id,
					messages=[],
					created_at=datetime.utcnow().isoformat(),
					last_updated=datetime.utcnow().isoformat(),
				)
			conversation = self.conversations[session_id]
			message = Message(
				role=role,
				content=content,
				timestamp=datetime.utcnow().isoformat(),
			)
			conversation.messages.append(message)
			conversation.last_updated = datetime.utcnow().isoformat()
			max_messages = getattr(self.config, 'MAX_CONVERSATION_MESSAGES', 20)
			if len(conversation.messages) > max_messages:
				to_compress = conversation.messages[:-3]
				to_keep = conversation.messages[-3:]
				new_summary = self._compress_messages(to_compress, compressor_fn)
				if conversation.summary:
					conversation.summary += " | " + new_summary
				else:
					conversation.summary = new_summary
				if len(conversation.summary) > 3000:
					conversation.summary = "..." + conversation.summary[-3000:]
				conversation.messages = to_keep
				logger.debug(f"Compressed conversation for session {session_id}", message_count=len(conversation.messages), summary_length=len(conversation.summary))

	def get_context(self, session_id: str) -> List[Dict[str, str]]:
		if not getattr(self.config, 'ENABLE_CONVERSATION_MEMORY', True):
			return []
		with self._lock:
			if session_id not in self.conversations:
				return []
			conversation = self.conversations[session_id]
			context = []
			if conversation.summary:
				context.append({
					"role": "system",
					"content": f"Previous conversation context: {conversation.summary}"
				})
			for msg in conversation.messages:
				context.append({
					"role": msg.role,
					"content": msg.content,
				})
			return context

	def get_or_create_session(self, messages: List[Dict[str, str]], session_id: Optional[str] = None) -> str:
		if not getattr(self.config, 'ENABLE_CONVERSATION_MEMORY', True):
			return ""
		if session_id:
			return session_id
		return self._generate_session_id(messages)

	def get_stats(self) -> Dict[str, Any]:
		with self._lock:
			return {
				"total_conversations": len(self.conversations),
				"total_messages": sum(len(c.messages) for c in self.conversations.values()),
				"avg_messages_per_conversation": (
					sum(len(c.messages) for c in self.conversations.values()) / len(self.conversations) if self.conversations else 0
				),
			}

	def clear_session(self, session_id: str):
		with self._lock:
			if session_id in self.conversations:
				del self.conversations[session_id]
				logger.info(f"Cleared conversation session {session_id}")

	def clear_all(self):
		with self._lock:
			self.conversations.clear()
			logger.info("Cleared all conversation memory")

# Global instance
_memory: Optional[ConversationMemory] = None

def get_conversation_memory() -> ConversationMemory:
	global _memory
	if _memory is None:
		_memory = ConversationMemory()
	return _memory