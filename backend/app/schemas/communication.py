"""
Communication schemas for announcements and messaging.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# Announcement Schemas
class AnnouncementBase(BaseModel):
    """Base announcement schema."""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    announcement_type: str = "general"
    priority: str = "normal"
    is_published: bool = True
    is_pinned: bool = False
    send_email: bool = False
    send_notification: bool = True


class AnnouncementCreate(AnnouncementBase):
    """Schema for creating announcements."""
    course_id: int


class AnnouncementUpdate(BaseModel):
    """Schema for updating announcements."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    announcement_type: Optional[str] = None
    priority: Optional[str] = None
    is_published: Optional[bool] = None
    is_pinned: Optional[bool] = None
    send_email: Optional[bool] = None
    send_notification: Optional[bool] = None


class AnnouncementResponse(AnnouncementBase):
    """Schema for announcement responses."""
    id: int
    course_id: int
    instructor_id: int
    instructor_name: str
    course_title: str
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    read_count: int = 0
    total_recipients: int = 0

    class Config:
        from_attributes = True


class AnnouncementListResponse(BaseModel):
    """Schema for paginated announcement list."""
    announcements: List[AnnouncementResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool


# Message Schemas
class MessageBase(BaseModel):
    """Base message schema."""
    subject: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    message_type: str = "direct"
    is_important: bool = False


class MessageCreate(MessageBase):
    """Schema for creating messages."""
    recipient_id: int
    course_id: Optional[int] = None
    parent_message_id: Optional[int] = None


class MessageUpdate(BaseModel):
    """Schema for updating messages."""
    status: Optional[str] = None
    is_archived_by_sender: Optional[bool] = None
    is_archived_by_recipient: Optional[bool] = None


class MessageResponse(MessageBase):
    """Schema for message responses."""
    id: int
    sender_id: int
    recipient_id: int
    sender_name: str
    recipient_name: str
    course_id: Optional[int] = None
    course_title: Optional[str] = None
    parent_message_id: Optional[int] = None
    status: str
    is_archived_by_sender: bool
    is_archived_by_recipient: bool
    sent_at: datetime
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    reply_count: int = 0

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    """Schema for paginated message list."""
    messages: List[MessageResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool


class MessageThreadResponse(BaseModel):
    """Schema for message thread responses."""
    parent_message: MessageResponse
    replies: List[MessageResponse]


# Bulk Message Schemas
class BulkMessageBase(BaseModel):
    """Base bulk message schema."""
    subject: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    recipient_filter: str = "all"  # 'all', 'active', 'completed', 'struggling'
    send_email: bool = False
    send_notification: bool = True


class BulkMessageCreate(BulkMessageBase):
    """Schema for creating bulk messages."""
    course_id: int


class BulkMessageResponse(BulkMessageBase):
    """Schema for bulk message responses."""
    id: int
    sender_id: int
    course_id: int
    sender_name: str
    course_title: str
    total_recipients: int
    delivered_count: int
    read_count: int
    created_at: datetime
    sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BulkMessageListResponse(BaseModel):
    """Schema for paginated bulk message list."""
    bulk_messages: List[BulkMessageResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool


# Communication Statistics
class CommunicationStats(BaseModel):
    """Schema for communication statistics."""
    total_announcements: int
    unread_announcements: int
    total_messages: int
    unread_messages: int
    total_sent_messages: int
    total_bulk_messages: int


# Notification Schemas
class NotificationCreate(BaseModel):
    """Schema for creating notifications."""
    recipient_id: int
    title: str
    content: str
    notification_type: str = "general"
    related_id: Optional[int] = None
    related_type: Optional[str] = None


class NotificationResponse(BaseModel):
    """Schema for notification responses."""
    id: int
    recipient_id: int
    title: str
    content: str
    notification_type: str
    related_id: Optional[int] = None
    related_type: Optional[str] = None
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True