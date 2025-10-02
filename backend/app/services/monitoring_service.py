"""
Application monitoring and error tracking service.
"""

import time
import psutil
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from collections import defaultdict, deque
import json
import traceback
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..models.audit_log import SecurityEvent
from ..services.cache_service import cache_service

logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetric:
    """Data class for performance metrics."""
    name: str
    value: float
    unit: str
    timestamp: datetime
    tags: Dict[str, str] = None


@dataclass
class ErrorEvent:
    """Data class for error events."""
    error_type: str
    message: str
    stack_trace: str
    timestamp: datetime
    user_id: Optional[int] = None
    request_path: Optional[str] = None
    additional_data: Dict[str, Any] = None


class SystemMonitor:
    """
    System resource monitoring utility.
    """
    
    def __init__(self):
        self.metrics_history = defaultdict(lambda: deque(maxlen=100))
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """
        Get current system resource metrics.
        
        Returns:
            Dict containing system metrics
        """
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memory metrics
            memory = psutil.virtual_memory()
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            
            # Network metrics (if available)
            try:
                network = psutil.net_io_counters()
                network_metrics = {
                    'bytes_sent': network.bytes_sent,
                    'bytes_recv': network.bytes_recv,
                    'packets_sent': network.packets_sent,
                    'packets_recv': network.packets_recv
                }
            except Exception:
                network_metrics = {}
            
            metrics = {
                'timestamp': datetime.utcnow().isoformat(),
                'cpu': {
                    'percent': cpu_percent,
                    'count': cpu_count
                },
                'memory': {
                    'total': memory.total,
                    'available': memory.available,
                    'percent': memory.percent,
                    'used': memory.used,
                    'free': memory.free
                },
                'disk': {
                    'total': disk.total,
                    'used': disk.used,
                    'free': disk.free,
                    'percent': (disk.used / disk.total) * 100
                },
                'network': network_metrics
            }
            
            # Store metrics in history
            timestamp = datetime.utcnow()
            self.metrics_history['cpu_percent'].append((timestamp, cpu_percent))
            self.metrics_history['memory_percent'].append((timestamp, memory.percent))
            self.metrics_history['disk_percent'].append((timestamp, (disk.used / disk.total) * 100))
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to get system metrics: {e}")
            return {}
    
    def get_process_metrics(self) -> Dict[str, Any]:
        """
        Get current process metrics.
        
        Returns:
            Dict containing process metrics
        """
        try:
            process = psutil.Process()
            
            # Memory info
            memory_info = process.memory_info()
            
            # CPU info
            cpu_percent = process.cpu_percent()
            
            # File descriptors (Unix only)
            try:
                num_fds = process.num_fds()
            except (AttributeError, psutil.AccessDenied):
                num_fds = None
            
            # Threads
            num_threads = process.num_threads()
            
            metrics = {
                'timestamp': datetime.utcnow().isoformat(),
                'pid': process.pid,
                'memory': {
                    'rss': memory_info.rss,  # Resident Set Size
                    'vms': memory_info.vms,  # Virtual Memory Size
                },
                'cpu_percent': cpu_percent,
                'num_threads': num_threads,
                'num_fds': num_fds,
                'status': process.status(),
                'create_time': datetime.fromtimestamp(process.create_time()).isoformat()
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to get process metrics: {e}")
            return {}
    
    def get_metrics_history(self, metric_name: str, minutes: int = 60) -> List[tuple]:
        """
        Get historical metrics for a specific metric.
        
        Args:
            metric_name: Name of the metric
            minutes: Number of minutes of history to return
            
        Returns:
            List of (timestamp, value) tuples
        """
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)
        
        history = self.metrics_history.get(metric_name, deque())
        return [(ts, val) for ts, val in history if ts >= cutoff_time]


class DatabaseMonitor:
    """
    Database performance monitoring utility.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_database_metrics(self) -> Dict[str, Any]:
        """
        Get database performance metrics.
        
        Returns:
            Dict containing database metrics
        """
        try:
            metrics = {
                'timestamp': datetime.utcnow().isoformat(),
                'connection_stats': self._get_connection_stats(),
                'query_stats': self._get_query_stats(),
                'table_stats': self._get_table_stats(),
                'slow_queries': self._get_recent_slow_queries()
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to get database metrics: {e}")
            return {}
    
    def _get_connection_stats(self) -> Dict[str, Any]:
        """Get database connection statistics."""
        try:
            result = self.db.execute(text("""
                SELECT 
                    VARIABLE_NAME,
                    VARIABLE_VALUE
                FROM information_schema.SESSION_STATUS 
                WHERE VARIABLE_NAME IN (
                    'Threads_connected',
                    'Threads_running',
                    'Max_used_connections',
                    'Aborted_connects',
                    'Aborted_clients'
                )
            """)).fetchall()
            
            return {row[0]: int(row[1]) for row in result}
            
        except Exception as e:
            logger.error(f"Failed to get connection stats: {e}")
            return {}
    
    def _get_query_stats(self) -> Dict[str, Any]:
        """Get query performance statistics."""
        try:
            result = self.db.execute(text("""
                SELECT 
                    VARIABLE_NAME,
                    VARIABLE_VALUE
                FROM information_schema.SESSION_STATUS 
                WHERE VARIABLE_NAME IN (
                    'Queries',
                    'Questions',
                    'Slow_queries',
                    'Select_scan',
                    'Select_full_join'
                )
            """)).fetchall()
            
            return {row[0]: int(row[1]) for row in result}
            
        except Exception as e:
            logger.error(f"Failed to get query stats: {e}")
            return {}
    
    def _get_table_stats(self) -> List[Dict[str, Any]]:
        """Get table statistics."""
        try:
            result = self.db.execute(text("""
                SELECT 
                    table_name,
                    table_rows,
                    data_length,
                    index_length,
                    (data_length + index_length) as total_size
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
                ORDER BY total_size DESC
                LIMIT 10
            """)).fetchall()
            
            return [dict(row) for row in result]
            
        except Exception as e:
            logger.error(f"Failed to get table stats: {e}")
            return []
    
    def _get_recent_slow_queries(self) -> List[Dict[str, Any]]:
        """Get recent slow queries."""
        try:
            result = self.db.execute(text("""
                SELECT 
                    sql_text,
                    exec_count,
                    avg_timer_wait / 1000000000 as avg_time_seconds,
                    sum_timer_wait / 1000000000 as total_time_seconds
                FROM performance_schema.events_statements_summary_by_digest 
                WHERE schema_name = DATABASE()
                AND avg_timer_wait > 1000000000
                ORDER BY avg_timer_wait DESC 
                LIMIT 5
            """)).fetchall()
            
            return [dict(row) for row in result]
            
        except Exception as e:
            logger.error(f"Failed to get slow queries: {e}")
            return []


class ErrorTracker:
    """
    Error tracking and alerting system.
    """
    
    def __init__(self):
        self.error_counts = defaultdict(int)
        self.recent_errors = deque(maxlen=100)
    
    def track_error(
        self,
        error: Exception,
        user_id: Optional[int] = None,
        request_path: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> ErrorEvent:
        """
        Track an error event.
        
        Args:
            error: Exception object
            user_id: User ID if available
            request_path: Request path if available
            additional_data: Additional context data
            
        Returns:
            ErrorEvent object
        """
        error_event = ErrorEvent(
            error_type=type(error).__name__,
            message=str(error),
            stack_trace=traceback.format_exc(),
            timestamp=datetime.utcnow(),
            user_id=user_id,
            request_path=request_path,
            additional_data=additional_data or {}
        )
        
        # Update error counts
        self.error_counts[error_event.error_type] += 1
        
        # Store in recent errors
        self.recent_errors.append(error_event)
        
        # Log the error
        logger.error(
            f"Error tracked: {error_event.error_type} - {error_event.message}",
            extra={
                'user_id': user_id,
                'request_path': request_path,
                'additional_data': additional_data
            }
        )
        
        # Check for error rate alerts
        self._check_error_rate_alerts(error_event)
        
        return error_event
    
    def get_error_summary(self, hours: int = 24) -> Dict[str, Any]:
        """
        Get error summary for the specified time period.
        
        Args:
            hours: Number of hours to include in summary
            
        Returns:
            Dict containing error summary
        """
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        # Filter recent errors by time
        recent_errors = [
            error for error in self.recent_errors
            if error.timestamp >= cutoff_time
        ]
        
        # Count errors by type
        error_counts = defaultdict(int)
        for error in recent_errors:
            error_counts[error.error_type] += 1
        
        # Get most common errors
        most_common = sorted(
            error_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        return {
            'period_hours': hours,
            'total_errors': len(recent_errors),
            'unique_error_types': len(error_counts),
            'most_common_errors': most_common,
            'error_rate_per_hour': len(recent_errors) / hours if hours > 0 else 0
        }
    
    def _check_error_rate_alerts(self, error_event: ErrorEvent):
        """Check if error rate exceeds thresholds and create alerts."""
        # Count errors in the last hour
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        recent_errors = [
            error for error in self.recent_errors
            if error.timestamp >= one_hour_ago
        ]
        
        # Alert thresholds
        if len(recent_errors) > 50:  # More than 50 errors per hour
            self._create_alert(
                'HIGH_ERROR_RATE',
                f'High error rate detected: {len(recent_errors)} errors in the last hour'
            )
        
        # Check for specific error type spikes
        error_type_count = sum(
            1 for error in recent_errors
            if error.error_type == error_event.error_type
        )
        
        if error_type_count > 10:  # More than 10 of the same error type per hour
            self._create_alert(
                'ERROR_TYPE_SPIKE',
                f'Error type spike detected: {error_type_count} {error_event.error_type} errors in the last hour'
            )
    
    def _create_alert(self, alert_type: str, message: str):
        """Create an alert for high error rates."""
        logger.critical(f"ALERT [{alert_type}]: {message}")
        
        # Store alert in cache for dashboard display
        alert_data = {
            'type': alert_type,
            'message': message,
            'timestamp': datetime.utcnow().isoformat(),
            'severity': 'HIGH'
        }
        
        cache_service.set(f"alert:{alert_type}:{int(time.time())}", alert_data, 3600)


class PerformanceMonitor:
    """
    Application performance monitoring utility.
    """
    
    def __init__(self):
        self.request_times = deque(maxlen=1000)
        self.endpoint_stats = defaultdict(lambda: {'count': 0, 'total_time': 0, 'errors': 0})
    
    def track_request(
        self,
        method: str,
        path: str,
        response_time: float,
        status_code: int,
        user_id: Optional[int] = None
    ):
        """
        Track request performance metrics.
        
        Args:
            method: HTTP method
            path: Request path
            response_time: Response time in seconds
            status_code: HTTP status code
            user_id: User ID if available
        """
        timestamp = datetime.utcnow()
        
        # Store request time
        self.request_times.append((timestamp, response_time))
        
        # Update endpoint statistics
        endpoint_key = f"{method} {path}"
        stats = self.endpoint_stats[endpoint_key]
        stats['count'] += 1
        stats['total_time'] += response_time
        
        if status_code >= 400:
            stats['errors'] += 1
        
        # Check for performance alerts
        if response_time > 5.0:  # Slow request threshold
            logger.warning(
                f"Slow request detected: {method} {path} took {response_time:.2f}s",
                extra={'user_id': user_id, 'status_code': status_code}
            )
    
    def get_performance_summary(self, minutes: int = 60) -> Dict[str, Any]:
        """
        Get performance summary for the specified time period.
        
        Args:
            minutes: Number of minutes to include in summary
            
        Returns:
            Dict containing performance summary
        """
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)
        
        # Filter recent requests
        recent_requests = [
            (ts, rt) for ts, rt in self.request_times
            if ts >= cutoff_time
        ]
        
        if not recent_requests:
            return {'period_minutes': minutes, 'total_requests': 0}
        
        response_times = [rt for _, rt in recent_requests]
        
        # Calculate statistics
        avg_response_time = sum(response_times) / len(response_times)
        min_response_time = min(response_times)
        max_response_time = max(response_times)
        
        # Calculate percentiles
        sorted_times = sorted(response_times)
        p50_index = int(len(sorted_times) * 0.5)
        p95_index = int(len(sorted_times) * 0.95)
        p99_index = int(len(sorted_times) * 0.99)
        
        # Get slowest endpoints
        slowest_endpoints = []
        for endpoint, stats in self.endpoint_stats.items():
            if stats['count'] > 0:
                avg_time = stats['total_time'] / stats['count']
                error_rate = stats['errors'] / stats['count']
                slowest_endpoints.append({
                    'endpoint': endpoint,
                    'avg_time': avg_time,
                    'count': stats['count'],
                    'error_rate': error_rate
                })
        
        slowest_endpoints.sort(key=lambda x: x['avg_time'], reverse=True)
        
        return {
            'period_minutes': minutes,
            'total_requests': len(recent_requests),
            'requests_per_minute': len(recent_requests) / minutes if minutes > 0 else 0,
            'avg_response_time': avg_response_time,
            'min_response_time': min_response_time,
            'max_response_time': max_response_time,
            'p50_response_time': sorted_times[p50_index] if p50_index < len(sorted_times) else 0,
            'p95_response_time': sorted_times[p95_index] if p95_index < len(sorted_times) else 0,
            'p99_response_time': sorted_times[p99_index] if p99_index < len(sorted_times) else 0,
            'slowest_endpoints': slowest_endpoints[:10]
        }


class MonitoringService:
    """
    Main monitoring service that coordinates all monitoring components.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.system_monitor = SystemMonitor()
        self.database_monitor = DatabaseMonitor(db)
        self.error_tracker = ErrorTracker()
        self.performance_monitor = PerformanceMonitor()
    
    def get_health_status(self) -> Dict[str, Any]:
        """
        Get overall system health status.
        
        Returns:
            Dict containing health status
        """
        try:
            system_metrics = self.system_monitor.get_system_metrics()
            db_metrics = self.database_monitor.get_database_metrics()
            error_summary = self.error_tracker.get_error_summary(hours=1)
            performance_summary = self.performance_monitor.get_performance_summary(minutes=60)
            
            # Determine health status
            health_issues = []
            
            # Check system resources
            if system_metrics.get('cpu', {}).get('percent', 0) > 80:
                health_issues.append('High CPU usage')
            
            if system_metrics.get('memory', {}).get('percent', 0) > 85:
                health_issues.append('High memory usage')
            
            if system_metrics.get('disk', {}).get('percent', 0) > 90:
                health_issues.append('High disk usage')
            
            # Check error rates
            if error_summary.get('error_rate_per_hour', 0) > 10:
                health_issues.append('High error rate')
            
            # Check performance
            if performance_summary.get('avg_response_time', 0) > 2.0:
                health_issues.append('Slow response times')
            
            # Determine overall status
            if not health_issues:
                status = 'healthy'
            elif len(health_issues) <= 2:
                status = 'warning'
            else:
                status = 'critical'
            
            return {
                'status': status,
                'timestamp': datetime.utcnow().isoformat(),
                'issues': health_issues,
                'system_metrics': system_metrics,
                'database_metrics': db_metrics,
                'error_summary': error_summary,
                'performance_summary': performance_summary
            }
            
        except Exception as e:
            logger.error(f"Failed to get health status: {e}")
            return {
                'status': 'error',
                'timestamp': datetime.utcnow().isoformat(),
                'error': str(e)
            }
    
    def track_request_performance(
        self,
        method: str,
        path: str,
        response_time: float,
        status_code: int,
        user_id: Optional[int] = None
    ):
        """Track request performance."""
        self.performance_monitor.track_request(method, path, response_time, status_code, user_id)
    
    def track_error(
        self,
        error: Exception,
        user_id: Optional[int] = None,
        request_path: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> ErrorEvent:
        """Track an error."""
        return self.error_tracker.track_error(error, user_id, request_path, additional_data)
    
    def get_monitoring_dashboard_data(self) -> Dict[str, Any]:
        """
        Get comprehensive monitoring data for dashboard display.
        
        Returns:
            Dict containing all monitoring data
        """
        return {
            'health_status': self.get_health_status(),
            'system_metrics': self.system_monitor.get_system_metrics(),
            'process_metrics': self.system_monitor.get_process_metrics(),
            'database_metrics': self.database_monitor.get_database_metrics(),
            'error_summary': self.error_tracker.get_error_summary(),
            'performance_summary': self.performance_monitor.get_performance_summary(),
            'cache_status': {
                'available': cache_service.is_available(),
                'info': 'Redis cache service status'
            }
        }


# Global monitoring service instance
monitoring_service = None


def get_monitoring_service(db: Session) -> MonitoringService:
    """Get or create monitoring service instance."""
    global monitoring_service
    if monitoring_service is None:
        monitoring_service = MonitoringService(db)
    return monitoring_service