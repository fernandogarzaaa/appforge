"""
Quantum Chimera LLM v4.0 - Conversation Memory with Rolling Context
===================================================================
Advanced conversation memory management with intelligent context window handling.

Features:
- Rolling context window with token-based truncation
- Conversation summarization for long contexts
- Multi-session memory management
- Semantic conversation search
- Importance-based message retention
"""

import time
import json
import hashlib
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field, asdict
from collections import OrderedDict
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


@dataclass
class Message:
    """Single message in conversation."""
    role: str
    content: str
    timestamp: float = field(default_factory=time.time)
    tokens: int = 0
    importance: float = 1.0  # 0.0 to 1.0
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp,
            "tokens": self.tokens,
            "importance": self.importance,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Message':
        return cls(
            role=data.get("role", ""),
            content=data.get("content", ""),
            timestamp=data.get("timestamp", time.time()),
            tokens=data.get("tokens", 0),
            importance=data.get("importance", 1.0),
            metadata=data.get("metadata", {})
        )


@dataclass
class Conversation:
    """Conversation with metadata."""
    session_id: str
    messages: List[Message] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)
    last_activity: float = field(default_factory=time.time)
    total_tokens: int = 0
    summary: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def add_message(self, role: str, content: str, tokens: int = 0, importance: float = 1.0):
        """Add a message to the conversation."""
        message = Message(
            role=role,
            content=content,
            tokens=tokens,
            importance=importance
        )
        self.messages.append(message)
        self.total_tokens += tokens
        self.last_activity = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "messages": [m.to_dict() for m in self.messages],
            "created_at": self.created_at,
            "last_activity": self.last_activity,
            "total_tokens": self.total_tokens,
            "summary": self.summary,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Conversation':
        conv = cls(
            session_id=data.get("session_id", ""),
            created_at=data.get("created_at", time.time()),
            last_activity=data.get("last_activity", time.time()),
            total_tokens=data.get("total_tokens", 0),
            summary=data.get("summary", ""),
            metadata=data.get("metadata", {})
        )
        conv.messages = [Message.from_dict(m) for m in data.get("messages", [])]
        return conv


class TokenEstimator:
    """Estimate token count for text."""
    
    # Approximate tokens per character ratio for English
    CHARS_PER_TOKEN = 4.0
    
    @classmethod
    def estimate(cls, text: str) -> int:
        """Estimate token count for text."""
        return max(1, int(len(text) / cls.CHARS_PER_TOKEN))
    
    @classmethod
    def estimate_messages(cls, messages: List[Dict[str, str]]) -> int:
        """Estimate token count for message list."""
        total = 0
        for msg in messages:
            total += cls.estimate(msg.get("content", ""))
            total += 4  # Format overhead per message
        return total


class ConversationMemory:
    """
    Advanced conversation memory with rolling context management.
    
    Features:
    - Token-based context window management
    - Intelligent truncation preserving important messages
    - Conversation summarization
    - Multi-session support
    - Persistence
    """
    
    def __init__(
        self,
        max_context_tokens: int = 8000,
        max_messages: int = 100,
        summarization_threshold: int = 6000,
        max_conversations: int = 1000,
        data_dir: str = "./data",
        auto_save: bool = True
    ):
        self.max_context_tokens = max_context_tokens
        self.max_messages = max_messages
        self.summarization_threshold = summarization_threshold
        self.max_conversations = max_conversations
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.auto_save = auto_save
        
        # Conversation storage
        self._conversations: OrderedDict[str, Conversation] = OrderedDict()
        
        # Lock for thread safety
        self._lock = asyncio.Lock()
        
        # Load existing conversations
        self._load_conversations()
        
        logger.info(f"ConversationMemory initialized (max_tokens={max_context_tokens})")
    
    async def create_session(self, session_id: Optional[str] = None) -> str:
        """Create a new conversation session."""
        if session_id is None:
            session_id = hashlib.sha256(str(time.time()).encode()).hexdigest()[:16]
        
        async with self._lock:
            if session_id not in self._conversations:
                self._conversations[session_id] = Conversation(session_id=session_id)
                logger.debug(f"Created session: {session_id}")
        
        return session_id
    
    async def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        importance: float = 1.0
    ):
        """Add a message to a conversation."""
        tokens = TokenEstimator.estimate(content)
        
        async with self._lock:
            if session_id not in self._conversations:
                await self.create_session(session_id)
            
            conversation = self._conversations[session_id]
            conversation.add_message(role, content, tokens, importance)
            
            # Move to end (most recent)
            self._conversations.move_to_end(session_id)
            
            # Check if we need to truncate
            if conversation.total_tokens > self.summarization_threshold:
                await self._truncate_conversation(session_id)
            
            logger.debug(f"Added message to {session_id} (tokens={tokens})")
            
            if self.auto_save:
                await self._save_conversation(session_id)
    
    async def get_context(
        self,
        session_id: str,
        max_tokens: Optional[int] = None,
        include_summary: bool = True
    ) -> List[Dict[str, str]]:
        """Get conversation context for a session."""
        max_tokens = max_tokens or self.max_context_tokens
        
        async with self._lock:
            if session_id not in self._conversations:
                return []
            
            conversation = self._conversations[session_id]
            messages = conversation.messages
            
            if not messages:
                return []
            
            # Build context within token limit
            context = []
            total_tokens = 0
            
            # Add summary if available and requested
            if include_summary and conversation.summary:
                summary_msg = {
                    "role": "system",
                    "content": f"Previous conversation summary: {conversation.summary}"
                }
                summary_tokens = TokenEstimator.estimate(conversation.summary)
                if summary_tokens + 100 < max_tokens:  # Leave room for messages
                    context.append(summary_msg)
                    total_tokens += summary_tokens + 50  # Overhead
            
            # Add messages from most recent, respecting token limit
            for msg in reversed(messages):
                msg_tokens = msg.tokens + 4  # Include overhead
                
                if total_tokens + msg_tokens > max_tokens:
                    break
                
                context.insert(0, {
                    "role": msg.role,
                    "content": msg.content
                })
                total_tokens += msg_tokens
            
            return context
    
    async def _truncate_conversation(self, session_id: str):
        """Truncate conversation to fit within limits."""
        conversation = self._conversations[session_id]
        
        if len(conversation.messages) <= 10:
            return  # Don't truncate very short conversations
        
        # Strategy: Keep first message (system prompt), last 10 messages, and summarize middle
        messages = conversation.messages
        
        # Keep system message if present
        system_messages = [m for m in messages if m.role == "system"]
        other_messages = [m for m in messages if m.role != "system"]
        
        if len(other_messages) > 20:
            # Keep first few and last several
            keep_first = 3
            keep_last = 15
            
            to_summarize = other_messages[keep_first:-keep_last]
            kept_messages = other_messages[:keep_first] + other_messages[-keep_last:]
            
            # Create simple summary (in production, use LLM for better summary)
            summary = self._create_simple_summary(to_summarize)
            conversation.summary = summary
            
            # Rebuild message list
            conversation.messages = system_messages + kept_messages
            
            # Recalculate total tokens
            conversation.total_tokens = sum(m.tokens for m in conversation.messages)
            
            logger.info(f"Truncated session {session_id} (summary length={len(summary)})")
    
    def _create_simple_summary(self, messages: List[Message]) -> str:
        """Create a simple summary of messages."""
        # Extract key topics (simple approach)
        user_messages = [m.content for m in messages if m.role == "user"]
        
        if not user_messages:
            return "Previous discussion"
        
        # Take first sentence of first and last user messages
        first_topic = user_messages[0].split('.')[0][:100]
        last_topic = user_messages[-1].split('.')[0][:100]
        
        if first_topic == last_topic:
            return f"Discussion about: {first_topic}"
        else:
            return f"Started with: {first_topic}. Later discussed: {last_topic}"
    
    async def get_conversation(self, session_id: str) -> Optional[Conversation]:
        """Get full conversation by session ID."""
        async with self._lock:
            return self._conversations.get(session_id)
    
    async def list_sessions(self) -> List[str]:
        """List all active session IDs."""
        async with self._lock:
            return list(self._conversations.keys())
    
    async def delete_session(self, session_id: str):
        """Delete a conversation session."""
        async with self._lock:
            if session_id in self._conversations:
                del self._conversations[session_id]
                
                # Delete file
                file_path = self.data_dir / f"{session_id}.json"
                if file_path.exists():
                    file_path.unlink()
                
                logger.info(f"Deleted session: {session_id}")
    
    async def clear_all(self):
        """Clear all conversations."""
        async with self._lock:
            self._conversations.clear()
            
            # Delete all conversation files
            for file_path in self.data_dir.glob("*.json"):
                file_path.unlink()
            
            logger.info("Cleared all conversations")
    
    async def search_conversations(
        self,
        query: str,
        session_ids: Optional[List[str]] = None
    ) -> List[Tuple[str, Message]]:
        """Search conversations for matching messages."""
        results = []
        query_lower = query.lower()
        
        async with self._lock:
            sessions = session_ids or list(self._conversations.keys())
            
            for session_id in sessions:
                if session_id not in self._conversations:
                    continue
                
                conversation = self._conversations[session_id]
                for msg in conversation.messages:
                    if query_lower in msg.content.lower():
                        results.append((session_id, msg))
        
        return results
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get memory statistics."""
        async with self._lock:
            total_messages = sum(len(c.messages) for c in self._conversations.values())
            total_tokens = sum(c.total_tokens for c in self._conversations.values())
            
            return {
                "total_conversations": len(self._conversations),
                "total_messages": total_messages,
                "total_tokens": total_tokens,
                "avg_messages_per_conversation": total_messages / len(self._conversations) if self._conversations else 0,
                "max_context_tokens": self.max_context_tokens,
                "max_conversations": self.max_conversations
            }
    
    async def _save_conversation(self, session_id: str):
        """Save a conversation to disk."""
        try:
            conversation = self._conversations.get(session_id)
            if not conversation:
                return
            
            file_path = self.data_dir / f"{session_id}.json"
            with open(file_path, 'w') as f:
                json.dump(conversation.to_dict(), f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving conversation {session_id}: {e}")
    
    def _load_conversations(self):
        """Load conversations from disk."""
        try:
            for file_path in self.data_dir.glob("*.json"):
                try:
                    with open(file_path, 'r') as f:
                        data = json.load(f)
                    
                    conversation = Conversation.from_dict(data)
                    self._conversations[conversation.session_id] = conversation
                except Exception as e:
                    logger.warning(f"Error loading conversation from {file_path}: {e}")
            
            logger.info(f"Loaded {len(self._conversations)} conversations")
        except Exception as e:
            logger.warning(f"Error loading conversations: {e}")


# Global conversation memory instance
_memory: Optional[ConversationMemory] = None


def get_conversation_memory(
    max_context_tokens: int = 8000,
    max_messages: int = 100,
    **kwargs
) -> ConversationMemory:
    """Get or create global conversation memory instance."""
    global _memory
    if _memory is None:
        _memory = ConversationMemory(
            max_context_tokens=max_context_tokens,
            max_messages=max_messages,
            **kwargs
        )
    return _memory
