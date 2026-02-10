"""Script to load transactions from CSV into database."""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

import pandas as pd
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal, init_db
from app.models.transaction import Transaction, TransactionType


def load_transactions_from_csv(
    csv_path: str,
    batch_size: int = 1000,
    limit: Optional[int] = None,
) -> dict:
    """
    Load transactions from CSV file into database.
    
    Args:
        csv_path: Path to CSV file
        batch_size: Number of records to insert per batch
        limit: Maximum number of records to load (None for all)
        
    Returns:
        dict: Statistics about loaded data
    """
    print(f"📂 Loading transactions from: {csv_path}")
    
    # Read CSV
    df = pd.read_csv(csv_path)
    
    if limit:
        df = df.head(limit)
    
    print(f"📊 Total records to load: {len(df)}")
    
    # Validate required columns
    required_columns = [
        "step", "type", "amount", "nameOrig", "nameDest",
        "oldbalanceOrg", "newbalanceOrig", "oldbalanceDest", "newbalanceDest",
        "isFraud", "isFlaggedFraud"
    ]
    
    missing_columns = set(required_columns) - set(df.columns)
    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")
    
    # Initialize database
    init_db()
    
    db: Session = SessionLocal()
    
    try:
        loaded = 0
        errors = 0
        
        # Process in batches
        for i in range(0, len(df), batch_size):
            batch = df.iloc[i:i + batch_size]
            
            for _, row in batch.iterrows():
                try:
                    transaction = Transaction(
                        step=int(row["step"]),
                        type=TransactionType(row["type"]),
                        amount=float(row["amount"]),
                        nameOrig=str(row["nameOrig"]),
                        nameDest=str(row["nameDest"]),
                        oldbalanceOrg=float(row["oldbalanceOrg"]) if pd.notna(row["oldbalanceOrg"]) else None,
                        newbalanceOrig=float(row["newbalanceOrig"]) if pd.notna(row["newbalanceOrig"]) else None,
                        oldbalanceDest=float(row["oldbalanceDest"]) if pd.notna(row["oldbalanceDest"]) else None,
                        newbalanceDest=float(row["newbalanceDest"]) if pd.notna(row["newbalanceDest"]) else None,
                        isFraud=bool(row["isFraud"]),
                        isFlaggedFraud=bool(row["isFlaggedFraud"]),
                    )
                    db.add(transaction)
                    loaded += 1
                except Exception as e:
                    print(f"❌ Error loading row: {e}")
                    errors += 1
            
            # Commit batch
            db.commit()
            print(f"✅ Loaded {loaded} transactions ({errors} errors)")
        
        # Get statistics
        stats = {
            "total_loaded": loaded,
            "total_errors": errors,
            "fraud_count": db.query(Transaction).filter(Transaction.isFraud == True).count(),
            "flagged_count": db.query(Transaction).filter(Transaction.isFlaggedFraud == True).count(),
            "transaction_types": {}
        }
        
        for tx_type in TransactionType:
            count = db.query(Transaction).filter(Transaction.type == tx_type).count()
            stats["transaction_types"][tx_type.value] = count
        
        return stats
        
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    from typing import Optional
    
    parser = argparse.ArgumentParser(description="Load transactions from CSV")
    parser.add_argument(
        "--csv",
        type=str,
        default=settings.DATASET_PATH,
        help="Path to CSV file"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Maximum number of records to load (optional)"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=1000,
        help="Batch size for inserts"
    )
    
    args = parser.parse_args()
    
    try:
        stats = load_transactions_from_csv(
            csv_path=args.csv,
            batch_size=args.batch_size,
            limit=args.limit,
        )
        
        print("\n" + "="*60)
        print("📊 LOAD STATISTICS")
        print("="*60)
        print(f"Total Loaded: {stats['total_loaded']}")
        print(f"Total Errors: {stats['total_errors']}")
        print(f"Fraud Count: {stats['fraud_count']}")
        print(f"Flagged Count: {stats['flagged_count']}")
        print("\nTransaction Types:")
        for tx_type, count in stats['transaction_types'].items():
            print(f"  {tx_type}: {count}")
        print("="*60)
        print("✅ Load completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
