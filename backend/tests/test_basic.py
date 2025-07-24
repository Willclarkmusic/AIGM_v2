"""
Basic tests to verify API setup is working
"""

import pytest
from fastapi.testclient import TestClient


def test_health_endpoint(test_client):
    """Test that the health endpoint is working"""
    response = test_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"


def test_root_endpoint(test_client):
    """Test that the root endpoint is working"""
    response = test_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "AIGM API" in data["message"]


def test_user_search_endpoint_exists(unauthenticated_client):
    """Test that the user search endpoint exists (without auth)"""
    response = unauthenticated_client.get("/api/users/search?q=test")
    # Should return 403 forbidden (not 404 not found)
    assert response.status_code == 403