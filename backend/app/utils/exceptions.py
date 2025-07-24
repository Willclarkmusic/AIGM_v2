#!/usr/bin/env python3
"""
Custom exception classes for the AIGM application
"""


class ValidationError(Exception):
    """Raised when input validation fails"""
    pass


class NotFoundError(Exception):
    """Raised when a requested resource is not found"""
    pass


class PermissionError(Exception):
    """Raised when user lacks permission for an action"""
    pass


class AuthenticationError(Exception):
    """Raised when authentication fails"""
    pass


class RateLimitError(Exception):
    """Raised when rate limit is exceeded"""
    pass