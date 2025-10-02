"""
Simple tests for input validation utilities without database dependencies.
"""

import pytest
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from app.utils.validation import (
    InputSanitizer,
    ValidationError,
    validate_required_fields,
    validate_field_length,
    validate_numeric_range,
)


class TestInputSanitizer:
    """Test input sanitization functionality."""

    def test_sanitize_html_removes_dangerous_tags(self):
        """Test that dangerous HTML tags are removed."""
        dangerous_html = '<script>alert("xss")</script><p>Safe content</p>'
        sanitized = InputSanitizer.sanitize_html(dangerous_html)

        assert "<script>" not in sanitized
        assert 'alert("xss")' not in sanitized
        assert "<p>Safe content</p>" in sanitized

    def test_sanitize_html_allows_safe_tags(self):
        """Test that safe HTML tags are preserved."""
        safe_html = "<p>This is <strong>bold</strong> and <em>italic</em> text.</p>"
        sanitized = InputSanitizer.sanitize_html(safe_html)

        assert sanitized == safe_html

    def test_sanitize_text_escapes_html(self):
        """Test that text sanitization escapes HTML."""
        text_with_html = '<script>alert("xss")</script>Normal text'
        sanitized = InputSanitizer.sanitize_text(text_with_html)

        assert "&lt;script&gt;" in sanitized
        assert "<script>" not in sanitized
        assert "Normal text" in sanitized

    def test_sanitize_text_removes_control_characters(self):
        """Test that control characters are removed."""
        text_with_control = "Normal text\x00\x01\x02More text"
        sanitized = InputSanitizer.sanitize_text(text_with_control)

        assert "\x00" not in sanitized
        assert "\x01" not in sanitized
        assert "\x02" not in sanitized
        assert "Normal textMore text" == sanitized

    def test_sanitize_text_preserves_newlines_and_tabs(self):
        """Test that newlines and tabs are preserved."""
        text_with_whitespace = "Line 1\nLine 2\tTabbed"
        sanitized = InputSanitizer.sanitize_text(text_with_whitespace)

        assert "\n" in sanitized
        assert "\t" in sanitized

    def test_sanitize_text_truncates_long_content(self):
        """Test that long content is truncated."""
        long_text = "a" * 1000
        sanitized = InputSanitizer.sanitize_text(long_text, max_length=100)

        assert len(sanitized) == 100

    def test_validate_email_valid_addresses(self):
        """Test email validation with valid addresses."""
        valid_emails = [
            "user@example.com",
            "test.email+tag@domain.co.uk",
            "user123@test-domain.org",
        ]

        for email in valid_emails:
            assert InputSanitizer.validate_email(email)

    def test_validate_email_invalid_addresses(self):
        """Test email validation with invalid addresses."""
        invalid_emails = [
            "invalid-email",
            "@domain.com",
            "user@",
            "user..double.dot@domain.com",
        ]

        for email in invalid_emails:
            assert not InputSanitizer.validate_email(email)

    def test_validate_password_strength_strong_password(self):
        """Test password strength validation with strong password."""
        strong_password = "StrongP@ssw0rd123"
        result = InputSanitizer.validate_password_strength(strong_password)

        assert result["valid"]
        assert result["score"] >= 4
        assert len(result["issues"]) == 0

    def test_validate_password_strength_weak_password(self):
        """Test password strength validation with weak password."""
        weak_password = "weak"
        result = InputSanitizer.validate_password_strength(weak_password)

        assert not result["valid"]
        assert result["score"] < 4
        assert len(result["issues"]) > 0
        assert any("8 characters" in issue for issue in result["issues"])

    def test_validate_pattern_username(self):
        """Test pattern validation for usernames."""
        valid_usernames = ["user123", "test_user", "user-name"]
        invalid_usernames = ["us", "user@name", "user name", "a" * 31]

        for username in valid_usernames:
            assert InputSanitizer.validate_pattern(username, "username")

        for username in invalid_usernames:
            assert not InputSanitizer.validate_pattern(username, "username")

    def test_validate_pattern_url(self):
        """Test pattern validation for URLs."""
        valid_urls = [
            "https://example.com",
            "http://test.domain.org/path",
            "https://localhost:8000",
        ]
        invalid_urls = ["not-a-url", "ftp://example.com", 'javascript:alert("xss")']

        for url in valid_urls:
            assert InputSanitizer.validate_pattern(url, "url")

        for url in invalid_urls:
            assert not InputSanitizer.validate_pattern(url, "url")

    def test_sanitize_filename(self):
        """Test filename sanitization."""
        dangerous_filename = "../../../etc/passwd"
        sanitized = InputSanitizer.sanitize_filename(dangerous_filename)

        assert ".." not in sanitized
        assert "/" not in sanitized
        assert sanitized == "etcpasswd"

    def test_sanitize_filename_with_extension(self):
        """Test filename sanitization preserves extensions."""
        filename = "my<file>name.txt"
        sanitized = InputSanitizer.sanitize_filename(filename)

        assert "<" not in sanitized
        assert ">" not in sanitized
        assert sanitized.endswith(".txt")

    def test_validate_file_type(self):
        """Test file type validation."""
        allowed_extensions = ["jpg", "png", "gif"]

        assert InputSanitizer.validate_file_type("image.jpg", allowed_extensions)
        assert InputSanitizer.validate_file_type("photo.PNG", allowed_extensions)
        assert not InputSanitizer.validate_file_type("document.pdf", allowed_extensions)
        assert not InputSanitizer.validate_file_type("noextension", allowed_extensions)

    def test_sanitize_json_input(self):
        """Test JSON input sanitization."""
        malicious_json = {
            "name": '<script>alert("xss")</script>',
            "description": "Normal description",
            "nested": {"value": 'javascript:alert("xss")'},
        }

        sanitized = InputSanitizer.sanitize_json_input(malicious_json)

        assert "<script>" not in str(sanitized)
        assert "Normal description" in str(sanitized)
        assert "javascript:" not in str(sanitized)

    def test_sanitize_json_input_max_depth(self):
        """Test JSON input sanitization respects max depth."""
        # Create deeply nested JSON
        deep_json = {"level1": {"level2": {"level3": {"level4": {"level5": "value"}}}}}

        with pytest.raises(ValueError, match="JSON nesting too deep"):
            InputSanitizer.sanitize_json_input(deep_json, max_depth=3)


class TestValidationFunctions:
    """Test validation utility functions."""

    def test_validate_required_fields_success(self):
        """Test required fields validation with valid data."""
        data = {"name": "John", "email": "john@example.com", "age": 25}
        required_fields = ["name", "email"]

        # Should not raise exception
        validate_required_fields(data, required_fields)

    def test_validate_required_fields_missing_field(self):
        """Test required fields validation with missing field."""
        data = {"name": "John"}
        required_fields = ["name", "email"]

        with pytest.raises(ValidationError) as exc_info:
            validate_required_fields(data, required_fields)

        assert "email" in str(exc_info.value)
        assert "required" in str(exc_info.value)

    def test_validate_required_fields_empty_field(self):
        """Test required fields validation with empty field."""
        data = {"name": "John", "email": ""}
        required_fields = ["name", "email"]

        with pytest.raises(ValidationError) as exc_info:
            validate_required_fields(data, required_fields)

        assert "email" in str(exc_info.value)
        assert "empty" in str(exc_info.value)

    def test_validate_field_length_success(self):
        """Test field length validation with valid length."""
        validate_field_length("valid_length", "test_field", min_length=5, max_length=20)

    def test_validate_field_length_too_short(self):
        """Test field length validation with too short value."""
        with pytest.raises(ValidationError) as exc_info:
            validate_field_length("abc", "test_field", min_length=5)

        assert "at least 5 characters" in str(exc_info.value)

    def test_validate_field_length_too_long(self):
        """Test field length validation with too long value."""
        with pytest.raises(ValidationError) as exc_info:
            validate_field_length("a" * 100, "test_field", max_length=50)

        assert "no more than 50 characters" in str(exc_info.value)

    def test_validate_numeric_range_success(self):
        """Test numeric range validation with valid value."""
        validate_numeric_range(15, "test_field", min_value=10, max_value=20)

    def test_validate_numeric_range_too_low(self):
        """Test numeric range validation with too low value."""
        with pytest.raises(ValidationError) as exc_info:
            validate_numeric_range(5, "test_field", min_value=10)

        assert "at least 10" in str(exc_info.value)

    def test_validate_numeric_range_too_high(self):
        """Test numeric range validation with too high value."""
        with pytest.raises(ValidationError) as exc_info:
            validate_numeric_range(25, "test_field", max_value=20)

        assert "no more than 20" in str(exc_info.value)


class TestValidationError:
    """Test ValidationError exception."""

    def test_validation_error_with_field(self):
        """Test ValidationError with field name."""
        error = ValidationError("Test error message", "test_field")

        assert str(error) == "Test error message"
        assert error.field == "test_field"
        assert error.message == "Test error message"

    def test_validation_error_without_field(self):
        """Test ValidationError without field name."""
        error = ValidationError("Test error message")

        assert str(error) == "Test error message"
        assert error.field is None
        assert error.message == "Test error message"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
