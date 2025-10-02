"""
File upload and streaming optimization utilities.
"""

import os
import hashlib
import mimetypes
from typing import Optional, Dict, Any, List, Tuple, BinaryIO
from pathlib import Path
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging
from PIL import Image
import ffmpeg
from io import BytesIO

logger = logging.getLogger(__name__)


class FileOptimizer:
    """
    Utility class for file upload and processing optimization.
    """
    
    # Supported file types and their configurations
    SUPPORTED_TYPES = {
        'image': {
            'extensions': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
            'max_size': 10 * 1024 * 1024,  # 10MB
            'mime_types': ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        },
        'video': {
            'extensions': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
            'max_size': 500 * 1024 * 1024,  # 500MB
            'mime_types': ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv']
        },
        'document': {
            'extensions': ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt'],
            'max_size': 50 * 1024 * 1024,  # 50MB
            'mime_types': ['application/pdf', 'application/msword', 'text/plain']
        },
        'archive': {
            'extensions': ['.zip', '.rar', '.7z', '.tar', '.gz'],
            'max_size': 100 * 1024 * 1024,  # 100MB
            'mime_types': ['application/zip', 'application/x-rar-compressed']
        }
    }
    
    @staticmethod
    def validate_file(file_path: str, file_type: str) -> Dict[str, Any]:
        """
        Validate file type, size, and format.
        
        Args:
            file_path: Path to the file
            file_type: Expected file type category
            
        Returns:
            Dict containing validation results
        """
        result = {
            'valid': False,
            'errors': [],
            'file_info': {}
        }
        
        try:
            if not os.path.exists(file_path):
                result['errors'].append('File does not exist')
                return result
            
            # Get file info
            file_size = os.path.getsize(file_path)
            file_ext = Path(file_path).suffix.lower()
            mime_type, _ = mimetypes.guess_type(file_path)
            
            result['file_info'] = {
                'size': file_size,
                'extension': file_ext,
                'mime_type': mime_type,
                'name': Path(file_path).name
            }
            
            # Check if file type is supported
            if file_type not in FileOptimizer.SUPPORTED_TYPES:
                result['errors'].append(f'Unsupported file type: {file_type}')
                return result
            
            type_config = FileOptimizer.SUPPORTED_TYPES[file_type]
            
            # Validate extension
            if file_ext not in type_config['extensions']:
                result['errors'].append(f'Invalid file extension: {file_ext}')
            
            # Validate size
            if file_size > type_config['max_size']:
                max_size_mb = type_config['max_size'] / (1024 * 1024)
                result['errors'].append(f'File too large. Maximum size: {max_size_mb}MB')
            
            # Validate MIME type
            if mime_type and mime_type not in type_config['mime_types']:
                result['errors'].append(f'Invalid MIME type: {mime_type}')
            
            # Additional validation based on file type
            if file_type == 'image':
                image_validation = FileOptimizer._validate_image(file_path)
                if not image_validation['valid']:
                    result['errors'].extend(image_validation['errors'])
                else:
                    result['file_info'].update(image_validation['info'])
            
            elif file_type == 'video':
                video_validation = FileOptimizer._validate_video(file_path)
                if not video_validation['valid']:
                    result['errors'].extend(video_validation['errors'])
                else:
                    result['file_info'].update(video_validation['info'])
            
            result['valid'] = len(result['errors']) == 0
            
        except Exception as e:
            logger.error(f"Error validating file {file_path}: {e}")
            result['errors'].append(f'Validation error: {str(e)}')
        
        return result
    
    @staticmethod
    def _validate_image(file_path: str) -> Dict[str, Any]:
        """Validate image file."""
        result = {'valid': False, 'errors': [], 'info': {}}
        
        try:
            with Image.open(file_path) as img:
                result['info'] = {
                    'width': img.width,
                    'height': img.height,
                    'format': img.format,
                    'mode': img.mode
                }
                
                # Check image dimensions
                if img.width > 4096 or img.height > 4096:
                    result['errors'].append('Image dimensions too large (max: 4096x4096)')
                
                if img.width < 1 or img.height < 1:
                    result['errors'].append('Invalid image dimensions')
                
                result['valid'] = len(result['errors']) == 0
                
        except Exception as e:
            result['errors'].append(f'Invalid image file: {str(e)}')
        
        return result
    
    @staticmethod
    def _validate_video(file_path: str) -> Dict[str, Any]:
        """Validate video file."""
        result = {'valid': False, 'errors': [], 'info': {}}
        
        try:
            probe = ffmpeg.probe(file_path)
            video_streams = [stream for stream in probe['streams'] if stream['codec_type'] == 'video']
            
            if not video_streams:
                result['errors'].append('No video stream found')
                return result
            
            video_stream = video_streams[0]
            
            result['info'] = {
                'duration': float(probe['format'].get('duration', 0)),
                'width': int(video_stream.get('width', 0)),
                'height': int(video_stream.get('height', 0)),
                'codec': video_stream.get('codec_name'),
                'bitrate': int(probe['format'].get('bit_rate', 0))
            }
            
            # Check video duration (max 4 hours)
            if result['info']['duration'] > 14400:  # 4 hours in seconds
                result['errors'].append('Video too long (max: 4 hours)')
            
            result['valid'] = len(result['errors']) == 0
            
        except Exception as e:
            result['errors'].append(f'Invalid video file: {str(e)}')
        
        return result
    
    @staticmethod
    def optimize_image(input_path: str, output_path: str, max_width: int = 1920, quality: int = 85) -> bool:
        """
        Optimize image for web delivery.
        
        Args:
            input_path: Input image path
            output_path: Output image path
            max_width: Maximum width for resizing
            quality: JPEG quality (1-100)
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            with Image.open(input_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Resize if necessary
                if img.width > max_width:
                    ratio = max_width / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                
                # Save with optimization
                img.save(output_path, 'JPEG', quality=quality, optimize=True)
                
            logger.info(f"Image optimized: {input_path} -> {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to optimize image {input_path}: {e}")
            return False
    
    @staticmethod
    def create_video_thumbnail(video_path: str, thumbnail_path: str, time_offset: float = 10.0) -> bool:
        """
        Create thumbnail from video.
        
        Args:
            video_path: Input video path
            thumbnail_path: Output thumbnail path
            time_offset: Time offset in seconds for thumbnail
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            (
                ffmpeg
                .input(video_path, ss=time_offset)
                .output(thumbnail_path, vframes=1, format='image2', vcodec='mjpeg')
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            
            logger.info(f"Video thumbnail created: {video_path} -> {thumbnail_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create video thumbnail {video_path}: {e}")
            return False
    
    @staticmethod
    def compress_video(input_path: str, output_path: str, target_bitrate: str = "1000k") -> bool:
        """
        Compress video for web delivery.
        
        Args:
            input_path: Input video path
            output_path: Output video path
            target_bitrate: Target bitrate (e.g., "1000k")
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            (
                ffmpeg
                .input(input_path)
                .output(
                    output_path,
                    vcodec='libx264',
                    acodec='aac',
                    video_bitrate=target_bitrate,
                    audio_bitrate='128k',
                    format='mp4'
                )
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            
            logger.info(f"Video compressed: {input_path} -> {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to compress video {input_path}: {e}")
            return False
    
    @staticmethod
    def calculate_file_hash(file_path: str, algorithm: str = 'sha256') -> Optional[str]:
        """
        Calculate file hash for deduplication.
        
        Args:
            file_path: Path to the file
            algorithm: Hash algorithm to use
            
        Returns:
            File hash or None if failed
        """
        try:
            hash_obj = hashlib.new(algorithm)
            
            with open(file_path, 'rb') as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_obj.update(chunk)
            
            return hash_obj.hexdigest()
            
        except Exception as e:
            logger.error(f"Failed to calculate hash for {file_path}: {e}")
            return None


class ChunkedUploadManager:
    """
    Manager for handling chunked file uploads for large files.
    """
    
    def __init__(self, upload_dir: str, chunk_size: int = 1024 * 1024):  # 1MB chunks
        self.upload_dir = Path(upload_dir)
        self.chunk_size = chunk_size
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def initialize_upload(self, file_name: str, file_size: int, file_hash: str) -> str:
        """
        Initialize a chunked upload session.
        
        Args:
            file_name: Name of the file
            file_size: Total file size
            file_hash: File hash for verification
            
        Returns:
            Upload session ID
        """
        session_id = hashlib.md5(f"{file_name}_{file_size}_{file_hash}".encode()).hexdigest()
        
        session_dir = self.upload_dir / session_id
        session_dir.mkdir(exist_ok=True)
        
        # Create session metadata
        metadata = {
            'file_name': file_name,
            'file_size': file_size,
            'file_hash': file_hash,
            'chunks_received': [],
            'total_chunks': (file_size + self.chunk_size - 1) // self.chunk_size
        }
        
        metadata_path = session_dir / 'metadata.json'
        with open(metadata_path, 'w') as f:
            import json
            json.dump(metadata, f)
        
        return session_id
    
    def upload_chunk(self, session_id: str, chunk_index: int, chunk_data: bytes) -> Dict[str, Any]:
        """
        Upload a file chunk.
        
        Args:
            session_id: Upload session ID
            chunk_index: Index of the chunk
            chunk_data: Chunk data
            
        Returns:
            Dict containing upload status
        """
        session_dir = self.upload_dir / session_id
        
        if not session_dir.exists():
            return {'success': False, 'error': 'Invalid session ID'}
        
        # Load metadata
        metadata_path = session_dir / 'metadata.json'
        with open(metadata_path, 'r') as f:
            import json
            metadata = json.load(f)
        
        # Save chunk
        chunk_path = session_dir / f'chunk_{chunk_index}'
        with open(chunk_path, 'wb') as f:
            f.write(chunk_data)
        
        # Update metadata
        if chunk_index not in metadata['chunks_received']:
            metadata['chunks_received'].append(chunk_index)
        
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f)
        
        # Check if upload is complete
        is_complete = len(metadata['chunks_received']) == metadata['total_chunks']
        
        return {
            'success': True,
            'chunks_received': len(metadata['chunks_received']),
            'total_chunks': metadata['total_chunks'],
            'is_complete': is_complete
        }
    
    def finalize_upload(self, session_id: str, output_path: str) -> Dict[str, Any]:
        """
        Finalize chunked upload by combining chunks.
        
        Args:
            session_id: Upload session ID
            output_path: Final file output path
            
        Returns:
            Dict containing finalization status
        """
        session_dir = self.upload_dir / session_id
        
        if not session_dir.exists():
            return {'success': False, 'error': 'Invalid session ID'}
        
        # Load metadata
        metadata_path = session_dir / 'metadata.json'
        with open(metadata_path, 'r') as f:
            import json
            metadata = json.load(f)
        
        # Check if all chunks are received
        if len(metadata['chunks_received']) != metadata['total_chunks']:
            return {'success': False, 'error': 'Not all chunks received'}
        
        try:
            # Combine chunks
            with open(output_path, 'wb') as output_file:
                for chunk_index in sorted(metadata['chunks_received']):
                    chunk_path = session_dir / f'chunk_{chunk_index}'
                    with open(chunk_path, 'rb') as chunk_file:
                        output_file.write(chunk_file.read())
            
            # Verify file hash
            calculated_hash = FileOptimizer.calculate_file_hash(output_path)
            if calculated_hash != metadata['file_hash']:
                os.remove(output_path)
                return {'success': False, 'error': 'File hash mismatch'}
            
            # Clean up session directory
            import shutil
            shutil.rmtree(session_dir)
            
            return {
                'success': True,
                'file_path': output_path,
                'file_size': os.path.getsize(output_path)
            }
            
        except Exception as e:
            logger.error(f"Failed to finalize upload {session_id}: {e}")
            return {'success': False, 'error': str(e)}


class StreamingOptimizer:
    """
    Optimizer for video streaming and progressive download.
    """
    
    @staticmethod
    def create_adaptive_bitrate_versions(input_path: str, output_dir: str) -> List[Dict[str, Any]]:
        """
        Create multiple bitrate versions for adaptive streaming.
        
        Args:
            input_path: Input video path
            output_dir: Output directory for versions
            
        Returns:
            List of created versions with metadata
        """
        versions = [
            {'name': '480p', 'width': 854, 'height': 480, 'bitrate': '500k'},
            {'name': '720p', 'width': 1280, 'height': 720, 'bitrate': '1000k'},
            {'name': '1080p', 'width': 1920, 'height': 1080, 'bitrate': '2000k'}
        ]
        
        created_versions = []
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        for version in versions:
            try:
                output_file = output_path / f"{version['name']}.mp4"
                
                (
                    ffmpeg
                    .input(input_path)
                    .output(
                        str(output_file),
                        vf=f"scale={version['width']}:{version['height']}",
                        vcodec='libx264',
                        acodec='aac',
                        video_bitrate=version['bitrate'],
                        audio_bitrate='128k',
                        format='mp4'
                    )
                    .overwrite_output()
                    .run(capture_stdout=True, capture_stderr=True)
                )
                
                created_versions.append({
                    'name': version['name'],
                    'path': str(output_file),
                    'width': version['width'],
                    'height': version['height'],
                    'bitrate': version['bitrate'],
                    'size': os.path.getsize(output_file)
                })
                
                logger.info(f"Created {version['name']} version: {output_file}")
                
            except Exception as e:
                logger.error(f"Failed to create {version['name']} version: {e}")
        
        return created_versions
    
    @staticmethod
    def optimize_for_progressive_download(input_path: str, output_path: str) -> bool:
        """
        Optimize video for progressive download (move moov atom to beginning).
        
        Args:
            input_path: Input video path
            output_path: Output video path
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            (
                ffmpeg
                .input(input_path)
                .output(output_path, movflags='faststart', vcodec='copy', acodec='copy')
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            
            logger.info(f"Video optimized for progressive download: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to optimize video for progressive download: {e}")
            return False