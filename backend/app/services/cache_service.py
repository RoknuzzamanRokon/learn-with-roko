"""
Redis caching service for performance optimization.
"""

import json
import pickle
from typing import Any, Optional, Union, List, Dict
from datetime import datetime, timedelta
import redis
from functools import wraps
import hashlib
import logging

logger = logging.getLogger(__name__)


class CacheService:
    """
    Redis-based caching service for the LMS application.
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        """
        Initialize the cache service.
        
        Args:
            redis_url: Redis connection URL
        """
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=False)
            # Test connection
            self.redis_client.ping()
            logger.info("Redis cache service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
    
    def is_available(self) -> bool:
        """
        Check if Redis is available.
        
        Returns:
            bool: True if Redis is available, False otherwise
        """
        if not self.redis_client:
            return False
        
        try:
            self.redis_client.ping()
            return True
        except Exception:
            return False
    
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """
        Set a value in the cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (default: 1 hour)
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.is_available():
            return False
        
        try:
            # Serialize the value
            serialized_value = pickle.dumps(value)
            
            # Set with TTL
            result = self.redis_client.setex(key, ttl, serialized_value)
            return result
        except Exception as e:
            logger.error(f"Failed to set cache key {key}: {e}")
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get a value from the cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found
        """
        if not self.is_available():
            return None
        
        try:
            serialized_value = self.redis_client.get(key)
            if serialized_value is None:
                return None
            
            # Deserialize the value
            return pickle.loads(serialized_value)
        except Exception as e:
            logger.error(f"Failed to get cache key {key}: {e}")
            return None
    
    def delete(self, key: str) -> bool:
        """
        Delete a key from the cache.
        
        Args:
            key: Cache key to delete
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.is_available():
            return False
        
        try:
            result = self.redis_client.delete(key)
            return result > 0
        except Exception as e:
            logger.error(f"Failed to delete cache key {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching a pattern.
        
        Args:
            pattern: Pattern to match (e.g., "user:*")
            
        Returns:
            int: Number of keys deleted
        """
        if not self.is_available():
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Failed to delete keys with pattern {pattern}: {e}")
            return 0
    
    def exists(self, key: str) -> bool:
        """
        Check if a key exists in the cache.
        
        Args:
            key: Cache key
            
        Returns:
            bool: True if key exists, False otherwise
        """
        if not self.is_available():
            return False
        
        try:
            return self.redis_client.exists(key) > 0
        except Exception as e:
            logger.error(f"Failed to check existence of cache key {key}: {e}")
            return False
    
    def increment(self, key: str, amount: int = 1, ttl: Optional[int] = None) -> Optional[int]:
        """
        Increment a numeric value in the cache.
        
        Args:
            key: Cache key
            amount: Amount to increment by
            ttl: Time to live in seconds (only set if key doesn't exist)
            
        Returns:
            New value or None if failed
        """
        if not self.is_available():
            return None
        
        try:
            # Use pipeline for atomic operations
            pipe = self.redis_client.pipeline()
            pipe.incrby(key, amount)
            
            # Set TTL only if key didn't exist before
            if ttl and not self.exists(key):
                pipe.expire(key, ttl)
            
            results = pipe.execute()
            return results[0]
        except Exception as e:
            logger.error(f"Failed to increment cache key {key}: {e}")
            return None
    
    def set_hash(self, key: str, field: str, value: Any, ttl: int = 3600) -> bool:
        """
        Set a field in a hash.
        
        Args:
            key: Hash key
            field: Field name
            value: Field value
            ttl: Time to live in seconds
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.is_available():
            return False
        
        try:
            serialized_value = pickle.dumps(value)
            
            # Use pipeline for atomic operations
            pipe = self.redis_client.pipeline()
            pipe.hset(key, field, serialized_value)
            pipe.expire(key, ttl)
            
            results = pipe.execute()
            return results[0]
        except Exception as e:
            logger.error(f"Failed to set hash field {key}:{field}: {e}")
            return False
    
    def get_hash(self, key: str, field: str) -> Optional[Any]:
        """
        Get a field from a hash.
        
        Args:
            key: Hash key
            field: Field name
            
        Returns:
            Field value or None if not found
        """
        if not self.is_available():
            return None
        
        try:
            serialized_value = self.redis_client.hget(key, field)
            if serialized_value is None:
                return None
            
            return pickle.loads(serialized_value)
        except Exception as e:
            logger.error(f"Failed to get hash field {key}:{field}: {e}")
            return None
    
    def get_all_hash(self, key: str) -> Dict[str, Any]:
        """
        Get all fields from a hash.
        
        Args:
            key: Hash key
            
        Returns:
            Dictionary of field-value pairs
        """
        if not self.is_available():
            return {}
        
        try:
            hash_data = self.redis_client.hgetall(key)
            result = {}
            
            for field, serialized_value in hash_data.items():
                try:
                    field_str = field.decode('utf-8') if isinstance(field, bytes) else field
                    result[field_str] = pickle.loads(serialized_value)
                except Exception as e:
                    logger.error(f"Failed to deserialize hash field {field}: {e}")
            
            return result
        except Exception as e:
            logger.error(f"Failed to get all hash fields for {key}: {e}")
            return {}


# Global cache service instance
cache_service = CacheService()


def cache_result(ttl: int = 3600, key_prefix: str = ""):
    """
    Decorator to cache function results.
    
    Args:
        ttl: Time to live in seconds
        key_prefix: Prefix for cache key
        
    Returns:
        Decorated function
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key based on function name and arguments
            key_parts = [key_prefix, func.__name__]
            
            # Add arguments to key
            if args:
                key_parts.extend([str(arg) for arg in args])
            
            if kwargs:
                sorted_kwargs = sorted(kwargs.items())
                key_parts.extend([f"{k}:{v}" for k, v in sorted_kwargs])
            
            # Create hash of the key to ensure consistent length
            key_string = ":".join(key_parts)
            cache_key = hashlib.md5(key_string.encode()).hexdigest()
            
            # Try to get from cache
            cached_result = cache_service.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache_service.set(cache_key, result, ttl)
            
            return result
        
        return wrapper
    return decorator


def invalidate_cache_pattern(pattern: str):
    """
    Invalidate all cache keys matching a pattern.
    
    Args:
        pattern: Pattern to match
    """
    cache_service.delete_pattern(pattern)


# Specific cache utilities for common LMS operations
class LMSCache:
    """
    LMS-specific caching utilities.
    """
    
    @staticmethod
    def cache_user(user_id: int, user_data: Dict[str, Any], ttl: int = 1800):
        """Cache user data."""
        cache_service.set(f"user:{user_id}", user_data, ttl)
    
    @staticmethod
    def get_cached_user(user_id: int) -> Optional[Dict[str, Any]]:
        """Get cached user data."""
        return cache_service.get(f"user:{user_id}")
    
    @staticmethod
    def invalidate_user_cache(user_id: int):
        """Invalidate user cache."""
        cache_service.delete_pattern(f"user:{user_id}*")
    
    @staticmethod
    def cache_course(course_id: int, course_data: Dict[str, Any], ttl: int = 3600):
        """Cache course data."""
        cache_service.set(f"course:{course_id}", course_data, ttl)
    
    @staticmethod
    def get_cached_course(course_id: int) -> Optional[Dict[str, Any]]:
        """Get cached course data."""
        return cache_service.get(f"course:{course_id}")
    
    @staticmethod
    def invalidate_course_cache(course_id: int):
        """Invalidate course cache."""
        cache_service.delete_pattern(f"course:{course_id}*")
    
    @staticmethod
    def cache_course_list(filters_hash: str, course_list: List[Dict[str, Any]], ttl: int = 600):
        """Cache course list with filters."""
        cache_service.set(f"courses:list:{filters_hash}", course_list, ttl)
    
    @staticmethod
    def get_cached_course_list(filters_hash: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached course list."""
        return cache_service.get(f"courses:list:{filters_hash}")
    
    @staticmethod
    def cache_user_progress(user_id: int, course_id: int, progress_data: Dict[str, Any], ttl: int = 300):
        """Cache user progress data."""
        cache_service.set(f"progress:{user_id}:{course_id}", progress_data, ttl)
    
    @staticmethod
    def get_cached_user_progress(user_id: int, course_id: int) -> Optional[Dict[str, Any]]:
        """Get cached user progress data."""
        return cache_service.get(f"progress:{user_id}:{course_id}")
    
    @staticmethod
    def invalidate_user_progress_cache(user_id: int, course_id: Optional[int] = None):
        """Invalidate user progress cache."""
        if course_id:
            cache_service.delete(f"progress:{user_id}:{course_id}")
        else:
            cache_service.delete_pattern(f"progress:{user_id}:*")
    
    @staticmethod
    def cache_analytics_data(key: str, data: Dict[str, Any], ttl: int = 1800):
        """Cache analytics data."""
        cache_service.set(f"analytics:{key}", data, ttl)
    
    @staticmethod
    def get_cached_analytics_data(key: str) -> Optional[Dict[str, Any]]:
        """Get cached analytics data."""
        return cache_service.get(f"analytics:{key}")
    
    @staticmethod
    def increment_view_count(course_id: int) -> Optional[int]:
        """Increment course view count."""
        return cache_service.increment(f"views:course:{course_id}", 1, 86400)  # 24 hours TTL
    
    @staticmethod
    def get_view_count(course_id: int) -> int:
        """Get course view count."""
        count = cache_service.get(f"views:course:{course_id}")
        return count if count is not None else 0