"""
API endpoints for monitoring and system health.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from ..database import get_db
from ..dependencies import get_current_super_admin
from ..services.monitoring_service import get_monitoring_service
from ..services.cache_service import cache_service
from ..utils.database_optimization import monitor_database_performance

router = APIRouter(tags=["monitoring"])


@router.get("/monitoring/health")
async def get_health_status(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get system health status.
    Public endpoint for basic health checks.
    """
    try:
        monitoring_service = get_monitoring_service(db)
        health_status = monitoring_service.get_health_status()
        
        # Return simplified health status for public access
        return {
            "status": health_status["status"],
            "timestamp": health_status["timestamp"],
            "message": "System is operational" if health_status["status"] == "healthy" else "System has issues"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Health check failed: {str(e)}"
        )


@router.get("/monitoring/dashboard")
async def get_monitoring_dashboard(
    current_user = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get comprehensive monitoring dashboard data.
    Requires Super Admin access.
    """
    try:
        monitoring_service = get_monitoring_service(db)
        dashboard_data = monitoring_service.get_monitoring_dashboard_data()
        
        # Add cached metrics
        cached_metrics = {
            "system_metrics": cache_service.get("system_metrics"),
            "process_metrics": cache_service.get("process_metrics"),
            "request_count": cache_service.get("request_count") or 0
        }
        
        dashboard_data["cached_metrics"] = cached_metrics
        
        return dashboard_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get monitoring dashboard: {str(e)}"
        )


@router.get("/monitoring/system-metrics")
async def get_system_metrics(
    current_user = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get current system resource metrics.
    """
    try:
        monitoring_service = get_monitoring_service(db)
        
        system_metrics = monitoring_service.system_monitor.get_system_metrics()
        process_metrics = monitoring_service.system_monitor.get_process_metrics()
        
        return {
            "system": system_metrics,
            "process": process_metrics
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system metrics: {str(e)}"
        )


@router.get("/monitoring/database-metrics")
async def get_database_metrics(
    current_user = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get database performance metrics.
    """
    try:
        monitoring_service = get_monitoring_service(db)
        db_metrics = monitoring_service.database_monitor.get_database_metrics()
        
        # Add comprehensive database performance data
        performance_data = monitor_database_performance(db)
        db_metrics["performance_analysis"] = performance_data
        
        return db_metrics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get database metrics: {str(e)}"
        )


@router.get("/monitoring/error-summary")
async def get_error_summary(
    hours: int = Query(24, ge=1, le=168),  # 1 hour to 1 week
    current_user = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get error summary for the specified time period.
    """
    try:
        monitoring_service = get_monitoring_service(db)
        error_summary = monitoring_service.error_tracker.get_error_summary(hours)
        
        return error_summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get error summary: {str(e)}"
        )


@router.get("/monitoring/performance-summary")
async def get_performance_summary(
    minutes: int = Query(60, ge=1, le=1440),  # 1 minute to 24 hours
    current_user = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get performance summary for the specified time period.
    """
    try:
        monitoring_service = get_monitoring_service(db)
        performance_summary = monitoring_service.performance_monitor.get_performance_summary(minutes)
        
        return performance_summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get performance summary: {str(e)}"
        )


@router.get("/monitoring/alerts")
async def get_active_alerts(
    current_user = Depends(get_current_super_admin)
) -> List[Dict[str, Any]]:
    """
    Get active system alerts.
    """
    try:
        # Get alerts from cache
        alerts = []
        
        # Get all alert keys from cache
        if cache_service.is_available():
            # This is a simplified approach - in production, you'd want a more sophisticated alert storage
            alert_keys = cache_service.redis_client.keys("alert:*") if cache_service.redis_client else []
            
            for key in alert_keys:
                alert_data = cache_service.get(key.decode('utf-8') if isinstance(key, bytes) else key)
                if alert_data:
                    alerts.append(alert_data)
        
        # Sort alerts by timestamp (newest first)
        alerts.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
        
        return alerts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get alerts: {str(e)}"
        )


@router.post("/monitoring/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    current_user = Depends(get_current_super_admin)
) -> Dict[str, str]:
    """
    Acknowledge an alert.
    """
    try:
        # Remove alert from cache
        if cache_service.delete(f"alert:{alert_id}"):
            return {"message": "Alert acknowledged successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alert not found"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to acknowledge alert: {str(e)}"
        )


@router.get("/monitoring/metrics-history")
async def get_metrics_history(
    metric_name: str = Query(..., description="Name of the metric (cpu_percent, memory_percent, disk_percent)"),
    minutes: int = Query(60, ge=1, le=1440),
    current_user = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get historical metrics for a specific metric.
    """
    try:
        monitoring_service = get_monitoring_service(db)
        history = monitoring_service.system_monitor.get_metrics_history(metric_name, minutes)
        
        # Format data for charting
        formatted_data = [
            {
                "timestamp": ts.isoformat(),
                "value": value
            }
            for ts, value in history
        ]
        
        return {
            "metric_name": metric_name,
            "period_minutes": minutes,
            "data_points": len(formatted_data),
            "data": formatted_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get metrics history: {str(e)}"
        )


@router.get("/monitoring/cache-status")
async def get_cache_status(
    current_user = Depends(get_current_super_admin)
) -> Dict[str, Any]:
    """
    Get cache service status and statistics.
    """
    try:
        cache_status = {
            "available": cache_service.is_available(),
            "redis_info": {}
        }
        
        if cache_service.is_available() and cache_service.redis_client:
            try:
                # Get Redis info
                redis_info = cache_service.redis_client.info()
                
                cache_status["redis_info"] = {
                    "version": redis_info.get("redis_version"),
                    "uptime_seconds": redis_info.get("uptime_in_seconds"),
                    "connected_clients": redis_info.get("connected_clients"),
                    "used_memory": redis_info.get("used_memory"),
                    "used_memory_human": redis_info.get("used_memory_human"),
                    "total_commands_processed": redis_info.get("total_commands_processed"),
                    "keyspace_hits": redis_info.get("keyspace_hits"),
                    "keyspace_misses": redis_info.get("keyspace_misses")
                }
                
                # Calculate hit ratio
                hits = redis_info.get("keyspace_hits", 0)
                misses = redis_info.get("keyspace_misses", 0)
                total = hits + misses
                
                if total > 0:
                    cache_status["hit_ratio"] = hits / total
                else:
                    cache_status["hit_ratio"] = 0
                
            except Exception as e:
                cache_status["redis_error"] = str(e)
        
        return cache_status
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get cache status: {str(e)}"
        )


@router.post("/monitoring/cache/clear")
async def clear_cache(
    pattern: Optional[str] = Query(None, description="Pattern to match keys for deletion (e.g., 'user:*')"),
    current_user = Depends(get_current_super_admin)
) -> Dict[str, Any]:
    """
    Clear cache entries. If pattern is provided, only matching keys are deleted.
    """
    try:
        if not cache_service.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Cache service is not available"
            )
        
        if pattern:
            # Delete keys matching pattern
            deleted_count = cache_service.delete_pattern(pattern)
            return {
                "message": f"Deleted {deleted_count} cache entries matching pattern '{pattern}'"
            }
        else:
            # Clear all cache (use with caution)
            if cache_service.redis_client:
                cache_service.redis_client.flushdb()
                return {"message": "All cache entries cleared"}
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Redis client not available"
                )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear cache: {str(e)}"
        )