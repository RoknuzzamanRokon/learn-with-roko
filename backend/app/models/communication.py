"""
Communication models for announcements and messaging in the Learning Management System.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base


class AnnouncementType(enum.Enum):
    """Types of announcements."""
    GENERAL = "general"
    COURSE_UPDATE = "course_update"
    ASSIGNMENT = "assignment"
    QUIZ = "quiz"
    DEADLINE = "deadline"
    MAINTENANCE = "maintenance"


class AnnouncementPriority(enum.Enum):
    """Priority levels for announcements."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Announcement(Base):
    """
    Course announcements created by instructors.
    """
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    
    # Foreign keys
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Announcement details
    announcement_type = Column(Enum(AnnouncementType), default=AnnouncementType.GENERAL, nullable=False)
    priority = Column(Enum(AnnouncementPriority), default=AnnouncementPriority.NORMAL, nullable=False)
    
    # Announcement settings
    is_published = Column(Boolean, default=True, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    send_email = Column(Boolean, default=False, nullable=False)
    send_notification = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    course = relationship("Course", back_populates="announcements")
    instructor = relationship("User", foreign_keys=[instructor_id], back_populates="created_announcements")
    announcement_reads = relationship("AnnouncementRead", back_populates="announcement", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Announcement(id={self.id}, title='{self.title}', course_id={self.course_id})>"


class AnnouncementRead(Base):
    """
    Tracking which students have read announcements.
    """
    __tablename__ = "announcement_reads"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    announcement_id = Column(Integer, ForeignKey("announcements.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Read details
    read_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    announcement = relationship("Announcement", back_populates="announcement_reads")
    user = relationship("User", back_populates="announcement_reads")

    def __repr__(self):
        return f"<AnnouncementRead(id={self.id}, announcement_id={self.announcement_id}, user_id={self.user_id})>"


class MessageType(enum.Enum):
    """Types of messages."""
    DIRECT = "direct"
    COURSE_QUESTION = "course_question"
    SUPPORT = "support"


class MessageStatus(enum.Enum):
    """Status of messages."""
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    ARCHIVED = "archived"


class Message(Base):
    """
    Direct messages between instructors and students.
    """
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    
    # Foreign keys
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)  # Optional course context
    parent_message_id = Column(Integer, ForeignKey("messages.id"), nullable=True)  # For threading
    
    # Message details
    message_type = Column(Enum(MessageType), default=MessageType.DIRECT, nullable=False)
    status = Column(Enum(MessageStatus), default=MessageStatus.SENT, nullable=False)
    
    # Message flags
    is_important = Column(Boolean, default=False, nullable=False)
    is_archived_by_sender = Column(Boolean, default=False, nullable=False)
    is_archived_by_recipient = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    sent_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_messages")
    course = relationship("Course", back_populates="messages")
    parent_message = relationship("Message", remote_side=[id], back_populates="replies")
    replies = relationship("Message", back_populates="parent_message", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Message(id={self.id}, subject='{self.subject}', sender_id={self.sender_id}, recipient_id={self.recipient_id})>"


class BulkMessage(Base):
    """
    Bulk messages sent to multiple students in a course.
    """
    __tablename__ = "bulk_messages"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    
    # Foreign keys
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Bulk message details
    recipient_filter = Column(String(50), nullable=False)  # 'all', 'active', 'completed', 'struggling'
    total_recipients = Column(Integer, default=0, nullable=False)
    delivered_count = Column(Integer, default=0, nullable=False)
    read_count = Column(Integer, default=0, nullable=False)
    
    # Message settings
    send_email = Column(Boolean, default=False, nullable=False)
    send_notification = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_bulk_messages")
    course = relationship("Course", back_populates="bulk_messages")
    bulk_message_recipients = relationship("BulkMessageRecipient", back_populates="bulk_message", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<BulkMessage(id={self.id}, subject='{self.subject}', course_id={self.course_id})>"


class BulkMessageRecipient(Base):
    """
    Individual recipients of bulk messages.
    """
    __tablename__ = "bulk_message_recipients"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    bulk_message_id = Column(Integer, ForeignKey("bulk_messages.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Delivery tracking
    status = Column(Enum(MessageStatus), default=MessageStatus.SENT, nullable=False)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    bulk_message = relationship("BulkMessage", back_populates="bulk_message_recipients")
    recipient = relationship("User", back_populates="received_bulk_messages")

    def __repr__(self):
        return f"<BulkMessageRecipient(id={self.id}, bulk_message_id={self.bulk_message_id}, recipient_id={self.recipient_id})>"