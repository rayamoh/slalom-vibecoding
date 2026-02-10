"""Alert model - represents fraud detection alerts."""

import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, Column, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class AlertStatus(str, enum.Enum):
    """Alert status enumeration."""

    NEW = "new"
    IN_REVIEW = "in_review"
    PENDING_INFO = "pending_info"
    ESCALATED = "escalated"
    CLOSED = "closed"


class AlertPriority(str, enum.Enum):
    """Alert priority enumeration."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RiskBand(str, enum.Enum):
    """Risk band enumeration."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Alert(Base):
    """
    Alert model representing a fraud detection alert.
    
    An alert is created when a transaction is scored and triggers
    either ML model thresholds or rule-based detection.
    """

    __tablename__ = "alerts"

    # Primary Key
    id = Column(
        UUID(as_uuid=True) if "postgresql" else String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        unique=True,
        nullable=False,
    )

    # Foreign Key to transaction
    transaction_id = Column(
        UUID(as_uuid=True) if "postgresql" else String(36),
        ForeignKey("transactions.id"),
        nullable=False,
        index=True,
    )

    # Alert Status
    status = Column(
        Enum(AlertStatus),
        default=AlertStatus.NEW,
        nullable=False,
        index=True,
    )

    priority = Column(
        Enum(AlertPriority),
        default=AlertPriority.MEDIUM,
        nullable=False,
        index=True,
    )

    # ML Scoring Information
    ml_score = Column(Float, nullable=False)  # 0.0 to 1.0
    ml_risk_band = Column(Enum(RiskBand), nullable=False, index=True)
    ml_reason_codes = Column(JSON, nullable=False, default=list)  # ["high_amount", "new_counterparty"]
    shap_values = Column(JSON, nullable=True)  # [{"feature": "amount_zscore", "value": 0.45}]

    # Rule-based Detection
    rules_triggered = Column(JSON, nullable=False, default=list)  # [{"rule_id": "R001", "rule_name": "...", "reason": "..."}]

    # Assignment and Notes
    assigned_to = Column(String(100), nullable=True, index=True)
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    transaction = relationship("Transaction", back_populates="alerts")
    cases = relationship("Case", secondary="case_alerts", back_populates="alerts")

    def __repr__(self) -> str:
        return f"<Alert(id={self.id}, status={self.status}, priority={self.priority}, ml_score={self.ml_score})>"

    @property
    def is_closed(self) -> bool:
        """Check if alert is closed."""
        return self.status == AlertStatus.CLOSED

    @property
    def is_high_priority(self) -> bool:
        """Check if alert is high or critical priority."""
        return self.priority in (AlertPriority.HIGH, AlertPriority.CRITICAL)

    @property
    def has_rules_triggered(self) -> bool:
        """Check if any rules were triggered."""
        return len(self.rules_triggered) > 0

    @property
    def combined_detection(self) -> bool:
        """Check if both ML and rules detected fraud."""
        return self.ml_score >= 0.7 and self.has_rules_triggered
