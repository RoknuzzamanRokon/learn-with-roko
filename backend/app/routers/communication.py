"""
Communication router for announcements and messaging functionality.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User, UserRole
from ..services.communication_service import CommunicationService
from ..schemas.communication import (
    AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse, AnnouncementListResponse,
    MessageCreate, MessageUpdate, MessageResponse, MessageListResponse, MessageThreadResponse,
    BulkMessageCreate, BulkMessageResponse, BulkMessageListResponse,
    CommunicationStats
)

router = APIRouter(prefix="/communication", tags=["communication"])


def require_instructor_or_admin(current_user: User = Depends(get_current_user)):
    """Dependency to require instructor or admin role."""
    if current_user.role not in [UserRole.INSTRUCTOR, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Instructor or admin access required"
        )
    return current_user


# Announcement endpoints
@router.post("/announcements", response_model=AnnouncementResponse)
async def create_announcement(
    announcement_data: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor_or_admin)
):
    """
    Create a new course announcement.
    
    Args:
        announcement_data: Announcement creation data
        
    Returns:
        Created announcement with metadata
    """
    try:
        announcement = CommunicationService.create_announcement(
            db, announcement_data, current_user.id
        )
        
        # Build response with additional data
        response_data = {
            **announcement.__dict__,
            "instructor_name": current_user.full_name,
            "course_title": announcement.course.title,
            "read_count": 0,
            "total_recipients": len(announcement.course.enrollments)
        }
        
        return AnnouncementResponse(**response_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create announcement: {str(e)}"
        )


@router.get("/announcements/course/{course_id}", response_model=AnnouncementListResponse)
async def get_course_announcements(
    course_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    include_unpublished: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get announcements for a course.
    
    Args:
        course_id: Course ID
        page: Page number
        per_page: Items per page
        include_unpublished: Include unpublished announcements (instructor only)
        
    Returns:
        Paginated list of announcements
    """
    try:
        # Check if user can see unpublished announcements
        if include_unpublished and current_user.role not in [UserRole.INSTRUCTOR, UserRole.SUPER_ADMIN]:
            include_unpublished = False
        
        announcements, total = CommunicationService.get_course_announcements(
            db, course_id, current_user.id, page, per_page, include_unpublished
        )
        
        # Build response data
        announcement_responses = []
        for announcement in announcements:
            # Get read count
            read_count = len(announcement.announcement_reads)
            total_recipients = len(announcement.course.enrollments)
            
            response_data = {
                **announcement.__dict__,
                "instructor_name": announcement.instructor.full_name,
                "course_title": announcement.course.title,
                "read_count": read_count,
                "total_recipients": total_recipients
            }
            announcement_responses.append(AnnouncementResponse(**response_data))
        
        total_pages = (total + per_page - 1) // per_page
        
        return AnnouncementListResponse(
            announcements=announcement_responses,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch announcements: {str(e)}"
        )


@router.put("/announcements/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(
    announcement_id: int,
    announcement_data: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor_or_admin)
):
    """
    Update an announcement.
    
    Args:
        announcement_id: Announcement ID
        announcement_data: Update data
        
    Returns:
        Updated announcement
    """
    try:
        announcement = CommunicationService.update_announcement(
            db, announcement_id, announcement_data, current_user.id
        )
        
        if not announcement:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        response_data = {
            **announcement.__dict__,
            "instructor_name": current_user.full_name,
            "course_title": announcement.course.title,
            "read_count": len(announcement.announcement_reads),
            "total_recipients": len(announcement.course.enrollments)
        }
        
        return AnnouncementResponse(**response_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update announcement: {str(e)}"
        )


@router.delete("/announcements/{announcement_id}")
async def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor_or_admin)
):
    """
    Delete an announcement.
    
    Args:
        announcement_id: Announcement ID
        
    Returns:
        Success message
    """
    try:
        success = CommunicationService.delete_announcement(
            db, announcement_id, current_user.id
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        return {"message": "Announcement deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete announcement: {str(e)}"
        )


@router.post("/announcements/{announcement_id}/read")
async def mark_announcement_as_read(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark an announcement as read.
    
    Args:
        announcement_id: Announcement ID
        
    Returns:
        Success message
    """
    try:
        success = CommunicationService.mark_announcement_as_read(
            db, announcement_id, current_user.id
        )
        
        return {"message": "Announcement marked as read", "was_unread": success}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to mark announcement as read: {str(e)}"
        )


# Direct messaging endpoints
@router.post("/messages", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a direct message.
    
    Args:
        message_data: Message data
        
    Returns:
        Created message
    """
    try:
        message = CommunicationService.send_direct_message(
            db, message_data, current_user.id
        )
        
        response_data = {
            **message.__dict__,
            "sender_name": current_user.full_name,
            "recipient_name": message.recipient.full_name,
            "course_title": message.course.title if message.course else None,
            "reply_count": len(message.replies)
        }
        
        return MessageResponse(**response_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send message: {str(e)}"
        )


@router.get("/messages", response_model=MessageListResponse)
async def get_messages(
    message_type: str = Query("all", regex="^(sent|received|all)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get messages for the current user.
    
    Args:
        message_type: Type of messages ('sent', 'received', 'all')
        page: Page number
        per_page: Items per page
        
    Returns:
        Paginated list of messages
    """
    try:
        messages, total = CommunicationService.get_user_messages(
            db, current_user.id, message_type, page, per_page
        )
        
        message_responses = []
        for message in messages:
            response_data = {
                **message.__dict__,
                "sender_name": message.sender.full_name,
                "recipient_name": message.recipient.full_name,
                "course_title": message.course.title if message.course else None,
                "reply_count": len(message.replies)
            }
            message_responses.append(MessageResponse(**response_data))
        
        total_pages = (total + per_page - 1) // per_page
        
        return MessageListResponse(
            messages=message_responses,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch messages: {str(e)}"
        )


@router.post("/messages/{message_id}/read")
async def mark_message_as_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a message as read.
    
    Args:
        message_id: Message ID
        
    Returns:
        Success message
    """
    try:
        success = CommunicationService.mark_message_as_read(
            db, message_id, current_user.id
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Message not found or already read")
        
        return {"message": "Message marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to mark message as read: {str(e)}"
        )


# Bulk messaging endpoints
@router.post("/bulk-messages", response_model=BulkMessageResponse)
async def send_bulk_message(
    bulk_message_data: BulkMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor_or_admin)
):
    """
    Send a bulk message to course students.
    
    Args:
        bulk_message_data: Bulk message data
        
    Returns:
        Created bulk message with delivery statistics
    """
    try:
        bulk_message = CommunicationService.send_bulk_message(
            db, bulk_message_data, current_user.id
        )
        
        response_data = {
            **bulk_message.__dict__,
            "sender_name": current_user.full_name,
            "course_title": bulk_message.course.title
        }
        
        return BulkMessageResponse(**response_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send bulk message: {str(e)}"
        )


@router.get("/bulk-messages", response_model=BulkMessageListResponse)
async def get_bulk_messages(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor_or_admin)
):
    """
    Get bulk messages sent by the current instructor.
    
    Args:
        page: Page number
        per_page: Items per page
        
    Returns:
        Paginated list of bulk messages
    """
    try:
        bulk_messages, total = CommunicationService.get_instructor_bulk_messages(
            db, current_user.id, page, per_page
        )
        
        bulk_message_responses = []
        for bulk_message in bulk_messages:
            response_data = {
                **bulk_message.__dict__,
                "sender_name": current_user.full_name,
                "course_title": bulk_message.course.title
            }
            bulk_message_responses.append(BulkMessageResponse(**response_data))
        
        total_pages = (total + per_page - 1) // per_page
        
        return BulkMessageListResponse(
            bulk_messages=bulk_message_responses,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch bulk messages: {str(e)}"
        )


# Communication statistics
@router.get("/stats", response_model=CommunicationStats)
async def get_communication_stats(
    course_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get communication statistics for the current user.
    
    Args:
        course_id: Optional course ID to filter by
        
    Returns:
        Communication statistics
    """
    try:
        stats = CommunicationService.get_communication_stats(
            db, current_user.id, course_id
        )
        
        return CommunicationStats(**stats)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch communication stats: {str(e)}"
        )