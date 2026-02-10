"""Test cases for alert endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.models.alert import AlertStatus, AlertPriority


class TestAlertEndpoints:
    """Test suite for alert API endpoints."""
    
    def test_health_check(self, client: TestClient):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
    
    def test_root_endpoint(self, client: TestClient):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "docs" in data
    
    # Alert CRUD tests will be added after implementing the alert router
    # Placeholder tests below:
    
    @pytest.mark.skip(reason="Alert router not yet implemented")
    def test_list_alerts(self, client: TestClient, multiple_alerts):
        """Test listing alerts with pagination."""
        response = client.get("/api/alerts?page=1&page_size=5")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert len(data["data"]["items"]) <= 5
        assert "total" in data["data"]
    
    @pytest.mark.skip(reason="Alert router not yet implemented")
    def test_get_alert_detail(self, client: TestClient, sample_alert):
        """Test getting alert details."""
        response = client.get(f"/api/alerts/{sample_alert.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["data"]["id"] == str(sample_alert.id)
        assert "ml_score" in data["data"]
        assert "shap_values" in data["data"]
    
    @pytest.mark.skip(reason="Alert router not yet implemented")
    def test_update_alert_status(self, client: TestClient, sample_alert):
        """Test updating alert status."""
        response = client.patch(
            f"/api/alerts/{sample_alert.id}",
            json={"status": "in_review", "notes": "Investigating"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["status"] == "in_review"
        assert data["data"]["notes"] == "Investigating"
    
    @pytest.mark.skip(reason="Alert router not yet implemented")
    def test_filter_alerts_by_status(self, client: TestClient, multiple_alerts):
        """Test filtering alerts by status."""
        response = client.get("/api/alerts?status=new")
        assert response.status_code == 200
        data = response.json()
        items = data["data"]["items"]
        assert all(item["status"] == "new" for item in items)
    
    @pytest.mark.skip(reason="Alert router not yet implemented")
    def test_filter_alerts_by_priority(self, client: TestClient, multiple_alerts):
        """Test filtering alerts by priority."""
        response = client.get("/api/alerts?priority=critical&priority=high")
        assert response.status_code == 200
        data = response.json()
        items = data["data"]["items"]
        assert all(item["priority"] in ["critical", "high"] for item in items)
    
    @pytest.mark.skip(reason="Alert router not yet implemented")
    def test_bulk_update_alerts(self, client: TestClient, multiple_alerts):
        """Test bulk updating multiple alerts."""
        alert_ids = [str(alert.id) for alert in multiple_alerts[:3]]
        response = client.post(
            "/api/alerts/bulk-update",
            json={
                "alert_ids": alert_ids,
                "status": "in_review",
                "assigned_to": "Test Analyst"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["data"]["updated_count"] == 3
