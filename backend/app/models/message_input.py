#!/usr/bin/env python3
"""
Message input models for API endpoints
"""

from pydantic import BaseModel, Field, field_validator
from typing import Dict, Any

class MessageContentInput(BaseModel):
    """Model for message content input (without destination)"""
    content: Dict[str, Any] = Field(..., description="TipTap JSON content")

    @field_validator('content')
    @classmethod
    def validate_content(cls, v):
        if not isinstance(v, dict):
            raise ValueError('Content must be a JSON object')
        
        if v.get('type') != 'doc':
            raise ValueError('Content must be a TipTap document with type "doc"')
        
        if not isinstance(v.get('content'), list):
            raise ValueError('Document content must be an array')
        
        # Validate message length by extracting text
        text_length = cls._extract_text_length(v)
        if text_length > 2000:
            raise ValueError('Message too long (max 2000 characters)')
        
        if text_length == 0:
            raise ValueError('Message cannot be empty')
        
        return v
    
    @classmethod
    def _extract_text_length(cls, content: Dict[str, Any]) -> int:
        """Extract total text length from TipTap content"""
        def extract_text_recursive(node: Dict[str, Any]) -> str:
            text = ""
            if node.get('type') == 'text':
                text += node.get('text', '')
            elif 'content' in node and isinstance(node['content'], list):
                for child in node['content']:
                    text += extract_text_recursive(child)
            return text
        
        return len(extract_text_recursive(content))