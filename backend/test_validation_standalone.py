"""
Standalone test for validation utilities.
"""

import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

def test_input_sanitizer():
    """Test input sanitization functionality."""
    from app.utils.validation import InputSanitizer
    
    print("Testing InputSanitizer...")
    
    # Test HTML sanitization
    dangerous_html = '<script>alert("xss")</script><p>Safe content</p>'
    sanitized = InputSanitizer.sanitize_html(dangerous_html)
    assert '<script>' not in sanitized
    assert '<p>Safe content</p>' in sanitized
    print("✓ HTML sanitization works")
    
    # Test text sanitization
    text_with_html = '<script>alert("xss")</script>Normal text'
    sanitized = InputSanitizer.sanitize_text(text_with_html)
    assert '&lt;script&gt;' in sanitized
    assert '<script>' not in sanitized
    print("✓ Text sanitization works")
    
    # Test email validation
    assert InputSanitizer.validate_email('user@example.com')
    assert not InputSanitizer.validate_email('invalid-email')
    print("✓ Email validation works")
    
    # Test password strength
    strong_password = 'StrongP@ssw0rd123'
    result = InputSanitizer.validate_password_strength(strong_password)
    assert result['valid']
    assert result['score'] >= 4
    print("✓ Password strength validation works")
    
    # Test pattern validation
    assert InputSanitizer.validate_pattern('user123', 'username')
    assert not InputSanitizer.validate_pattern('us', 'username')
    print("✓ Pattern validation works")
    
    # Test filename sanitization
    dangerous_filename = '../../../etc/passwd'
    sanitized = InputSanitizer.sanitize_filename(dangerous_filename)
    assert '..' not in sanitized
    assert '/' not in sanitized
    print("✓ Filename sanitization works")
    
    # Test file type validation
    allowed_extensions = ['jpg', 'png', 'gif']
    assert InputSanitizer.validate_file_type('image.jpg', allowed_extensions)
    assert not InputSanitizer.validate_file_type('document.pdf', allowed_extensions)
    print("✓ File type validation works")
    
    print("All InputSanitizer tests passed!")


def test_validation_functions():
    """Test validation utility functions."""
    from app.utils.validation import (
        validate_required_fields,
        validate_field_length,
        validate_numeric_range,
        ValidationError
    )
    
    print("\nTesting validation functions...")
    
    # Test required fields validation
    data = {'name': 'John', 'email': 'john@example.com'}
    required_fields = ['name', 'email']
    validate_required_fields(data, required_fields)  # Should not raise
    print("✓ Required fields validation 