"""pytest configuration and shared fixtures."""

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from app.database import Base, get_db
from app.main import app
from app.models.transaction import Transaction, TransactionType
from app.models.alert import Alert, AlertPriority, AlertStatus, RiskBand

# Test database URL
TEST_DATABASE_URL = "sqlite:///./test_fraud_detection.db"

# Create test engine
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    # Create tables
    Base.metadata.create_all(bind=test_engine)
    
    # Create session
    session = TestSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session: Session):
    """Create a test client with database session override."""
    
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def sample_transaction(db_session: Session) -> Transaction:
    """Create a sample transaction for testing."""
    transaction = Transaction(
        step=100,
        type=TransactionType.TRANSFER,
        amount=250000.00,
        nameOrig="C1234567890",
        nameDest="C9876543210",
        oldbalanceOrg=500000.00,
        newbalanceOrig=250000.00,
        oldbalanceDest=0.00,
        newbalanceDest=250000.00,
        isFraud=True,
        isFlaggedFraud=True,
    )
    db_session.add(transaction)
    db_session.commit()
    db_session.refresh(transaction)
    return transaction


@pytest.fixture
def sample_alert(db_session: Session, sample_transaction: Transaction) -> Alert:
    """Create a sample alert for testing."""
    alert = Alert(
        transaction_id=sample_transaction.id,
        status=AlertStatus.NEW,
        priority=AlertPriority.CRITICAL,
        ml_score=0.92,
        ml_risk_band=RiskBand.CRITICAL,
        ml_reason_codes=["high_ml_score", "amount_exceeds_threshold"],
        shap_values=[
            {"feature": "amount_zscore", "value": 0.45},
            {"feature": "new_counterparty_7d", "value": 0.38},
        ],
        rules_triggered=[
            {
                "rule_id": "R001",
                "rule_name": "HIGH_VALUE_TRANSFER",
                "reason": "Transfer amount exceeds $200,000"
            }
        ],
    )
    db_session.add(alert)
    db_session.commit()
    db_session.refresh(alert)
    return alert


@pytest.fixture
def multiple_alerts(db_session: Session) -> list:
    """Create multiple alerts with different statuses and priorities."""
    transactions = []
    alerts = []
    
    # Create 10 test transactions and alerts
    for i in range(10):
        tx = Transaction(
            step=100 + i,
            type=TransactionType.TRANSFER,
            amount=50000.00 * (i + 1),
            nameOrig=f"C{1000000000 + i}",
            nameDest=f"C{2000000000 + i}",
            isFraud=i % 2 == 0,
            isFlaggedFraud=i % 3 == 0,
        )
        db_session.add(tx)
        transactions.append(tx)
    
    db_session.commit()
    
    for i, tx in enumerate(transactions):
        alert = Alert(
            transaction_id=tx.id,
            status=list(AlertStatus)[i % len(AlertStatus)],
            priority=list(AlertPriority)[i % len(AlertPriority)],
            ml_score=0.5 + (i * 0.05),
            ml_risk_band=list(RiskBand)[i % len(RiskBand)],
            ml_reason_codes=["test_reason"],
            rules_triggered=[],
        )
        db_session.add(alert)
        alerts.append(alert)
    
    db_session.commit()
    return alerts
