"""Transaction model - represents mobile money transactions."""

import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class TransactionType(str, enum.Enum):
    """Transaction type enumeration."""

    CASH_IN = "CASH_IN"
    CASH_OUT = "CASH_OUT"
    DEBIT = "DEBIT"
    PAYMENT = "PAYMENT"
    TRANSFER = "TRANSFER"


class Transaction(Base):
    """
    Transaction model representing a mobile money transaction.
    
    Based on PaySim synthetic dataset structure.
    Note: Balance columns (oldbalance*, newbalance*) are stored but
    MUST NOT be used for feature engineering due to data quality issues.
    """

    __tablename__ = "transactions"

    # Primary Key
    id = Column(
        UUID(as_uuid=True) if "postgresql" else String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        unique=True,
        nullable=False,
    )

    # Transaction Details
    step = Column(Integer, nullable=False, index=True)  # Time step (1-744)
    type = Column(Enum(TransactionType), nullable=False, index=True)
    amount = Column(Numeric(precision=15, scale=2), nullable=False, index=True)

    # Entities (Sender and Receiver)
    nameOrig = Column(String(100), nullable=False, index=True)  # Sender
    nameDest = Column(String(100), nullable=False, index=True)  # Receiver

    # Balance Information (DO NOT USE FOR FEATURES)
    # These columns are unreliable for fraud detection
    oldbalanceOrg = Column(Numeric(precision=15, scale=2), nullable=True)
    newbalanceOrig = Column(Numeric(precision=15, scale=2), nullable=True)
    oldbalanceDest = Column(Numeric(precision=15, scale=2), nullable=True)
    newbalanceDest = Column(Numeric(precision=15, scale=2), nullable=True)

    # Labels
    isFraud = Column(Boolean, default=False, nullable=False, index=True)  # Ground truth
    isFlaggedFraud = Column(Boolean, default=False, nullable=False, index=True)  # Rule-based flag

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    alerts = relationship("Alert", back_populates="transaction", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Transaction(id={self.id}, type={self.type}, amount={self.amount}, isFraud={self.isFraud})>"

    @property
    def is_high_value(self) -> bool:
        """Check if transaction is high value (>200,000)."""
        return self.amount > 200000

    @property
    def is_transfer_type(self) -> bool:
        """Check if transaction is TRANSFER or CASH_OUT."""
        return self.type in (TransactionType.TRANSFER, TransactionType.CASH_OUT)

    @property
    def is_flagged(self) -> bool:
        """Check if transaction was flagged by rule."""
        return self.isFlaggedFraud
