"""
Database optimization utilities for improved performance.
"""

from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy import text, Index, Column
from sqlalchemy.orm import Session, Query
from sqlalchemy.sql import func
import logging

logger = logging.getLogger(__name__)


class DatabaseOptimizer:
    """
    Utility class for database performance optimization.
    """
    
    @staticmethod
    def create_indexes(db: Session) -> None:
        """
        Create performance indexes for the LMS database.
        
        Args:
            db: Database session
        """
        indexes = [
            # User indexes
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
            "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)",
            "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
            "CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)",
            "CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)",
            
            # Course indexes
            "CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id)",
            "CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id)",
            "CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published)",
            "CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at)",
            "CREATE INDEX IF NOT EXISTS idx_courses_price ON courses(price)",
            "CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON courses(difficulty_level)",
            
            # Enrollment indexes
            "CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id)",
            "CREATE INDEX IF NOT EXISTS idx_enrollments_date ON enrollments(enrolled_at)",
            "CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON enrollments(user_id, course_id)",
            
            # Progress indexes
            "CREATE INDEX IF NOT EXISTS idx_course_progress_user ON course_progress(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_course_progress_course ON course_progress(course_id)",
            "CREATE INDEX IF NOT EXISTS idx_course_progress_user_course ON course_progress(user_id, course_id)",
            "CREATE INDEX IF NOT EXISTS idx_lecture_progress_user ON lecture_progress(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_lecture_progress_lecture ON lecture_progress(lecture_id)",
            
            # Transaction indexes
            "CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_transactions_course ON transactions(course_id)",
            "CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at)",
            "CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)",
            
            # Quiz indexes
            "CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id)",
            "CREATE INDEX IF NOT EXISTS idx_quiz_attempts_date ON quiz_attempts(attempted_at)",
            
            # Audit log indexes
            "CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_audit_logs_method ON audit_logs(method)",
            "CREATE INDEX IF NOT EXISTS idx_audit_logs_path ON audit_logs(path)",
            "CREATE INDEX IF NOT EXISTS idx_audit_logs_client_ip ON audit_logs(client_ip)",
            
            # Security event indexes
            "CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type)",
            "CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity)",
            "CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved)",
            
            # Composite indexes for common queries
            "CREATE INDEX IF NOT EXISTS idx_courses_published_category ON courses(is_published, category_id)",
            "CREATE INDEX IF NOT EXISTS idx_courses_published_price ON courses(is_published, price)",
            "CREATE INDEX IF NOT EXISTS idx_enrollments_user_date ON enrollments(user_id, enrolled_at)",
            "CREATE INDEX IF NOT EXISTS idx_transactions_user_status ON transactions(user_id, status)",
        ]
        
        for index_sql in indexes:
            try:
                db.execute(text(index_sql))
                logger.info(f"Created index: {index_sql}")
            except Exception as e:
                logger.error(f"Failed to create index: {index_sql}, Error: {e}")
        
        db.commit()
    
    @staticmethod
    def analyze_query_performance(db: Session, query: str) -> Dict[str, Any]:
        """
        Analyze query performance using EXPLAIN.
        
        Args:
            db: Database session
            query: SQL query to analyze
            
        Returns:
            Dict containing query analysis results
        """
        try:
            # Execute EXPLAIN for the query
            explain_result = db.execute(text(f"EXPLAIN {query}")).fetchall()
            
            analysis = {
                'query': query,
                'explain_output': [dict(row) for row in explain_result],
                'recommendations': []
            }
            
            # Analyze the explain output for common issues
            for row in explain_result:
                row_dict = dict(row)
                
                # Check for full table scans
                if 'ALL' in str(row_dict.get('type', '')):
                    analysis['recommendations'].append(
                        f"Full table scan detected on table {row_dict.get('table', 'unknown')}. Consider adding indexes."
                    )
                
                # Check for filesort
                if 'filesort' in str(row_dict.get('Extra', '')).lower():
                    analysis['recommendations'].append(
                        "Filesort detected. Consider adding indexes for ORDER BY clauses."
                    )
                
                # Check for temporary tables
                if 'temporary' in str(row_dict.get('Extra', '')).lower():
                    analysis['recommendations'].append(
                        "Temporary table creation detected. Consider optimizing JOIN conditions."
                    )
            
            return analysis
            
        except Exception as e:
            logger.error(f"Failed to analyze query: {e}")
            return {'error': str(e)}
    
    @staticmethod
    def get_slow_queries(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get slow queries from the database (MySQL specific).
        
        Args:
            db: Database session
            limit: Number of slow queries to return
            
        Returns:
            List of slow query information
        """
        try:
            # Enable slow query log analysis
            slow_queries = db.execute(text("""
                SELECT 
                    sql_text,
                    exec_count,
                    avg_timer_wait / 1000000000 as avg_time_seconds,
                    sum_timer_wait / 1000000000 as total_time_seconds,
                    sum_rows_examined,
                    sum_rows_sent
                FROM performance_schema.events_statements_summary_by_digest 
                WHERE schema_name = DATABASE()
                ORDER BY avg_timer_wait DESC 
                LIMIT :limit
            """), {'limit': limit}).fetchall()
            
            return [dict(row) for row in slow_queries]
            
        except Exception as e:
            logger.error(f"Failed to get slow queries: {e}")
            return []
    
    @staticmethod
    def optimize_table(db: Session, table_name: str) -> bool:
        """
        Optimize a specific table.
        
        Args:
            db: Database session
            table_name: Name of the table to optimize
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            db.execute(text(f"OPTIMIZE TABLE {table_name}"))
            db.commit()
            logger.info(f"Optimized table: {table_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to optimize table {table_name}: {e}")
            return False
    
    @staticmethod
    def get_table_statistics(db: Session) -> List[Dict[str, Any]]:
        """
        Get table statistics for performance monitoring.
        
        Args:
            db: Database session
            
        Returns:
            List of table statistics
        """
        try:
            stats = db.execute(text("""
                SELECT 
                    table_name,
                    table_rows,
                    data_length,
                    index_length,
                    (data_length + index_length) as total_size,
                    avg_row_length
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
                ORDER BY (data_length + index_length) DESC
            """)).fetchall()
            
            return [dict(row) for row in stats]
            
        except Exception as e:
            logger.error(f"Failed to get table statistics: {e}")
            return []


class QueryOptimizer:
    """
    Utility class for optimizing SQLAlchemy queries.
    """
    
    @staticmethod
    def add_eager_loading(query: Query, relationships: List[str]) -> Query:
        """
        Add eager loading to a query to prevent N+1 problems.
        
        Args:
            query: SQLAlchemy query
            relationships: List of relationship names to eager load
            
        Returns:
            Query with eager loading applied
        """
        from sqlalchemy.orm import joinedload
        
        for relationship in relationships:
            query = query.options(joinedload(relationship))
        
        return query
    
    @staticmethod
    def add_pagination(query: Query, page: int, per_page: int) -> Tuple[Query, Dict[str, Any]]:
        """
        Add pagination to a query with metadata.
        
        Args:
            query: SQLAlchemy query
            page: Page number (1-based)
            per_page: Items per page
            
        Returns:
            Tuple of (paginated query, pagination metadata)
        """
        # Get total count
        total = query.count()
        
        # Calculate pagination metadata
        total_pages = (total + per_page - 1) // per_page
        has_prev = page > 1
        has_next = page < total_pages
        
        # Apply pagination
        offset = (page - 1) * per_page
        paginated_query = query.offset(offset).limit(per_page)
        
        metadata = {
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': total_pages,
            'has_prev': has_prev,
            'has_next': has_next,
            'prev_page': page - 1 if has_prev else None,
            'next_page': page + 1 if has_next else None
        }
        
        return paginated_query, metadata
    
    @staticmethod
    def optimize_course_listing_query(db: Session, filters: Dict[str, Any]) -> Query:
        """
        Create an optimized query for course listing with filters.
        
        Args:
            db: Database session
            filters: Dictionary of filters to apply
            
        Returns:
            Optimized SQLAlchemy query
        """
        from ..models.course import Course
        from ..models.user import User
        from ..models.category import Category
        from sqlalchemy.orm import joinedload
        
        # Base query with eager loading
        query = db.query(Course).options(
            joinedload(Course.instructor),
            joinedload(Course.category)
        )
        
        # Apply filters
        if filters.get('is_published'):
            query = query.filter(Course.is_published == True)
        
        if filters.get('category_id'):
            query = query.filter(Course.category_id == filters['category_id'])
        
        if filters.get('instructor_id'):
            query = query.filter(Course.instructor_id == filters['instructor_id'])
        
        if filters.get('min_price') is not None:
            query = query.filter(Course.price >= filters['min_price'])
        
        if filters.get('max_price') is not None:
            query = query.filter(Course.price <= filters['max_price'])
        
        if filters.get('difficulty_level'):
            query = query.filter(Course.difficulty_level == filters['difficulty_level'])
        
        if filters.get('search'):
            search_term = f"%{filters['search']}%"
            query = query.filter(
                Course.title.ilike(search_term) |
                Course.description.ilike(search_term)
            )
        
        # Apply sorting
        sort_by = filters.get('sort_by', 'created_at')
        sort_order = filters.get('sort_order', 'desc')
        
        if hasattr(Course, sort_by):
            column = getattr(Course, sort_by)
            if sort_order.lower() == 'desc':
                query = query.order_by(column.desc())
            else:
                query = query.order_by(column.asc())
        
        return query
    
    @staticmethod
    def optimize_user_progress_query(db: Session, user_id: int) -> Query:
        """
        Create an optimized query for user progress data.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Optimized SQLAlchemy query
        """
        from ..models.enrollment import Enrollment
        from ..models.course_progress import CourseProgress
        from ..models.course import Course
        from sqlalchemy.orm import joinedload
        
        query = db.query(Enrollment).filter(
            Enrollment.user_id == user_id
        ).options(
            joinedload(Enrollment.course).joinedload(Course.sections),
            joinedload(Enrollment.progress)
        ).order_by(Enrollment.enrolled_at.desc())
        
        return query


def setup_database_optimization(db: Session) -> None:
    """
    Set up database optimization including indexes and configuration.
    
    Args:
        db: Database session
    """
    logger.info("Setting up database optimization...")
    
    # Create performance indexes
    DatabaseOptimizer.create_indexes(db)
    
    # Set MySQL configuration for better performance
    try:
        performance_configs = [
            "SET SESSION query_cache_type = ON",
            "SET SESSION query_cache_size = 67108864",  # 64MB
            "SET SESSION sort_buffer_size = 2097152",   # 2MB
            "SET SESSION read_buffer_size = 131072",    # 128KB
            "SET SESSION join_buffer_size = 262144",    # 256KB
        ]
        
        for config in performance_configs:
            try:
                db.execute(text(config))
            except Exception as e:
                logger.warning(f"Could not set configuration {config}: {e}")
        
        db.commit()
        logger.info("Database optimization setup completed")
        
    except Exception as e:
        logger.error(f"Failed to set up database optimization: {e}")


def monitor_database_performance(db: Session) -> Dict[str, Any]:
    """
    Monitor database performance and return metrics.
    
    Args:
        db: Database session
        
    Returns:
        Dict containing performance metrics
    """
    metrics = {
        'timestamp': func.now(),
        'table_stats': DatabaseOptimizer.get_table_statistics(db),
        'slow_queries': DatabaseOptimizer.get_slow_queries(db),
    }
    
    # Add connection pool stats if available
    try:
        pool_stats = db.execute(text("""
            SELECT 
                VARIABLE_NAME,
                VARIABLE_VALUE
            FROM information_schema.SESSION_STATUS 
            WHERE VARIABLE_NAME IN (
                'Threads_connected',
                'Threads_running',
                'Max_used_connections',
                'Queries',
                'Questions'
            )
        """)).fetchall()
        
        metrics['connection_stats'] = {row[0]: row[1] for row in pool_stats}
        
    except Exception as e:
        logger.error(f"Failed to get connection stats: {e}")
        metrics['connection_stats'] = {}
    
    return metrics