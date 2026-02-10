"""Script to generate sample alerts and cases for development and testing."""

import random
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import List

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from faker import Faker
from sqlalchemy.orm import Session

from app.database import SessionLocal, init_db
from app.models.alert import Alert, AlertPriority, AlertStatus, RiskBand
from app.models.transaction import Transaction

fake = Faker()


# Mock SHAP values for different scenarios
SHAP_TEMPLATES = {
    "high_amount": [
        {"feature": "amount_zscore", "value": 0.45},
        {"feature": "amount_percentile", "value": 0.32},
        {"feature": "hour_of_day", "value": 0.12},
        {"feature": "tx_count_24h", "value": -0.08},
        {"feature": "unique_dest_7d", "value": 0.15},
    ],
    "new_counterparty": [
        {"feature": "new_counterparty_7d", "value": 0.38},
        {"feature": "pair_count_24h", "value": 0.28},
        {"feature": "amount_zscore", "value": 0.18},
        {"feature": "dest_velocity_1h", "value": -0.05},
        {"feature": "transfer_ratio_24h", "value": 0.12},
    ],
    "velocity_spike": [
        {"feature": "orig_velocity_1h", "value": 0.42},
        {"feature": "tx_count_24h", "value": 0.35},
        {"feature": "amount_zscore", "value": 0.14},
        {"feature": "hour_of_day", "value": -0.06},
        {"feature": "type_transfer", "value": 0.08},
    ],
}

# Mock reason codes
REASON_CODES = {
    "high_score": ["high_ml_score", "outlier_detection", "pattern_match"],
    "high_amount": ["high_transaction_amount", "amount_exceeds_threshold"],
    "new_counterparty": ["new_recipient", "first_time_transaction"],
    "velocity": ["velocity_spike", "unusual_frequency", "burst_activity"],
    "temporal": ["unusual_time", "off_hours_transaction"],
}

# Mock rules
RULES_TEMPLATES = [
    {
        "rule_id": "R001",
        "rule_name": "HIGH_VALUE_TRANSFER",
        "reason": "Transfer amount exceeds $200,000 threshold"
    },
    {
        "rule_id": "R002",
        "rule_name": "NEW_COUNTERPARTY",
        "reason": "First transaction between these entities in 7 days"
    },
    {
        "rule_id": "R003",
        "rule_name": "VELOCITY_SPIKE",
        "reason": "Transaction count in 24h exceeds 10"
    },
    {
        "rule_id": "R004",
        "rule_name": "TRANSFER_CASHOUT_SEQUENCE",
        "reason": "TRANSFER followed by CASH_OUT within 1 hour"
    },
]


def generate_mock_alert(transaction: Transaction, db: Session) -> Alert:
    """Generate a mock alert for a transaction."""
    
    # Determine if fraud (bias towards actual fraud label)
    is_likely_fraud = transaction.isFraud or random.random() < 0.3
    
    # Generate ML score
    if is_likely_fraud:
        ml_score = random.uniform(0.65, 0.98)
    else:
        ml_score = random.uniform(0.10, 0.65)
    
    # Determine risk band
    if ml_score >= 0.9:
        risk_band = RiskBand.CRITICAL
        priority = AlertPriority.CRITICAL
    elif ml_score >= 0.75:
        risk_band = RiskBand.HIGH
        priority = AlertPriority.HIGH
    elif ml_score >= 0.60:
        risk_band = RiskBand.MEDIUM
        priority = AlertPriority.MEDIUM
    else:
        risk_band = RiskBand.LOW
        priority = AlertPriority.LOW
    
    # Generate reason codes
    reason_codes = []
    if ml_score > 0.7:
        reason_codes.extend(random.sample(REASON_CODES["high_score"], 1))
    if transaction.is_high_value:
        reason_codes.extend(random.sample(REASON_CODES["high_amount"], 1))
    if random.random() < 0.3:
        reason_codes.extend(random.sample(REASON_CODES["new_counterparty"], 1))
    if random.random() < 0.2:
        reason_codes.extend(random.sample(REASON_CODES["velocity"], 1))
    
    # Select SHAP template
    if transaction.is_high_value:
        shap_template = "high_amount"
    elif random.random() < 0.4:
        shap_template = "new_counterparty"
    else:
        shap_template = "velocity_spike"
    
    shap_values = SHAP_TEMPLATES[shap_template].copy()
    
    # Generate rules triggered
    rules_triggered = []
    if transaction.is_high_value and random.random() < 0.7:
        rules_triggered.append(RULES_TEMPLATES[0])
    if random.random() < 0.3:
        rules_triggered.append(RULES_TEMPLATES[1])
    if random.random() < 0.2:
        rules_triggered.append(RULES_TEMPLATES[2])
    
    # Adjust priority if rules triggered
    if rules_triggered and ml_score > 0.7:
        priority = AlertPriority.CRITICAL
    
    # Determine status
    status_weights = {
        AlertStatus.NEW: 0.4,
        AlertStatus.IN_REVIEW: 0.3,
        AlertStatus.PENDING_INFO: 0.1,
        AlertStatus.ESCALATED: 0.1,
        AlertStatus.CLOSED: 0.1,
    }
    status = random.choices(
        list(status_weights.keys()),
        weights=list(status_weights.values())
    )[0]
    
    # Assigned analyst
    analysts = ["Alice Johnson", "Bob Smith", "Carol Davis", "David Lee", None]
    assigned_to = random.choice(analysts) if status != AlertStatus.NEW else None
    
    # Notes
    notes = None
    if status in [AlertStatus.IN_REVIEW, AlertStatus.PENDING_INFO, AlertStatus.ESCALATED]:
        notes = fake.sentence()
    
    # Create alert
    alert = Alert(
        transaction_id=transaction.id,
        status=status,
        priority=priority,
        ml_score=ml_score,
        ml_risk_band=risk_band,
        ml_reason_codes=reason_codes,
        shap_values=shap_values,
        rules_triggered=rules_triggered,
        assigned_to=assigned_to,
        notes=notes,
        created_at=transaction.created_at + timedelta(seconds=random.randint(1, 60)),
    )
    
    return alert


def seed_alerts(count: int = 100) -> dict:
    """Generate sample alerts."""
    
    print(f"🌱 Seeding {count} alerts...")
    
    init_db()
    db: Session = SessionLocal()
    
    try:
        # Get fraud and high-value transactions
        fraud_txs = db.query(Transaction).filter(
            Transaction.isFraud == True
        ).limit(count // 2).all()
        
        high_value_txs = db.query(Transaction).filter(
            Transaction.amount > 100000,
            Transaction.isFraud == False
        ).limit(count // 3).all()
        
        random_txs = db.query(Transaction).filter(
            Transaction.isFraud == False,
            Transaction.amount <= 100000
        ).limit(count // 3).all()
        
        transactions = fraud_txs + high_value_txs + random_txs
        transactions = transactions[:count]
        
        if len(transactions) < count:
            print(f"⚠️  Only {len(transactions)} transactions available (requested {count})")
        
        alerts_created = 0
        
        for tx in transactions:
            alert = generate_mock_alert(tx, db)
            db.add(alert)
            alerts_created += 1
        
        db.commit()
        
        # Get statistics
        stats = {
            "total_alerts": alerts_created,
            "by_status": {},
            "by_priority": {},
            "by_risk_band": {},
        }
        
        for status in AlertStatus:
            count = db.query(Alert).filter(Alert.status == status).count()
            stats["by_status"][status.value] = count
        
        for priority in AlertPriority:
            count = db.query(Alert).filter(Alert.priority == priority).count()
            stats["by_priority"][priority.value] = count
        
        for risk_band in RiskBand:
            count = db.query(Alert).filter(Alert.ml_risk_band == risk_band).count()
            stats["by_risk_band"][risk_band.value] = count
        
        return stats
        
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate sample alerts")
    parser.add_argument(
        "--alerts",
        type=int,
        default=100,
        help="Number of alerts to generate"
    )
    
    args = parser.parse_args()
    
    try:
        stats = seed_alerts(count=args.alerts)
        
        print("\n" + "="*60)
        print("📊 SEED STATISTICS")
        print("="*60)
        print(f"Total Alerts: {stats['total_alerts']}")
        print("\nBy Status:")
        for status, count in stats['by_status'].items():
            print(f"  {status}: {count}")
        print("\nBy Priority:")
        for priority, count in stats['by_priority'].items():
            print(f"  {priority}: {count}")
        print("\nBy Risk Band:")
        for risk_band, count in stats['by_risk_band'].items():
            print(f"  {risk_band}: {count}")
        print("="*60)
        print("✅ Seeding completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
