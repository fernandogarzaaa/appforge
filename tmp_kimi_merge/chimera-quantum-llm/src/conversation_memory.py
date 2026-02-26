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

from config import get_config
from src.logger import get_logger

logger = get_logger()


@dataclass
class Message:
    """A single message in a conversation."""
    role: str  # "system", "user", "assistant"
    content: str
    timestamp: str
    compressed: bool = False  # Whether this is a compressed summary
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Message':
        return cls(**data)


@dataclass
class Conversation:
    """A conversation session."""
    session_id: str
    messages: List[Message]
    created_at: str
    last_updated: str
    summary: Optional[str] = None  # Compressed summary of older messages
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "messages": [m.to_dict() for m in self.messages],
            "created_at": self.created_at,
            "last_updated": self.last_updated,
            "summary": self.summary,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Conversation':
        return cls(
            session_id=data["session_id"],
            messages=[Message.from_dict(m) for m in data["messages"]],
            created_at=data["created_at"],
            last_updated=data["last_updated"],
            summary=data.get("summary"),
        )


class ConversationMemory:
    """
    Rolling conversation memory with compression.
    Keeps last N messages, compresses older ones into summaries.
    """
    
    def __init__(self):
        self.config = get_config()
        self.conversations: Dict[str, Conversation] = {}
        self._lock = threading.RLock()
        
        logger.info("ConversationMemory initialized",
                   max_messages=self.config.MAX_CONVERSATION_MESSAGES)
    
    def _generate_session_id(self, messages: List[Dict[str, str]]) -> str:
        """Generate a session ID from the first user message."""
        # Find first user message
        for msg in messages:
            if msg.get("role") == "user":
                content = msg.get("content", "")
                # Hash first 100 chars for consistency
                return hashlib.md5(content[:100].encode()).hexdigest()[:16]
        
        # Fallback: random ID
        import uuid
        return str(uuid.uuid4())[:16]
    
    def _compress_messages(
        self, 
        messages: List[Message], 
        compressor_fn: Optional[Any] = None
    ) -> str:
        """
        Compress older messages into a summary.
        Uses a simple concatenation if no compressor provided.
        """
        if not messages:
            return ""
        
        # Simple compression: join key points
        parts = []
        for msg in messages:
            prefix = "User" if msg.role == "user" else "Assistant"
            content = msg.content[:200]  # Truncate long messages
            if len(msg.content) > 200:
                content += "..."
            parts.append(f"{prefix}: {content}")
        
        summary = " | ".join(parts)
        
        # If too long, further truncate
        if len(summary) > 2000:
            summary = summary[:2000] + "... [truncated]"
        
        return summary
    
    def add_message(
        self, 
        session_id: str, 
        role: str, 
        content: str,
        compressor_fn: Optional[Any] = None
    ):
        """Add a message to a conversation."""
        if not self.config.ENABLE_CONVERSATION_MEMORY:
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
            
            # Add new message
            message = Message(
                role=role,
                content=content,
                timestamp=datetime.utcnow().isoformat(),
            )
            conversation.messages.append(message)
            conversation.last_updated = datetime.utcnow().isoformat()
            
            # Compress if over limit
            if len(conversation.messages) > self.config.MAX_CONVERSATION_MESSAGES:
                # Keep last 3 messages, compress the rest
                to_compress = conversation.messages[:-3]
                to_keep = conversation.messages[-3:]
                
                # Compress older messages
                new_summary = self._compress_messages(to_compress, compressor_fn)
                
                # Append to existing summary or create new
                if conversation.summary:
                    conversation.summary += " | " + new_summary
                else:
                    conversation.summary = new_summary
                
                # Truncate summary if too long
                if len(conversation.summary) > 3000:
                    conversation.summary = "..." + conversation.summary[-3000:]
                
                # Keep only recent messages
                conversation.messages = to_keep
                
                logger.debug(f"Compressed conversation for session {session_id}",
                           message_count=len(conversation.messages),
                           summary_length=len(conversation.summary))
    
    def get_context(self, session_id: str) -> List[Dict[str, str]]:
        """Get conversation context for a session."""
        if not self.config.ENABLE_CONVERSATION_MEMORY:
            return []
        
        with self._lock:
            if session_id not in self.conversations:
                return []
            
            conversation = self.conversations[session_id]
            context = []
            
            # Add summary as system message if exists
            if conversation.summary:
                context.append({
                    "role": "system",
                    "content": f"Previous conversation context: {conversation.summary}"
                })
            
            # Add recent messages
            for msg in conversation.messages:
                context.append({
                    "role": msg.role,
                    "content": msg.content,
                })
            
            return context
    
    def get_or_create_session(
        self, 
        messages: List[Dict[str, str]], 
        session_id: Optional[str] = None
    ) -> str:
        """Get existing session or create new one."""
        if not self.config.ENABLE_CONVERSATION_MEMORY:
            return ""
        
        if session_id:
            return session_id
        
        return self._generate_session_id(messages)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get memory statistics."""
        with self._lock:
            return {
                "total_conversations": len(self.conversations),
                "total_messages": sum(
                    len(c.messages) for c in self.conversations.values()
                ),
                "avg_messages_per_conversation": (
                    sum(len(c.messages) for c in self.conversations.values()) / 
                    len(self.conversations) if self.conversations else 0
                ),
            }
    
    def clear_session(self, session_id: str):
        """Clear a specific conversation."""
        with self._lock:
            if session_id in self.conversations:
                del self.conversations[session_id]
                logger.info(f"Cleared conversation session {session_id}")
    
    def clear_all(self):
        """Clear all conversations."""
        with self._lock:
            self.conversations.clear()
            logger.info("Cleared all conversation memory")


# Global instance
_memory: Optional[ConversationMemory] = None


def get_conversation_memory() -> ConversationMemory:
    """Get global conversation memory instance."""
    global _memory
    if _memory is None:
        _memory = ConversationMemory()
    return _memory
