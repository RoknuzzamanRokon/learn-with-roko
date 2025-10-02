"""
Communication service for announcements and messaging functionality.
"""

from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from ..models.user import User, UserRole
from ..models.course import Course
from ..models.enrollment import Enrollment
from ..models.communication import (
    Announcement, AnnouncementRead, Message, BulkMessage, BulkMessageRecipient,
    AnnouncementType, AnnouncementPriority, MessageType, MessageStatus
)
from ..schemas.communication import (
    AnnouncementCreate, AnnouncementUpdate, MessageCreate, MessageUpdate,
    BulkMessageCreate
)


class CommunicationService:
    """Service for handling communication functionality."""

    @staticmethod
    def create_announcement(
        db: Session, 
        announcement_data: AnnouncementCreate, 
        instructor_id: int
    ) -> Announcement:
        """
        Create a new course announcement.
        
        Args:
            db: Database session
            announcement_data: Announcement creation data
            instructor_id: ID of the instructor creating the announcement
            
        Returns:
            Created announcement
        """
        # Verify instructor owns the course
        course = db.query(Course).filter(
            and_(
                Course.id == announcement_data.course_id,
                Course.instructor_id == instructor_id
            )
        ).first()
        
        if not course:
            raise ValueError("Course not found or access denied")
        
        announcement = Announcement(
            title=announcement_data.title,
            content=announcement_data.content,
            course_id=announcement_data.course_id,
            instructor_id=instructor_id,
            announcement_type=AnnouncementType(announcement_data.announcement_type),
            priority=AnnouncementPriority(announcement_data.priority),
            is_published=announcement_data.is_published,
            is_pinned=announcement_data.is_pinned,
            send_email=announcement_data.send_email,
            send_notification=announcement_data.send_notification,
            published_at=datetime.utcnow() if announcement_data.is_published else None
        )
        
        db.add(announcement)
        db.commit()
        db.refresh(announcement)
        
        return announcement

    @staticmethod
    def get_course_announcements(
        db: Session,
        course_id: int,
        user_id: int,
        page: int = 1,
        per_page: int = 20,
        include_unpublished: bool = False
    ) -> Tuple[List[Announcement], int]:
        """
        Get announcements for a course.
        
        Args:
            db: Database session
            course_id: Course ID
            user_id: User ID (for read status)
            page: Page number
            per_page: Items per page
            include_unpublished: Whether to include unpublished announcements
            
        Returns:
            Tuple of (announcements, total_count)
        """
        query = db.query(Announcement).filter(Announcement.course_id == course_id)
        
        if not include_unpublished:
            query = query.filter(Announcement.is_published == True)
        
        # Order by pinned first, then by creation date
        query = query.order_by(desc(Announcement.is_pinned), desc(Announcement.created_at))
        
        total = query.count()
        announcements = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return announcements, total

    @staticmethod
    def mark_announcement_as_read(
        db: Session,
        announcement_id: int,
        user_id: int
    ) -> bool:
        """
        Mark an announcement as read by a user.
        
        Args:
            db: Database session
            announcement_id: Announcement ID
            user_id: User ID
            
        Returns:
            True if marked as read, False if already read
        """
        existing_read = db.query(AnnouncementRead).filter(
            and_(
                AnnouncementRead.announcement_id == announcement_id,
                AnnouncementRead.user_id == user_id
            )
        ).first()
        
        if existing_read:
            return False
        
        announcement_read = AnnouncementRead(
            announcement_id=announcement_id,
            user_id=user_id
        )
        
        db.add(announcement_read)
        db.commit()
        
        return True

    @staticmethod
    def update_announcement(
        db: Session,
        announcement_id: int,
        announcement_data: AnnouncementUpdate,
        instructor_id: int
    ) -> Optional[Announcement]:
        """
        Update an announcement.
        
        Args:
            db: Database session
            announcement_id: Announcement ID
            announcement_data: Update data
            instructor_id: ID of the instructor
            
        Returns:
            Updated announcement or None if not found
        """
        announcement = db.query(Announcement).filter(
            and_(
                Announcement.id == announcement_id,
                Announcement.instructor_id == instructor_id
            )
        ).first()
        
        if not announcement:
            return None
        
        update_data = announcement_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field in ['announcement_type', 'priority'] and value:
                if field == 'announcement_type':
                    value = AnnouncementType(value)
                elif field == 'priority':
                    value = AnnouncementPriority(value)
            setattr(announcement, field, value)
        
        # Update published_at if publishing
        if announcement_data.is_published and not announcement.published_at:
            announcement.published_at = datetime.utcnow()
        
        db.commit()
        db.refresh(announcement)
        
        return announcement

    @staticmethod
    def delete_announcement(
        db: Session,
        announcement_id: int,
        instructor_id: int
    ) -> bool:
        """
        Delete an announcement.
        
        Args:
            db: Database session
            announcement_id: Announcement ID
            instructor_id: ID of the instructor
            
        Returns:
            True if deleted, False if not found
        """
        announcement = db.query(Announcement).filter(
            and_(
                Announcement.id == announcement_id,
                Announcement.instructor_id == instructor_id
            )
        ).first()
        
        if not announcement:
            return False
        
        db.delete(announcement)
        db.commit()
        
        return True

    @staticmethod
    def send_direct_message(
        db: Session,
        message_data: MessageCreate,
        sender_id: int
    ) -> Message:
        """
        Send a direct message.
        
        Args:
            db: Database session
            message_data: Message data
            sender_id: ID of the sender
            
        Returns:
            Created message
        """
        # Verify recipient exists
        recipient = db.query(User).filter(User.id == message_data.recipient_id).first()
        if not recipient:
            raise ValueError("Recipient not found")
        
        # If course_id is provided, verify access
        if message_data.course_id:
            course = db.query(Course).filter(Course.id == message_data.course_id).first()
            if not course:
                raise ValueError("Course not found")
        
        message = Message(
            subject=message_data.subject,
            content=message_data.content,
            sender_id=sender_id,
            recipient_id=message_data.recipient_id,
            course_id=message_data.course_id,
            parent_message_id=message_data.parent_message_id,
            message_type=MessageType(message_data.message_type),
            is_important=message_data.is_important,
            delivered_at=datetime.utcnow()
        )
        
        db.add(message)
        db.commit()
        db.refresh(message)
        
        return message

    @staticmethod
    def get_user_messages(
        db: Session,
        user_id: int,
        message_type: str = "all",  # 'sent', 'received', 'all'
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[Message], int]:
        """
        Get messages for a user.
        
        Args:
            db: Database session
            user_id: User ID
            message_type: Type of messages to retrieve
            page: Page number
            per_page: Items per page
            
        Returns:
            Tuple of (messages, total_count)
        """
        if message_type == "sent":
            query = db.query(Message).filter(
                and_(
                    Message.sender_id == user_id,
                    Message.is_archived_by_sender == False
                )
            )
        elif message_type == "received":
            query = db.query(Message).filter(
                and_(
                    Message.recipient_id == user_id,
                    Message.is_archived_by_recipient == False
                )
            )
        else:  # all
            query = db.query(Message).filter(
                or_(
                    and_(
                        Message.sender_id == user_id,
                        Message.is_archived_by_sender == False
                    ),
                    and_(
                        Message.recipient_id == user_id,
                        Message.is_archived_by_recipient == False
                    )
                )
            )
        
        query = query.order_by(desc(Message.sent_at))
        total = query.count()
        messages = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return messages, total

    @staticmethod
    def mark_message_as_read(
        db: Session,
        message_id: int,
        user_id: int
    ) -> bool:
        """
        Mark a message as read.
        
        Args:
            db: Database session
            message_id: Message ID
            user_id: User ID (must be recipient)
            
        Returns:
            True if marked as read, False if not found or already read
        """
        message = db.query(Message).filter(
            and_(
                Message.id == message_id,
                Message.recipient_id == user_id,
                Message.read_at.is_(None)
            )
        ).first()
        
        if not message:
            return False
        
        message.read_at = datetime.utcnow()
        message.status = MessageStatus.READ
        
        db.commit()
        
        return True

    @staticmethod
    def send_bulk_message(
        db: Session,
        bulk_message_data: BulkMessageCreate,
        sender_id: int
    ) -> BulkMessage:
        """
        Send a bulk message to course students.
        
        Args:
            db: Database session
            bulk_message_data: Bulk message data
            sender_id: ID of the sender (instructor)
            
        Returns:
            Created bulk message
        """
        # Verify instructor owns the course
        course = db.query(Course).filter(
            and_(
                Course.id == bulk_message_data.course_id,
                Course.instructor_id == sender_id
            )
        ).first()
        
        if not course:
            raise ValueError("Course not found or access denied")
        
        # Get recipients based on filter
        recipients_query = db.query(User).join(Enrollment).filter(
            Enrollment.course_id == bulk_message_data.course_id
        )
        
        if bulk_message_data.recipient_filter == "active":
            # Students who accessed course in last 30 days
            from datetime import timedelta
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            recipients_query = recipients_query.filter(
                Enrollment.last_accessed >= thirty_days_ago
            )
        elif bulk_message_data.recipient_filter == "completed":
            recipients_query = recipients_query.filter(
                Enrollment.is_completed == True
            )
        elif bulk_message_data.recipient_filter == "struggling":
            # Students with low progress (less than 25%)
            recipients_query = recipients_query.filter(
                Enrollment.progress_percentage < 25.0
            )
        
        recipients = recipients_query.all()
        
        # Create bulk message
        bulk_message = BulkMessage(
            subject=bulk_message_data.subject,
            content=bulk_message_data.content,
            sender_id=sender_id,
            course_id=bulk_message_data.course_id,
            recipient_filter=bulk_message_data.recipient_filter,
            total_recipients=len(recipients),
            send_email=bulk_message_data.send_email,
            send_notification=bulk_message_data.send_notification,
            sent_at=datetime.utcnow()
        )
        
        db.add(bulk_message)
        db.flush()  # Get the ID
        
        # Create individual recipient records
        for recipient in recipients:
            bulk_recipient = BulkMessageRecipient(
                bulk_message_id=bulk_message.id,
                recipient_id=recipient.id,
                delivered_at=datetime.utcnow()
            )
            db.add(bulk_recipient)
        
        bulk_message.delivered_count = len(recipients)
        
        db.commit()
        db.refresh(bulk_message)
        
        return bulk_message

    @staticmethod
    def get_instructor_bulk_messages(
        db: Session,
        instructor_id: int,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[BulkMessage], int]:
        """
        Get bulk messages sent by an instructor.
        
        Args:
            db: Database session
            instructor_id: Instructor ID
            page: Page number
            per_page: Items per page
            
        Returns:
            Tuple of (bulk_messages, total_count)
        """
        query = db.query(BulkMessage).filter(
            BulkMessage.sender_id == instructor_id
        ).order_by(desc(BulkMessage.created_at))
        
        total = query.count()
        bulk_messages = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return bulk_messages, total

    @staticmethod
    def get_communication_stats(
        db: Session,
        user_id: int,
        course_id: Optional[int] = None
    ) -> Dict[str, int]:
        """
        Get communication statistics for a user.
        
        Args:
            db: Database session
            user_id: User ID
            course_id: Optional course ID to filter by
            
        Returns:
            Dictionary with communication statistics
        """
        stats = {
            "total_announcements": 0,
            "unread_announcements": 0,
            "total_messages": 0,
            "unread_messages": 0,
            "total_sent_messages": 0,
            "total_bulk_messages": 0
        }
        
        # Get user's enrolled courses or specific course
        if course_id:
            course_ids = [course_id]
        else:
            enrollments = db.query(Enrollment).filter(Enrollment.user_id == user_id).all()
            course_ids = [e.course_id for e in enrollments]
        
        if not course_ids:
            return stats
        
        # Announcement stats
        total_announcements = db.query(Announcement).filter(
            and_(
                Announcement.course_id.in_(course_ids),
                Announcement.is_published == True
            )
        ).count()
        
        read_announcements = db.query(AnnouncementRead).join(Announcement).filter(
            and_(
                AnnouncementRead.user_id == user_id,
                Announcement.course_id.in_(course_ids),
                Announcement.is_published == True
            )
        ).count()
        
        stats["total_announcements"] = total_announcements
        stats["unread_announcements"] = total_announcements - read_announcements
        
        # Message stats
        stats["total_messages"] = db.query(Message).filter(
            Message.recipient_id == user_id
        ).count()
        
        stats["unread_messages"] = db.query(Message).filter(
            and_(
                Message.recipient_id == user_id,
                Message.read_at.is_(None)
            )
        ).count()
        
        stats["total_sent_messages"] = db.query(Message).filter(
            Message.sender_id == user_id
        ).count()
        
        # Bulk message stats (for instructors)
        stats["total_bulk_messages"] = db.query(BulkMessage).filter(
            BulkMessage.sender_id == user_id
        ).count()
        
        return stats