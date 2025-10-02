"""
Input validation and sanitization utilities.
"""

import re
import html
import bleach
from typing import Any, Dict, List, Optional, Union
from email_validator import validate_email, EmailNotValidError
from pydantic import BaseModel, validator
import unicodedata


class InputSanitizer:
    """
    Utility class for input sanitization and validation.
    """

    # Allowed HTML tags for rich text content
    ALLOWED_TAGS = [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "ol",
        "ul",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
        "code",
        "pre",
        "a",
        "img",
    ]

    ALLOWED_ATTRIBUTES = {
        "a": ["href", "title"],
        "img": ["src", "alt", "title", "width", "height"],
        "*": ["class"],
    }

    # Common validation patterns
    PATTERNS = {
        "username": re.compile(r"^[a-zA-Z0-9_-]{3,30}$"),
        "password": re.compile(
            r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
        ),
        "phone": re.compile(
            r"^\+?1?-?\.?\s?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$"
        ),
        "slug": re.compile(r"^[a-z0-9-]+$"),
        "hex_color": re.compile(r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"),
        "url": re.compile(
            r"^https?://"  # http:// or https://
            r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"  # domain...
            r"localhost|"  # localhost...
            r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"  # ...or ip
            r"(?::\d+)?"  # optional port
            r"(?:/?|[/?]\S+)$",
            re.IGNORECASE,
        ),
    }

    @classmethod
    def sanitize_html(
        cls, content: str, allowed_tags: Optional[List[str]] = None
    ) -> str:
        """
        Sanitize HTML content to prevent XSS attacks.

        Args:
            content: HTML content to sanitize
            allowed_tags: List of allowed HTML tags (uses default if None)

        Returns:
            Sanitized HTML content
        """
        if not content:
            return ""

        tags = allowed_tags or cls.ALLOWED_TAGS

        # First remove dangerous content with regex before bleach processing
        dangerous_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"on\w+\s*=",
            r"<iframe[^>]*>.*?</iframe>",
            r"<object[^>]*>.*?</object>",
            r"<embed[^>]*>.*?</embed>",
        ]

        sanitized = content
        for pattern in dangerous_patterns:
            sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE | re.DOTALL)

        # Then use bleach to sanitize remaining HTML
        sanitized = bleach.clean(
            sanitized, tags=tags, attributes=cls.ALLOWED_ATTRIBUTES, strip=True
        )

        return sanitized

    @classmethod
    def sanitize_text(cls, text: str, max_length: Optional[int] = None) -> str:
        """
        Sanitize plain text input.

        Args:
            text: Text to sanitize
            max_length: Maximum allowed length

        Returns:
            Sanitized text
        """
        if not text:
            return ""

        # Normalize unicode characters
        text = unicodedata.normalize("NFKC", text)

        # HTML escape
        text = html.escape(text)

        # Remove control characters except newlines and tabs
        text = "".join(char for char in text if ord(char) >= 32 or char in "\n\t")

        # Trim whitespace
        text = text.strip()

        # Truncate if necessary
        if max_length and len(text) > max_length:
            text = text[:max_length]

        return text

    @classmethod
    def validate_email(cls, email: str) -> bool:
        """
        Validate email address format.

        Args:
            email: Email address to validate

        Returns:
            True if valid, False otherwise
        """
        try:
            from email_validator import validate_email as email_validate

            # Disable DNS checking for testing
            email_validate(email, check_deliverability=False)
            return True
        except Exception:
            return False

    @classmethod
    def validate_password_strength(cls, password: str) -> Dict[str, Any]:
        """
        Validate password strength.

        Args:
            password: Password to validate

        Returns:
            Dictionary with validation results
        """
        result = {"valid": False, "score": 0, "issues": []}

        if len(password) < 8:
            result["issues"].append("Password must be at least 8 characters long")
        else:
            result["score"] += 1

        if not re.search(r"[a-z]", password):
            result["issues"].append(
                "Password must contain at least one lowercase letter"
            )
        else:
            result["score"] += 1

        if not re.search(r"[A-Z]", password):
            result["issues"].append(
                "Password must contain at least one uppercase letter"
            )
        else:
            result["score"] += 1

        if not re.search(r"\d", password):
            result["issues"].append("Password must contain at least one digit")
        else:
            result["score"] += 1

        if not re.search(r"[@$!%*?&]", password):
            result["issues"].append(
                "Password must contain at least one special character (@$!%*?&)"
            )
        else:
            result["score"] += 1

        # Check for common patterns
        if re.search(r"(.)\1{2,}", password):  # Repeated characters
            result["issues"].append("Password should not contain repeated characters")

        if re.search(r"(012|123|234|345|456|567|678|789|890)", password):
            result["issues"].append("Password should not contain sequential numbers")

        if re.search(
            r"(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)",
            password.lower(),
        ):
            result["issues"].append("Password should not contain sequential letters")

        result["valid"] = len(result["issues"]) == 0

        return result

    @classmethod
    def validate_pattern(cls, value: str, pattern_name: str) -> bool:
        """
        Validate value against a predefined pattern.

        Args:
            value: Value to validate
            pattern_name: Name of the pattern to use

        Returns:
            True if valid, False otherwise
        """
        pattern = cls.PATTERNS.get(pattern_name)
        if not pattern:
            return False

        return bool(pattern.match(value))

    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """
        Sanitize filename to prevent directory traversal and other attacks.

        Args:
            filename: Original filename

        Returns:
            Sanitized filename
        """
        if not filename:
            return "unnamed_file"

        # Remove path separators and dangerous characters
        filename = re.sub(r'[<>:"/\\|?*]', "", filename)
        filename = re.sub(r"\.\.", "", filename)  # Remove directory traversal
        filename = filename.strip(". ")  # Remove leading/trailing dots and spaces

        # Ensure filename is not empty after sanitization
        if not filename:
            filename = "unnamed_file"

        # Limit length
        if len(filename) > 255:
            name, ext = filename.rsplit(".", 1) if "." in filename else (filename, "")
            max_name_length = 255 - len(ext) - 1 if ext else 255
            filename = name[:max_name_length] + ("." + ext if ext else "")

        return filename

    @classmethod
    def validate_file_type(cls, filename: str, allowed_extensions: List[str]) -> bool:
        """
        Validate file type based on extension.

        Args:
            filename: Filename to validate
            allowed_extensions: List of allowed file extensions (without dots)

        Returns:
            True if valid, False otherwise
        """
        if not filename or "." not in filename:
            return False

        extension = filename.rsplit(".", 1)[1].lower()
        return extension in [ext.lower() for ext in allowed_extensions]

    @classmethod
    def sanitize_json_input(
        cls, data: Dict[str, Any], max_depth: int = 10
    ) -> Dict[str, Any]:
        """
        Sanitize JSON input recursively.

        Args:
            data: JSON data to sanitize
            max_depth: Maximum nesting depth allowed

        Returns:
            Sanitized JSON data
        """

        def _sanitize_recursive(obj: Any, depth: int = 0) -> Any:
            if depth > max_depth:
                raise ValueError("JSON nesting too deep")

            if isinstance(obj, dict):
                return {
                    cls.sanitize_text(str(k)): _sanitize_recursive(v, depth + 1)
                    for k, v in obj.items()
                }
            elif isinstance(obj, list):
                return [_sanitize_recursive(item, depth + 1) for item in obj]
            elif isinstance(obj, str):
                # First remove dangerous protocols before HTML escaping
                sanitized = obj
                dangerous_protocols = [
                    "javascript:",
                    "data:",
                    "vbscript:",
                    "file:",
                    "about:",
                ]
                for protocol in dangerous_protocols:
                    if sanitized.lower().startswith(protocol.lower()):
                        # Remove the protocol part (case-insensitive)
                        sanitized = sanitized[len(protocol) :]
                        break

                # Then sanitize the text
                sanitized = cls.sanitize_text(sanitized)
                return sanitized
            else:
                return obj

        return _sanitize_recursive(data)

    @classmethod
    def sanitize_json_input(
        cls, data: Dict[str, Any], max_depth: int = 10
    ) -> Dict[str, Any]:
        """
        Sanitize JSON input recursively.

        Args:
            data: JSON data to sanitize
            max_depth: Maximum nesting depth allowed

        Returns:
            Sanitized JSON data
        """

        def _sanitize_recursive(obj: Any, depth: int = 0) -> Any:
            if depth > max_depth:
                raise ValueError("JSON nesting too deep")

            if isinstance(obj, dict):
                return {
                    cls.sanitize_text(str(k)): _sanitize_recursive(v, depth + 1)
                    for k, v in obj.items()
                }
            elif isinstance(obj, list):
                return [_sanitize_recursive(item, depth + 1) for item in obj]
            elif isinstance(obj, str):
                return cls.sanitize_text(obj)
            else:
                return obj

        return _sanitize_recursive(data)


class ValidationError(Exception):
    """Custom validation error."""

    def __init__(self, message: str, field: Optional[str] = None):
        self.message = message
        self.field = field
        super().__init__(message)


def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> None:
    """
    Validate that all required fields are present and not empty.

    Args:
        data: Data dictionary to validate
        required_fields: List of required field names

    Raises:
        ValidationError: If any required field is missing or empty
    """
    for field in required_fields:
        if field not in data:
            raise ValidationError(f"Field '{field}' is required", field)

        value = data[field]
        if value is None or (isinstance(value, str) and not value.strip()):
            raise ValidationError(f"Field '{field}' cannot be empty", field)


def validate_field_length(
    value: str, field_name: str, min_length: int = 0, max_length: int = None
) -> None:
    """
    Validate field length constraints.

    Args:
        value: Value to validate
        field_name: Name of the field
        min_length: Minimum allowed length
        max_length: Maximum allowed length

    Raises:
        ValidationError: If length constraints are violated
    """
    if len(value) < min_length:
        raise ValidationError(
            f"Field '{field_name}' must be at least {min_length} characters long",
            field_name,
        )

    if max_length and len(value) > max_length:
        raise ValidationError(
            f"Field '{field_name}' must be no more than {max_length} characters long",
            field_name,
        )


def validate_numeric_range(
    value: Union[int, float],
    field_name: str,
    min_value: Optional[Union[int, float]] = None,
    max_value: Optional[Union[int, float]] = None,
) -> None:
    """
    Validate numeric range constraints.

    Args:
        value: Numeric value to validate
        field_name: Name of the field
        min_value: Minimum allowed value
        max_value: Maximum allowed value

    Raises:
        ValidationError: If range constraints are violated
    """
    if min_value is not None and value < min_value:
        raise ValidationError(
            f"Field '{field_name}' must be at least {min_value}", field_name
        )

    if max_value is not None and value > max_value:
        raise ValidationError(
            f"Field '{field_name}' must be no more than {max_value}", field_name
        )
