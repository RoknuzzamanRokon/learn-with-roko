"""
Service layer for resource management operations.
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional
from ..models import LectureResource, ResourceDownload, Lecture, Course, Enrollment, User
from ..schemas.resource import LectureResourceCreate, LectureResourceUpdate, ResourceDownloadCreate
from fastapi import HTTPException, status


class ResourceService:
    """Service class for resource operations."""

    @staticmethod
    def create_resource(db: Session, user_id: int, resource_data: LectureResourceCreate) -> LectureResource:
        """
        Create a new downloadable resource for a lecture.
        
        Args:
            db: Database session
            user_id: ID of the user creating the resource (must be instructor)
            resource_data: Resource creation data
            
        Returns:
            Created resource object
            
        Raises:
            HTTPException: If lecture not found or user not authorized
        """
        # Verify lecture exists and user is the instructor
        lecture = db.query(Lecture).filter(Lecture.id == resource_data.lecture_id).first()
        if not lecture:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lecture not found"
            )
        
        # Check if user is the instructor of the course
        if lecture.section.course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the course instructor can add resources"
            )
        
        # Create the resource
        resource = LectureResource(
            lecture_id=resource_data.lecture_id,
            title=resource_data.title,
            description=resource_data.description,
            resource_type=resource_data.resource_type,
            file_url=resource_data.file_url,
            file_name=resource_data.file_name,
            file_size=resource_data.file_size,
            mime_type=resource_data.mime_type,
            is_downloadable=resource_data.is_downloadable
        )
        
        db.add(resource)
        db.commit()
        db.refresh(resource)
        
        return resource

    @staticmethod
    def get_resource(db: Session, resource_id: int) -> LectureResource:
        """
        Get a specific resource by ID.
        
        Args:
            db: Database session
            resource_id: ID of the resource to retrieve
            
        Returns:
            Resource object
            
        Raises:
            HTTPException: If resource not found
        """
        resource = db.query(LectureResource).filter(LectureResource.id == resource_id).first()
        
        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resource not found"
            )
        
        return resource

    @staticmethod
    def update_resource(db: Session, user_id: int, resource_id: int, resource_data: LectureResourceUpdate) -> LectureResource:
        """
        Update an existing resource.
        
        Args:
            db: Database session
            user_id: ID of the user updating the resource
            resource_id: ID of the resource to update
            resource_data: Resource update data
            
        Returns:
            Updated resource object
            
        Raises:
            HTTPException: If resource not found or access denied
        """
        resource = ResourceService.get_resource(db, resource_id)
        
        # Check if user is the instructor of the course
        if resource.lecture.section.course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the course instructor can update resources"
            )
        
        # Update fields if provided
        if resource_data.title is not None:
            resource.title = resource_data.title
        if resource_data.description is not None:
            resource.description = resource_data.description
        if resource_data.resource_type is not None:
            resource.resource_type = resource_data.resource_type
        if resource_data.is_downloadable is not None:
            resource.is_downloadable = resource_data.is_downloadable
        
        db.commit()
        db.refresh(resource)
        
        return resource

    @staticmethod
    def delete_resource(db: Session, user_id: int, resource_id: int) -> bool:
        """
        Delete a resource.
        
        Args:
            db: Database session
            user_id: ID of the user deleting the resource
            resource_id: ID of the resource to delete
            
        Returns:
            True if deleted successfully
            
        Raises:
            HTTPException: If resource not found or access denied
        """
        resource = ResourceService.get_resource(db, resource_id)
        
        # Check if user is the instructor of the course
        if resource.lecture.section.course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the course instructor can delete resources"
            )
        
        db.delete(resource)
        db.commit()
        
        return True

    @staticmethod
    def get_lecture_resources(db: Session, user_id: int, lecture_id: int) -> list[LectureResource]:
        """
        Get all resources for a specific lecture.
        
        Args:
            db: Database session
            user_id: ID of the user requesting resources
            lecture_id: ID of the lecture
            
        Returns:
            List of resources for the lecture
            
        Raises:
            HTTPException: If lecture not found or user not enrolled
        """
        # Verify lecture exists
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
        if not lecture:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lecture not found"
            )
        
        # Check if user is enrolled in the course or is the instructor
        course_id = lecture.section.course_id
        enrollment = db.query(Enrollment).filter(
            and_(
                Enrollment.user_id == user_id,
                Enrollment.course_id == course_id
            )
        ).first()
        
        is_instructor = lecture.section.course.instructor_id == user_id
        
        if not enrollment and not is_instructor:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be enrolled in this course to view resources"
            )
        
        return db.query(LectureResource).filter(
            LectureResource.lecture_id == lecture_id
        ).order_by(LectureResource.created_at.asc()).all()

    @staticmethod
    def download_resource(
        db: Session, 
        user_id: int, 
        resource_id: int, 
        download_data: Optional[ResourceDownloadCreate] = None
    ) -> tuple[LectureResource, str]:
        """
        Process a resource download request.
        
        Args:
            db: Database session
            user_id: ID of the user downloading the resource
            resource_id: ID of the resource to download
            download_data: Optional download metadata
            
        Returns:
            Tuple of (resource object, download URL)
            
        Raises:
            HTTPException: If resource not found, not downloadable, or user not enrolled
        """
        resource = ResourceService.get_resource(db, resource_id)
        
        # Check if resource is downloadable
        if not resource.is_downloadable:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This resource is not available for download"
            )
        
        # Check if user is enrolled in the course or is the instructor
        course_id = resource.lecture.section.course_id
        enrollment = db.query(Enrollment).filter(
            and_(
                Enrollment.user_id == user_id,
                Enrollment.course_id == course_id
            )
        ).first()
        
        is_instructor = resource.lecture.section.course.instructor_id == user_id
        
        if not enrollment and not is_instructor:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be enrolled in this course to download resources"
            )
        
        # Record the download
        download_record = ResourceDownload(
            user_id=user_id,
            resource_id=resource_id,
            ip_address=download_data.ip_address if download_data else None,
            user_agent=download_data.user_agent if download_data else None
        )
        
        db.add(download_record)
        
        # Increment download count
        resource.download_count += 1
        
        db.commit()
        
        return resource, resource.file_url