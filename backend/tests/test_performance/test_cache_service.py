"""
Tests for cache service functionality.
"""

import pytest
from unittest.mock import patch, MagicMock
import time
from datetime import datetime

from app.services.cache_service import (
    CacheService,
    cache_result,
    LMSCache,
    cache_service
)


class TestCacheService:
    """Test cache service functionality."""
    
    @pytest.fixture
    def mock_redis(self):
        """Mock Redis client for testing."""
        with patch('app.services.cache_service.redis') as mock_redis:
            mock_client = MagicMock()
            mock_client.ping.return_value = True
            mock_client.setex.return_value = True
            mock_client.get.return_value = None
            mock_client.delete.return_value = 1
            mock_client.keys.return_value = []
            mock_client.exists.return_value = 0
            mock_client.incrby.return_value = 1
            mock_client.hset.return_value = 1
            mock_client.hget.return_value = None
            mock_client.hgetall.return_value = {}
            mock_redis.from_url.return_value = mock_client
            yield mock_client
    
    def test_cache_service_initialization(self, mock_redis):
        """Test cache service initialization."""
        cache = CacheService()
        assert cache.is_available()
        mock_redis.ping.assert_called_once()
    
    def test_cache_service_unavailable(self):
        """Test cache service when Redis is unavailable."""
        with patch('app.services.cache_service.redis') as mock_redis:
            mock_redis.from_url.side_effect = Exception("Connection failed")
            
            cache = CacheService()
            assert not cache.is_available()
    
    def test_set_and_get_value(self, mock_redis):
        """Test setting and getting cache values."""
        cache = CacheService()
        
        # Mock successful set
        mock_redis.setex.return_value = True
        result = cache.set("test_key", "test_value", 3600)
        assert result is True
        
        # Mock successful get
        import pickle
        mock_redis.get.return_value = pickle.dumps("test_value")
        value = cache.get("test_key")
        assert value == "test_value"
    
    def test_set_with_serialization_error(self, mock_redis):
        """Test set operation with serialization error."""
        cache = CacheService()
        
        # Mock serialization error
        with patch('pickle.dumps', side_effect=Exception("Serialization error")):
            result = cache.set("test_key", "test_value")
            assert result is False
    
    def test_get_with_deserialization_error(self, mock_redis):
        """Test get operation with deserialization error."""
        cache = CacheService()
        
        # Mock get returning invalid data
        mock_redis.get.return_value = b"invalid_pickle_data"
        
        with patch('pickle.loads', side_effect=Exception("Deserialization error")):
            value = cache.get("test_key")
            assert value is None
    
    def test_delete_key(self, mock_redis):
        """Test deleting cache keys."""
        cache = CacheService()
        
        mock_redis.delete.return_value = 1
        result = cache.delete("test_key")
        assert result is True
        
        mock_redis.delete.return_value = 0
        result = cache.delete("nonexistent_key")
        assert result is False
    
    def test_delete_pattern(self, mock_redis):
        """Test deleting keys by pattern."""
        cache = CacheService()
        
        mock_redis.keys.return_value = [b"user:1", b"user:2", b"user:3"]
        mock_redis.delete.return_value = 3
        
        deleted_count = cache.delete_pattern("user:*")
        assert deleted_count == 3
        
        mock_redis.keys.assert_called_with("user:*")
        mock_redis.delete.assert_called_with(b"user:1", b"user:2", b"user:3")
    
    def test_exists_key(self, mock_redis):
        """Test checking key existence."""
        cache = CacheService()
        
        mock_redis.exists.return_value = 1
        assert cache.exists("existing_key") is True
        
        mock_redis.exists.return_value = 0
        assert cache.exists("nonexistent_key") is False
    
    def test_increment_value(self, mock_redis):
        """Test incrementing numeric values."""
        cache = CacheService()
        
        mock_redis.incrby.return_value = 5
        result = cache.increment("counter", 5)
        assert result == 5
        
        mock_redis.incrby.assert_called_with("counter", 5)
    
    def test_hash_operations(self, mock_redis):
        """Test hash field operations."""
        cache = CacheService()
        
        # Test set hash field
        mock_redis.hset.return_value = 1
        result = cache.set_hash("hash_key", "field1", "value1")
        assert result is True
        
        # Test get hash field
        import pickle
        mock_redis.hget.return_value = pickle.dumps("value1")
        value = cache.get_hash("hash_key", "field1")
        assert value == "value1"
        
        # Test get all hash fields
        mock_redis.hgetall.return_value = {
            b"field1": pickle.dumps("value1"),
            b"field2": pickle.dumps("value2")
        }
        all_values = cache.get_all_hash("hash_key")
        assert all_values == {"field1": "value1", "field2": "value2"}


class TestCacheDecorator:
    """Test cache result decorator."""
    
    @pytest.fixture
    def mock_cache_service(self):
        """Mock cache service for testing."""
        with patch('app.services.cache_service.cache_service') as mock:
            mock.get.return_value = None
            mock.set.return_value = True
            yield mock
    
    def test_cache_result_decorator_cache_miss(self, mock_cache_service):
        """Test cache decorator with cache miss."""
        @cache_result(ttl=3600, key_prefix="test")
        def expensive_function(x, y):
            return x + y
        
        # First call should execute function and cache result
        result = expensive_function(1, 2)
        assert result == 3
        
        # Should have tried to get from cache and then set result
        mock_cache_service.get.assert_called_once()
        mock_cache_service.set.assert_called_once()
    
    def test_cache_result_decorator_cache_hit(self, mock_cache_service):
        """Test cache decorator with cache hit."""
        # Mock cache hit
        mock_cache_service.get.return_value = 42
        
        @cache_result(ttl=3600, key_prefix="test")
        def expensive_function(x, y):
            return x + y  # This should not be executed
        
        result = expensive_function(1, 2)
        assert result == 42  # Should return cached value
        
        # Should have gotten from cache but not set
        mock_cache_service.get.assert_called_once()
        mock_cache_service.set.assert_not_called()
    
    def test_cache_result_decorator_with_kwargs(self, mock_cache_service):
        """Test cache decorator with keyword arguments."""
        @cache_result(ttl=1800)
        def function_with_kwargs(a, b=10, c=20):
            return a + b + c
        
        result = function_with_kwargs(5, b=15, c=25)
        assert result == 45
        
        # Should have generated cache key including kwargs
        mock_cache_service.get.assert_called_once()
        mock_cache_service.set.assert_called_once()


class TestLMSCache:
    """Test LMS-specific cache utilities."""
    
    @pytest.fixture
    def mock_cache_service(self):
        """Mock cache service for testing."""
        with patch('app.services.cache_service.cache_service') as mock:
            mock.set.return_value = True
            mock.get.return_value = None
            mock.delete_pattern.return_value = 5
            mock.increment.return_value = 1
            yield mock
    
    def test_cache_user(self, mock_cache_service):
        """Test caching user data."""
        user_data = {"id": 1, "name": "John Doe", "email": "john@example.com"}
        
        LMSCache.cache_user(1, user_data, 1800)
        
        mock_cache_service.set.assert_called_with("user:1", user_data, 1800)
    
    def test_get_cached_user(self, mock_cache_service):
        """Test getting cached user data."""
        mock_cache_service.get.return_value = {"id": 1, "name": "John Doe"}
        
        user_data = LMSCache.get_cached_user(1)
        
        assert user_data["id"] == 1
        assert user_data["name"] == "John Doe"
        mock_cache_service.get.assert_called_with("user:1")
    
    def test_invalidate_user_cache(self, mock_cache_service):
        """Test invalidating user cache."""
        LMSCache.invalidate_user_cache(1)
        
        mock_cache_service.delete_pattern.assert_called_with("user:1*")
    
    def test_cache_course(self, mock_cache_service):
        """Test caching course data."""
        course_data = {"id": 1, "title": "Python Course", "instructor_id": 2}
        
        LMSCache.cache_course(1, course_data, 3600)
        
        mock_cache_service.set.assert_called_with("course:1", course_data, 3600)
    
    def test_cache_course_list(self, mock_cache_service):
        """Test caching course list."""
        course_list = [{"id": 1, "title": "Course 1"}, {"id": 2, "title": "Course 2"}]
        filters_hash = "abc123"
        
        LMSCache.cache_course_list(filters_hash, course_list, 600)
        
        mock_cache_service.set.assert_called_with(f"courses:list:{filters_hash}", course_list, 600)
    
    def test_cache_user_progress(self, mock_cache_service):
        """Test caching user progress data."""
        progress_data = {"completion_percentage": 75, "last_accessed": "2023-01-01"}
        
        LMSCache.cache_user_progress(1, 2, progress_data, 300)
        
        mock_cache_service.set.assert_called_with("progress:1:2", progress_data, 300)
    
    def test_invalidate_user_progress_cache_specific(self, mock_cache_service):
        """Test invalidating specific user progress cache."""
        LMSCache.invalidate_user_progress_cache(1, 2)
        
        mock_cache_service.delete.assert_called_with("progress:1:2")
    
    def test_invalidate_user_progress_cache_all(self, mock_cache_service):
        """Test invalidating all user progress cache."""
        LMSCache.invalidate_user_progress_cache(1)
        
        mock_cache_service.delete_pattern.assert_called_with("progress:1:*")
    
    def test_increment_view_count(self, mock_cache_service):
        """Test incrementing course view count."""
        mock_cache_service.increment.return_value = 5
        
        count = LMSCache.increment_view_count(1)
        
        assert count == 5
        mock_cache_service.increment.assert_called_with("views:course:1", 1, 86400)
    
    def test_get_view_count_exists(self, mock_cache_service):
        """Test getting view count when it exists."""
        mock_cache_service.get.return_value = 10
        
        count = LMSCache.get_view_count(1)
        
        assert count == 10
        mock_cache_service.get.assert_called_with("views:course:1")
    
    def test_get_view_count_not_exists(self, mock_cache_service):
        """Test getting view count when it doesn't exist."""
        mock_cache_service.get.return_value = None
        
        count = LMSCache.get_view_count(1)
        
        assert count == 0
        mock_cache_service.get.assert_called_with("views:course:1")


class TestCacheServiceIntegration:
    """Integration tests for cache service."""
    
    def test_cache_service_with_complex_data(self):
        """Test caching complex data structures."""
        with patch('app.services.cache_service.redis') as mock_redis:
            mock_client = MagicMock()
            mock_client.ping.return_value = True
            mock_redis.from_url.return_value = mock_client
            
            cache = CacheService()
            
            # Test with complex data
            complex_data = {
                "users": [
                    {"id": 1, "name": "John", "courses": [1, 2, 3]},
                    {"id": 2, "name": "Jane", "courses": [2, 4]}
                ],
                "metadata": {
                    "total": 2,
                    "timestamp": datetime.now().isoformat()
                }
            }
            
            # Mock successful operations
            mock_client.setex.return_value = True
            result = cache.set("complex_data", complex_data)
            assert result is True
    
    def test_cache_service_error_handling(self):
        """Test cache service error handling."""
        with patch('app.services.cache_service.redis') as mock_redis:
            mock_client = MagicMock()
            mock_client.ping.side_effect = Exception("Connection error")
            mock_redis.from_url.return_value = mock_client
            
            cache = CacheService()
            
            # Should handle errors gracefully
            assert not cache.is_available()
            assert cache.set("key", "value") is False
            assert cache.get("key") is None
            assert cache.delete("key") is False