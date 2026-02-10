"""Pydantic schemas for Alert API requests and responses."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.alert import AlertPriority, AlertStatus, RiskBand


# Embedded schemas
class RuleTrigger(BaseModel):
    """Rule trigger information."""

    rule_id: str
    rule_name: str
    reason: str


class ShapValue(BaseModel):
    """SHAP feature contribution."""

    feature: str
    value: float


class TransactionSummary(BaseModel):
    """Embedded transaction information in alert response."""

    type: str
    amount: float
    step: int
    timestamp: Optional[datetime] = None
    nameOrig: str
    nameDest: str

    class Config:
        from_attributes = True


# Request schemas
class AlertUpdate(BaseModel):
    """Schema for updating an alert."""

    status: Optional[AlertStatus] = None
    priority: Optional[AlertPriority] = None
    assigned_to: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v):
        if v and len(v) > 5000:
            raise ValueError("Notes must not exceed 5000 characters")
        return v


class BulkAlertUpdate(BaseModel):
    """Schema for bulk updating multiple alerts."""

    alert_ids: List[UUID] = Field(..., min_length=1, max_length=100)
    status: Optional[AlertStatus] = None
    priority: Optional[AlertPriority] = None
    assigned_to: Optional[str] = Field(None, max_length=100)


# Response schemas
class AlertBase(BaseModel):
    """Base alert schema with common fields."""

    id: UUID
    transaction_id: UUID
    status: AlertStatus
    priority: AlertPriority
    ml_score: float = Field(..., ge=0.0, le=1.0)
    ml_risk_band: RiskBand
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AlertList(AlertBase):
    """Alert schema for list views (without full details)."""

    transaction_type: str
    transaction_amount: float
    assigned_to: Optional[str] = None
    rules_count: int = 0

    @field_validator("rules_count", mode="before")
    @classmethod
    def count_rules(cls, v, info):
        """Calculate number of triggered rules."""
        if "rules_triggered" in info.data:
            return len(info.data["rules_triggered"])
        return 0


class AlertDetail(AlertBase):
    """Alert schema for detail views (with full information)."""

    ml_reason_codes: List[str]
    shap_values: Optional[List[ShapValue]] = None
    rules_triggered: List[RuleTrigger]
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    transaction: TransactionSummary

    class Config:
        from_attributes = True


# Filter schema
class AlertFilter(BaseModel):
    """Schema for filtering alerts."""

    status: Optional[List[AlertStatus]] = None
    priority: Optional[List[AlertPriority]] = None
    risk_band: Optional[List[RiskBand]] = None
    assigned_to: Optional[str] = None
    min_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    max_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    min_amount: Optional[float] = Field(None, ge=0)
    max_amount: Optional[float] = None
    transaction_type: Optional[List[str]] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None


# Pagination schema
class PaginatedAlerts(BaseModel):
    """Paginated alert response."""

    items: List[AlertList]
    total: int
    page: int
    page_size: int
    total_pages: int


# API Response wrapper
class AlertResponse(BaseModel):
    """Standard API response for alerts."""

    status: str = "success"
    data: AlertDetail
    metadata: dict = {"request_id": None, "timestamp": None, "version": "v1"}


class AlertListResponse(BaseModel):
    """Standard API response for alert list."""

    status: str = "success"
    data: PaginatedAlerts
    metadata: dict = {"request_id": None, "timestamp": None, "version": "v1"}
