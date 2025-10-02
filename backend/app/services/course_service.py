"""
Course service for handling course management business logic.
"""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc
from fastapi import HTTPException, status
from datetime import datetime

from ..models.course import Course, CourseCategory, Section, Lecture, CourseStatus
from ..models.user import User, UserRole
from ..models.taxonomy import Tag
from ..schemas.course import (
    CourseCreate, 
    CourseUpdate, 
    CourseStatusUpdate,
    CourseSearchFilters,
    SectionCreate,
    SectionUpdate,
    LectureCreate,
    LectureUpdate,
    CourseCategoryCreate,
    CourseCategoryUpdate
)


class CourseService:
    """Service class for course management operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Course Category Methods
    def create_category(self, category_data: CourseCategoryCreate) -> CourseCategory:
        """
        Create a new course category.
        
        Args:
            category_data: Category creation data
            
        Returns:
            CourseCategory: Created category
            
        Raises:
            HTTPException: If category name already exists
        """
        # Check if category name already exists
        existing_category = self.db.query(CourseCategory).filter(
            CourseCategory.name == category_data.name
        ).first()
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category name already exists"
            )
        
        # Validate parent category exists if provided
        if category_data.parent_id:
            parent_category = self.db.query(CourseCategory).filter(
                CourseCategory.id == category_data.parent_id
            ).first()
            if not parent_category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent category not found"
                )
        
        category = CourseCategory(**category_data.model_dump())
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category
    
    def get_categories(self, include_inactive: bool = False) -> List[CourseCategory]:
        """Get all course categories."""
        query = self.db.query(CourseCategory)
        if not include_inactive:
            query = query.filter(CourseCategory.is_active == True)
        return query.order_by(CourseCategory.name).all()
    
    def get_category_by_id(self, category_id: int) -> Optional[CourseCategory]:
        """Get category by ID."""
        return self.db.query(CourseCategory).filter(CourseCategory.id == category_id).first()
    
    def update_category(self, category_id: int, category_data: CourseCategoryUpdate) -> CourseCategory:
        """Update course category."""
        category = self.get_category_by_id(category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        # Check name uniqueness if name is being updated
        if category_data.name and category_data.name != category.name:
            existing_category = self.db.query(CourseCategory).filter(
                and_(
                    CourseCategory.name == category_data.name,
                    CourseCategory.id != category_id
                )
            ).first()
            if existing_category:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category name already exists"
                )
        
        # Update category fields
        update_data = category_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(category, field, value)
        
        self.db.commit()
        self.db.refresh(category)
        return category
    
    def delete_category(self, category_id: int) -> bool:
        """Delete course category."""
        category = self.get_category_by_id(category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        # Check if category has courses
        course_count = self.db.query(Course).filter(Course.category_id == category_id).count()
        if course_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete category with associated courses"
            )
        
        self.db.delete(category)
        self.db.commit()
        return True
    
    # Course Methods
    def create_course(self, course_data: CourseCreate, instructor_id: int) -> Course:
        """
        Create a new course.
        
        Args:
            course_data: Course creation data
            instructor_id: ID of the instructor creating the course
            
        Returns:
            Course: Created course
            
        Raises:
            HTTPException: If instructor not found or invalid category
        """
        # Verify instructor exists and has instructor role
        instructor = self.db.query(User).filter(
            and_(
                User.id == instructor_id,
                User.role.in_([UserRole.INSTRUCTOR, UserRole.SUPER_ADMIN])
            )
        ).first()
        if not instructor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Instructor not found or insufficient permissions"
            )
        
        # Validate category if provided
        if course_data.category_id:
            category = self.get_category_by_id(course_data.category_id)
            if not category or not category.is_active:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found or inactive"
                )
        
        course_dict = course_data.model_dump()
        course_dict['instructor_id'] = instructor_id
        
        # Extract tag_ids before creating course
        tag_ids = course_dict.pop('tag_ids', None)
        
        course = Course(**course_dict)
        
        # Assign tags if provided
        if tag_ids:
            tags = self.db.query(Tag).filter(
                and_(
                    Tag.id.in_(tag_ids),
                    Tag.is_active == True
                )
            ).all()
            course.tags = tags
        
        self.db.add(course)
        self.db.commit()
        self.db.refresh(course)
        return course
    
    def get_courses(
        self, 
        filters: Optional[CourseSearchFilters] = None,
        instructor_id: Optional[int] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[Course], int]:
        """
        Get courses with optional filtering and pagination.
        
        Args:
            filters: Search and filter criteria
            instructor_id: Filter by specific instructor
            page: Page number
            per_page: Items per page
            
        Returns:
            Tuple of (courses, total_count)
        """
        query = self.db.query(Course)
        
        # Apply instructor filter
        if instructor_id:
            query = query.filter(Course.instructor_id == instructor_id)
        
        # Apply search filters
        if filters:
            if filters.search:
                search_term = f"%{filters.search}%"
                query = query.filter(
                    or_(
                        Course.title.ilike(search_term),
                        Course.description.ilike(search_term),
                        Course.short_description.ilike(search_term)
                    )
                )
            
            if filters.category_id:
                query = query.filter(Course.category_id == filters.category_id)
            
            if filters.status:
                query = query.filter(Course.status == filters.status)
            
            if filters.difficulty_level:
                query = query.filter(Course.difficulty_level == filters.difficulty_level)
            
            if filters.is_free is not None:
                if filters.is_free:
                    query = query.filter(Course.price == 0)
                else:
                    query = query.filter(Course.price > 0)
            
            if filters.is_featured is not None:
                query = query.filter(Course.is_featured == filters.is_featured)
            
            if filters.min_price is not None:
                query = query.filter(Course.price >= filters.min_price)
            
            if filters.max_price is not None:
                query = query.filter(Course.price <= filters.max_price)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        courses = query.order_by(desc(Course.created_at)).offset(
            (page - 1) * per_page
        ).limit(per_page).all()
        
        return courses, total
    
    def get_course_by_id(self, course_id: int, include_sections: bool = False) -> Optional[Course]:
        """Get course by ID with optional sections."""
        query = self.db.query(Course)
        if include_sections:
            query = query.options(
                joinedload(Course.sections).joinedload(Section.lectures)
            )
        return query.filter(Course.id == course_id).first()
    
    def update_course(self, course_id: int, course_data: CourseUpdate, user_id: int) -> Course:
        """Update course information."""
        course = self.get_course_by_id(course_id)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Check permissions (instructor owns course or is super admin)
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.role != UserRole.SUPER_ADMIN and course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to update this course"
            )
        
        # Validate category if being updated
        if course_data.category_id:
            category = self.get_category_by_id(course_data.category_id)
            if not category or not category.is_active:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found or inactive"
                )
        
        # Update course fields
        update_data = course_data.model_dump(exclude_unset=True)
        
        # Handle tag updates separately
        tag_ids = update_data.pop('tag_ids', None)
        
        for field, value in update_data.items():
            setattr(course, field, value)
        
        # Update tags if provided
        if tag_ids is not None:
            tags = self.db.query(Tag).filter(
                and_(
                    Tag.id.in_(tag_ids),
                    Tag.is_active == True
                )
            ).all()
            course.tags = tags
        
        self.db.commit()
        self.db.refresh(course)
        return course
    
    def update_course_status(self, course_id: int, status_data: CourseStatusUpdate, user_id: int) -> Course:
        """Update course status (publish/unpublish)."""
        course = self.get_course_by_id(course_id)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Check permissions
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.role != UserRole.SUPER_ADMIN and course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to update this course"
            )
        
        # Update status
        course.status = status_data.status
        if status_data.status == CourseStatus.PUBLISHED and not course.published_at:
            course.published_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(course)
        return course
    
    def delete_course(self, course_id: int, user_id: int) -> bool:
        """Delete course."""
        course = self.get_course_by_id(course_id)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Check permissions
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.role != UserRole.SUPER_ADMIN and course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to delete this course"
            )
        
        # Check if course has enrollments
        from ..models.enrollment import Enrollment
        enrollment_count = self.db.query(Enrollment).filter(Enrollment.course_id == course_id).count()
        if enrollment_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete course with active enrollments"
            )
        
        self.db.delete(course)
        self.db.commit()
        return True    

    # Section Methods
    def create_section(self, course_id: int, section_data: SectionCreate, user_id: int) -> Section:
        """Create a new section in a course."""
        course = self.get_course_by_id(course_id)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Check permissions
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.role != UserRole.SUPER_ADMIN and course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to add sections to this course"
            )
        
        section_dict = section_data.model_dump()
        section_dict['course_id'] = course_id
        section = Section(**section_dict)
        
        self.db.add(section)
        self.db.commit()
        self.db.refresh(section)
        return section
    
    def get_sections_by_course(self, course_id: int) -> List[Section]:
        """Get all sections for a course."""
        return self.db.query(Section).filter(
            Section.course_id == course_id
        ).order_by(Section.order_index).all()
    
    def get_section_by_id(self, section_id: int) -> Optional[Section]:
        """Get section by ID."""
        return self.db.query(Section).filter(Section.id == section_id).first()
    
    def update_section(self, section_id: int, section_data: SectionUpdate, user_id: int) -> Section:
        """Update section information."""
        section = self.get_section_by_id(section_id)
        if not section:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Section not found"
            )
        
        # Check permissions through course
        course = self.get_course_by_id(section.course_id)
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.role != UserRole.SUPER_ADMIN and course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to update this section"
            )
        
        # Update section fields
        update_data = section_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(section, field, value)
        
        self.db.commit()
        self.db.refresh(section)
        return section
    
    def delete_section(self, section_id: int, user_id: int) -> bool:
        """Delete section."""
        section = self.get_section_by_id(section_id)
        if not section:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Section not found"
            )
        
        # Check permissions through course
        course = self.get_course_by_id(section.course_id)
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.role != UserRole.SUPER_ADMIN and course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to delete this section"
            )
        
        self.db.delete(section)
        self.db.commit()
        
        # Update course totals
        self._update_course_totals(section.course_id)
        return True
    
    # Lecture Methods
    def create_lecture(self, section_id: int, lecture_data: LectureCreate, user_id: int) -> Lecture:
        """Create a new lecture in a section."""
        section = self.get_section_by_id(section_id)
        if not section:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Section not found"
            )
        
        # Check permissions through course
        course = self.get_course_by_id(section.course_id)
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.role != UserRole.SUPER_ADMIN and course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to add lectures to this section"
            )
        
        lecture_dict = lecture_data.model_dump()
        lecture_dict['section_id'] = section_id
        lecture = Lecture(**lecture_dict)
        
        self.db.add(lecture)
        self.db.commit()
        self.db.refresh(lecture)
        
        # Update section and course totals
        self._update_section_totals(section_id)
        self._update_course_totals(section.course_id)
        
        return lecture
    
    def get_lectures_by_section(self, section_id: int) -> List[Lecture]:
        """Get all lectures for a section."""
        return self.db.query(Lecture).filter(
            Lecture.section_id == section_id
        ).order_by(Lecture.order_index).all()
    
    def get_lecture_by_id(self, lecture_id: int) -> Optional[Lecture]:
        """Get lecture by ID."""
        return self.db.query(Lecture).filter(Lecture.id == lecture_id).first()
    
    def update_lecture(self, lecture_id: int, lecture_data: LectureUpdate, user_id: int) -> Lecture:
        """Update lecture information."""
        lecture = self.get_lecture_by_id(lecture_id)
        if not lecture:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lecture not found"
            )
        
        # Check permissions through section and course
        section = self.get_section_by_id(lecture.section_id)
        course = self.get_course_by_id(section.course_id)
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.role != UserRole.SUPER_ADMIN and course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to update this lecture"
            )
        
        # Store old duration for totals update
        old_duration = lecture.duration
        
        # Update lecture fields
        update_data = lecture_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(lecture, field, value)
        
        self.db.commit()
        self.db.refresh(lecture)
        
        # Update totals if duration changed
        if old_duration != lecture.duration:
            self._update_section_totals(lecture.section_id)
            self._update_course_totals(section.course_id)
        
        return lecture
    
    def delete_lecture(self, lecture_id: int, user_id: int) -> bool:
        """Delete lecture."""
        lecture = self.get_lecture_by_id(lecture_id)
        if not lecture:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lecture not found"
            )
        
        # Check permissions through section and course
        section = self.get_section_by_id(lecture.section_id)
        course = self.get_course_by_id(section.course_id)
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.role != UserRole.SUPER_ADMIN and course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to delete this lecture"
            )
        
        section_id = lecture.section_id
        course_id = section.course_id
        
        self.db.delete(lecture)
        self.db.commit()
        
        # Update section and course totals
        self._update_section_totals(section_id)
        self._update_course_totals(course_id)
        
        return True
    
    # Helper Methods
    def _update_section_totals(self, section_id: int):
        """Update section total duration and lecture count."""
        section = self.get_section_by_id(section_id)
        if section:
            lectures = self.get_lectures_by_section(section_id)
            section.total_duration = sum(lecture.duration for lecture in lectures)
            section.total_lectures = len(lectures)
            self.db.commit()
    
    def _update_course_totals(self, course_id: int):
        """Update course total duration and lecture count."""
        course = self.get_course_by_id(course_id)
        if course:
            sections = self.get_sections_by_course(course_id)
            course.total_duration = sum(section.total_duration for section in sections)
            course.total_lectures = sum(section.total_lectures for section in sections)
            self.db.commit()