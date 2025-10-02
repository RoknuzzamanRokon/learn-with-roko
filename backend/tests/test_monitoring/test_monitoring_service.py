"""
Tests for monitoring service functionality.
"""

import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

from app.services.monitoring_service import (
    SystemMonitor,
    DatabaseMonitor,
    ErrorTracker,
    PerformanceMonitor,
    MonitoringService,
    PerformanceMetric,
    ErrorEvent
)


class TestSystemMonitor:
    """Test system monitoring functionality."""
    
    @patch('app.services.monitoring_service.psutil')
    def test_get_system_metrics(self, mock_psutil):
        """Test getting system metrics."""
        # Mock psutil responses
        mock_psutil.cpu_percent.return_value = 45.5
        mock_psutil.cpu_count.return_value = 4
        
        mock_memory = MagicMock()
        mock_memory.total = 8589934592  # 8GB
        mock_memory.available = 4294967296  # 4GB
        mock_memory.percent = 50.0
        mock_memory.used = 4294967296
        mock_memory.free = 4294967296
        mock_psutil.virtual_memory.return_value = mock_memory
        
        mock_disk = MagicMock()
        mock_disk.total = 1000000000000  # 1TB
        mock_disk.used = 500000000000   # 500GB
        mock_disk.free = 500000000000   # 500GB
        mock_psutil.disk_usage.return_value = mock_disk
        
        mock_network = MagicMock()
        mock_network.bytes_sent = 1000000
        mock_network.bytes_recv = 2000000
        mock_network.packets_sent = 1000
        mock_network.packets_recv = 2000
        mock_psutil.net_io_counters.return_value = mock_network
        
        monitor = SystemMonitor()
        metrics = monitor.get_system_metrics()
        
        assert 'timestamp' in metrics
        assert metrics['cpu']['percent'] == 45.5
        assert metrics['cpu']['count'] == 4
        assert metrics['memory']['percent'] == 50.0
        assert metrics['disk']['percent'] == 50.0
        assert metrics['network']['bytes_sent'] == 1000000
    
    @patch('app.services.monitoring_service.psutil')
    def test_get_system_metrics_error_handling(self, mock_psutil):
        """Test system metrics error handling."""
        mock_psutil.cpu_percent.side_effect = Exception("CPU error")
        
        monitor = SystemMonitor()
        metrics = monitor.get_system_metrics()
        
        assert metrics == {}
    
    @patch('app.services.monitoring_service.psutil')
    def test_get_process_metrics(self, mock_psutil):
        """Test getting process metrics."""
        mock_process = MagicMock()
        mock_memory_info = MagicMock()
        mock_memory_info.rss = 104857600  # 100MB
        mock_memory_info.vms = 209715200  # 200MB
        mock_process.memory_info.return_value = mock_memory_info
        mock_process.cpu_percent.return_value = 25.0
        mock_process.num_threads.return_value = 10
        mock_process.num_fds.return_value = 50
        mock_process.status.return_value = "running"
        mock_process.create_time.return_value = 1640995200  # 2022-01-01
        mock_process.pid = 12345
        mock_psutil.Process.return_value = mock_process
        
        monitor = SystemMonitor()
        metrics = monitor.get_process_metrics()
        
        assert metrics['pid'] == 12345
        assert metrics['memory']['rss'] == 104857600
        assert metrics['cpu_percent'] == 25.0
        assert metrics['num_threads'] == 10
        assert metrics['status'] == "running"
    
    def test_get_metrics_history(self):
        """Test getting metrics history."""
        monitor = SystemMonitor()
        
        # Add some test data
        now = datetime.utcnow()
        monitor.metrics_history['cpu_percent'].append((now - timedelta(minutes=30), 50.0))
        monitor.metrics_history['cpu_percent'].append((now - timedelta(minutes=20), 60.0))
        monitor.metrics_history['cpu_percent'].append((now - timedelta(minutes=10), 70.0))
        
        # Get history for last 60 minutes
        history = monitor.get_metrics_history('cpu_percent', 60)
        
        assert len(history) == 3
        assert all(isinstance(item, tuple) and len(item) == 2 for item in history)
        
        # Get history for last 15 minutes (should only return recent data)
        history = monitor.get_metrics_history('cpu_percent', 15)
        
        assert len(history) == 1
        assert history[0][1] == 70.0


class TestDatabaseMonitor:
    """Test database monitoring functionality."""
    
    def test_get_database_metrics(self):
        """Test getting database metrics."""
        mock_db = MagicMock()
        
        # Mock connection stats
        mock_db.execute.return_value.fetchall.side_effect = [
            [('Threads_connected', '10'), ('Threads_running', '2')],  # Connection stats
            [('Queries', '1000'), ('Slow_queries', '5')],  # Query stats
            [('users', 100, 1000000, 500000, 1500000), ('courses', 50, 800000, 300000, 1100000)],  # Table stats
            [('SELECT * FROM users', 10, 0.5, 5.0)]  # Slow queries
        ]
        
        monitor = DatabaseMonitor(mock_db)
        metrics = monitor.get_database_metrics()
        
        assert 'timestamp' in metrics
        assert 'connection_stats' in metrics
        assert 'query_stats' in metrics
        assert 'table_stats' in metrics
        assert 'slow_queries' in metrics
    
    def test_get_database_metrics_error_handling(self):
        """Test database metrics error handling."""
        mock_db = MagicMock()
        mock_db.execute.side_effect = Exception("Database error")
        
        monitor = DatabaseMonitor(mock_db)
        metrics = monitor.get_database_metrics()
        
        assert metrics == {}


class TestErrorTracker:
    """Test error tracking functionality."""
    
    def test_track_error(self):
        """Test tracking an error."""
        tracker = ErrorTracker()
        
        error = ValueError("Test error message")
        error_event = tracker.track_error(
            error,
            user_id=123,
            request_path="/api/test",
            additional_data={"key": "value"}
        )
        
        assert isinstance(error_event, ErrorEvent)
        assert error_event.error_type == "ValueError"
        assert error_event.message == "Test error message"
        assert error_event.user_id == 123
        assert error_event.request_path == "/api/test"
        assert error_event.additional_data == {"key": "value"}
        
        # Check that error was added to recent errors
        assert len(tracker.recent_errors) == 1
        assert tracker.error_counts["ValueError"] == 1
    
    def test_get_error_summary(self):
        """Test getting error summary."""
        tracker = ErrorTracker()
        
        # Add some test errors
        now = datetime.utcnow()
        
        # Recent errors (within 24 hours)
        recent_error1 = ErrorEvent("ValueError", "Error 1", "stack1", now - timedelta(hours=1))
        recent_error2 = ErrorEvent("TypeError", "Error 2", "stack2", now - timedelta(hours=2))
        recent_error3 = ErrorEvent("ValueError", "Error 3", "stack3", now - timedelta(hours=3))
        
        # Old error (outside 24 hours)
        old_error = ErrorEvent("KeyError", "Old error", "stack4", now - timedelta(hours=25))
        
        tracker.recent_errors.extend([recent_error1, recent_error2, recent_error3, old_error])
        
        summary = tracker.get_error_summary(hours=24)
        
        assert summary['period_hours'] == 24
        assert summary['total_errors'] == 3  # Only recent errors
        assert summary['unique_error_types'] == 2  # ValueError and TypeError
        assert summary['most_common_errors'][0] == ('ValueError', 2)  # Most common
        assert summary['error_rate_per_hour'] == 3 / 24
    
    @patch('app.services.monitoring_service.logger')
    def test_check_error_rate_alerts(self, mock_logger):
        """Test error rate alerting."""
        tracker = ErrorTracker()
        
        # Add many errors to trigger alert
        now = datetime.utcnow()
        for i in range(60):  # More than 50 errors per hour
            error_event = ErrorEvent("TestError", f"Error {i}", "stack", now - timedelta(minutes=i))
            tracker.recent_errors.append(error_event)
        
        # Create a new error to trigger alert check
        new_error = ValueError("New error")
        tracker.track_error(new_error)
        
        # Should have logged a critical alert
        mock_logger.critical.assert_called()


class TestPerformanceMonitor:
    """Test performance monitoring functionality."""
    
    def test_track_request(self):
        """Test tracking request performance."""
        monitor = PerformanceMonitor()
        
        monitor.track_request("GET", "/api/users", 0.5, 200, user_id=123)
        
        assert len(monitor.request_times) == 1
        assert monitor.endpoint_stats["GET /api/users"]["count"] == 1
        assert monitor.endpoint_stats["GET /api/users"]["total_time"] == 0.5
        assert monitor.endpoint_stats["GET /api/users"]["errors"] == 0
    
    def test_track_request_with_error(self):
        """Test tracking request with error status."""
        monitor = PerformanceMonitor()
        
        monitor.track_request("POST", "/api/users", 1.0, 500, user_id=123)
        
        assert monitor.endpoint_stats["POST /api/users"]["errors"] == 1
    
    @patch('app.services.monitoring_service.logger')
    def test_track_slow_request(self, mock_logger):
        """Test tracking slow request triggers warning."""
        monitor = PerformanceMonitor()
        
        monitor.track_request("GET", "/api/slow", 6.0, 200)  # Slow request (>5s)
        
        mock_logger.warning.assert_called()
    
    def test_get_performance_summary(self):
        """Test getting performance summary."""
        monitor = PerformanceMonitor()
        
        # Add some test data
        now = datetime.utcnow()
        monitor.request_times.extend([
            (now - timedelta(minutes=30), 0.1),
            (now - timedelta(minutes=20), 0.2),
            (now - timedelta(minutes=10), 0.3),
            (now - timedelta(minutes=5), 0.4)
        ])
        
        # Add endpoint stats
        monitor.endpoint_stats["GET /api/users"] = {"count": 10, "total_time": 2.0, "errors": 1}
        monitor.endpoint_stats["POST /api/courses"] = {"count": 5, "total_time": 5.0, "errors": 0}
        
        summary = monitor.get_performance_summary(minutes=60)
        
        assert summary['period_minutes'] == 60
        assert summary['total_requests'] == 4
        assert summary['requests_per_minute'] == 4 / 60
        assert summary['avg_response_time'] == 0.25  # (0.1+0.2+0.3+0.4)/4
        assert summary['min_response_time'] == 0.1
        assert summary['max_response_time'] == 0.4
        assert len(summary['slowest_endpoints']) == 2
    
    def test_get_performance_summary_empty(self):
        """Test getting performance summary with no data."""
        monitor = PerformanceMonitor()
        
        summary = monitor.get_performance_summary(minutes=60)
        
        assert summary['period_minutes'] == 60
        assert summary['total_requests'] == 0


class TestMonitoringService:
    """Test main monitoring service."""
    
    @patch('app.services.monitoring_service.SystemMonitor')
    @patch('app.services.monitoring_service.DatabaseMonitor')
    @patch('app.services.monitoring_service.ErrorTracker')
    @patch('app.services.monitoring_service.PerformanceMonitor')
    def test_get_health_status_healthy(self, mock_perf, mock_error, mock_db, mock_system):
        """Test getting health status when system is healthy."""
        mock_db_instance = MagicMock()
        mock_system_instance = MagicMock()
        mock_error_instance = MagicMock()
        mock_perf_instance = MagicMock()
        
        mock_system.return_value = mock_system_instance
        mock_db.return_value = mock_db_instance
        mock_error.return_value = mock_error_instance
        mock_perf.return_value = mock_perf_instance
        
        # Mock healthy system metrics
        mock_system_instance.get_system_metrics.return_value = {
            'cpu': {'percent': 50.0},
            'memory': {'percent': 60.0},
            'disk': {'percent': 70.0}
        }
        
        mock_db_instance.get_database_metrics.return_value = {}
        mock_error_instance.get_error_summary.return_value = {'error_rate_per_hour': 2.0}
        mock_perf_instance.get_performance_summary.return_value = {'avg_response_time': 0.5}
        
        mock_db = MagicMock()
        service = MonitoringService(mock_db)
        
        health_status = service.get_health_status()
        
        assert health_status['status'] == 'healthy'
        assert len(health_status['issues']) == 0
    
    @patch('app.services.monitoring_service.SystemMonitor')
    @patch('app.services.monitoring_service.DatabaseMonitor')
    @patch('app.services.monitoring_service.ErrorTracker')
    @patch('app.services.monitoring_service.PerformanceMonitor')
    def test_get_health_status_warning(self, mock_perf, mock_error, mock_db, mock_system):
        """Test getting health status with warnings."""
        mock_db_instance = MagicMock()
        mock_system_instance = MagicMock()
        mock_error_instance = MagicMock()
        mock_perf_instance = MagicMock()
        
        mock_system.return_value = mock_system_instance
        mock_db.return_value = mock_db_instance
        mock_error.return_value = mock_error_instance
        mock_perf.return_value = mock_perf_instance
        
        # Mock system with high CPU usage
        mock_system_instance.get_system_metrics.return_value = {
            'cpu': {'percent': 85.0},  # High CPU
            'memory': {'percent': 60.0},
            'disk': {'percent': 70.0}
        }
        
        mock_db_instance.get_database_metrics.return_value = {}
        mock_error_instance.get_error_summary.return_value = {'error_rate_per_hour': 2.0}
        mock_perf_instance.get_performance_summary.return_value = {'avg_response_time': 0.5}
        
        mock_db = MagicMock()
        service = MonitoringService(mock_db)
        
        health_status = service.get_health_status()
        
        assert health_status['status'] == 'warning'
        assert 'High CPU usage' in health_status['issues']
    
    @patch('app.services.monitoring_service.SystemMonitor')
    @patch('app.services.monitoring_service.DatabaseMonitor')
    @patch('app.services.monitoring_service.ErrorTracker')
    @patch('app.services.monitoring_service.PerformanceMonitor')
    def test_get_health_status_critical(self, mock_perf, mock_error, mock_db, mock_system):
        """Test getting health status when critical."""
        mock_db_instance = MagicMock()
        mock_system_instance = MagicMock()
        mock_error_instance = MagicMock()
        mock_perf_instance = MagicMock()
        
        mock_system.return_value = mock_system_instance
        mock_db.return_value = mock_db_instance
        mock_error.return_value = mock_error_instance
        mock_perf.return_value = mock_perf_instance
        
        # Mock critical system state
        mock_system_instance.get_system_metrics.return_value = {
            'cpu': {'percent': 95.0},    # Critical CPU
            'memory': {'percent': 90.0}, # Critical memory
            'disk': {'percent': 95.0}    # Critical disk
        }
        
        mock_db_instance.get_database_metrics.return_value = {}
        mock_error_instance.get_error_summary.return_value = {'error_rate_per_hour': 15.0}  # High error rate
        mock_perf_instance.get_performance_summary.return_value = {'avg_response_time': 3.0}  # Slow responses
        
        mock_db = MagicMock()
        service = MonitoringService(mock_db)
        
        health_status = service.get_health_status()
        
        assert health_status['status'] == 'critical'
        assert len(health_status['issues']) > 2  # Multiple issues
    
    def test_track_request_performance(self):
        """Test tracking request performance through service."""
        mock_db = MagicMock()
        service = MonitoringService(mock_db)
        
        service.track_request_performance("GET", "/api/test", 0.5, 200, user_id=123)
        
        # Should have tracked in performance monitor
        assert len(service.performance_monitor.request_times) == 1
    
    def test_track_error(self):
        """Test tracking error through service."""
        mock_db = MagicMock()
        service = MonitoringService(mock_db)
        
        error = ValueError("Test error")
        error_event = service.track_error(error, user_id=123, request_path="/api/test")
        
        assert isinstance(error_event, ErrorEvent)
        assert error_event.error_type == "ValueError"
        assert len(service.error_tracker.recent_errors) == 1


class TestPerformanceMetric:
    """Test PerformanceMetric dataclass."""
    
    def test_performance_metric_creation(self):
        """Test creating a performance metric."""
        timestamp = datetime.utcnow()
        metric = PerformanceMetric(
            name="cpu_usage",
            value=75.5,
            unit="percent",
            timestamp=timestamp,
            tags={"host": "server1"}
        )
        
        assert metric.name == "cpu_usage"
        assert metric.value == 75.5
        assert metric.unit == "percent"
        assert metric.timestamp == timestamp
        assert metric.tags == {"host": "server1"}


class TestErrorEvent:
    """Test ErrorEvent dataclass."""
    
    def test_error_event_creation(self):
        """Test creating an error event."""
        timestamp = datetime.utcnow()
        error_event = ErrorEvent(
            error_type="ValueError",
            message="Test error",
            stack_trace="Traceback...",
            timestamp=timestamp,
            user_id=123,
            request_path="/api/test",
            additional_data={"key": "value"}
        )
        
        assert error_event.error_type == "ValueError"
        assert error_event.message == "Test error"
        assert error_event.stack_trace == "Traceback..."
        assert error_event.timestamp == timestamp
        assert error_event.user_id == 123
        assert error_event.request_path == "/api/test"
        assert error_event.additional_data == {"key": "value"}