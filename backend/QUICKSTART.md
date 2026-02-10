# Backend Developer 1 - Quick Start Guide

## Initial Setup (15 minutes)

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Create and activate virtual environment
```bash
# Create venv
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Create environment file
```bash
# Copy example
cp .env.example .env

# Edit .env if needed (default values work for development)
```

### 5. Load transaction data
```bash
# Load all transactions from dataset
python scripts/load_transactions.py

# Or load limited amount for faster testing
python scripts/load_transactions.py --limit 10000
```

### 6. Generate sample alerts
```bash
# Generate 100 sample alerts
python scripts/seed_data.py --alerts 100
```

### 7. Start the server
```bash
# Run with auto-reload
uvicorn app.main:app --reload

# Server will start at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 8. Test the API
```bash
# In a new terminal, test health check
curl http://localhost:8000/health

# Or open in browser: http://localhost:8000/docs
```

## What You Have Now

✅ FastAPI server running on port 8000  
✅ SQLite database with transactions loaded  
✅ Sample alerts generated  
✅ Swagger UI documentation at `/docs`  
✅ Health check endpoint working  

## Next Steps - Week 1 Tasks

### Task BE-004: Implement Alert CRUD Endpoints

Create `backend/app/api/alerts.py`:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter()

@router.get("/")
async def list_alerts(db: Session = Depends(get_db)):
    # TODO: Implement alert listing with filters
    pass

@router.get("/{alert_id}")
async def get_alert(alert_id: str, db: Session = Depends(get_db)):
    # TODO: Implement get alert detail
    pass

@router.patch("/{alert_id}")
async def update_alert(alert_id: str, db: Session = Depends(get_db)):
    # TODO: Implement alert update
    pass
```

Then register in `app/main.py`:
```python
from app.api import alerts
app.include_router(
    alerts.router,
    prefix=f"{settings.API_V1_PREFIX}/alerts",
    tags=["Alerts"]
)
```

### Resources
- Full documentation: `backend/README.md`
- Test examples: `backend/tests/test_alerts.py`
- Model definitions: `backend/app/models/`
- Schema examples: `backend/app/schemas/alert.py`

## Common Commands

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=app

# Format code
black app/ tests/

# Check code style
flake8 app/ tests/

# Reload data
rm fraud_detection.db
python scripts/load_transactions.py --limit 5000
python scripts/seed_data.py --alerts 50

# View database
sqlite3 fraud_detection.db
> .tables
> SELECT COUNT(*) FROM transactions;
> SELECT COUNT(*) FROM alerts;
> .quit
```

## Troubleshooting

**Problem**: `ModuleNotFoundError`  
**Solution**: Make sure venv is activated and dependencies installed

**Problem**: Database locked  
**Solution**: Close all connections, delete `fraud_detection.db`, reload data

**Problem**: Port 8000 already in use  
**Solution**: `uvicorn app.main:app --reload --port 8001`

## Week 1 Deliverables Checklist

- [ ] Project structure created ✅ (DONE)
- [ ] Database models defined ✅ (DONE)
- [ ] Configuration setup ✅ (DONE)
- [ ] Transaction data loaded ✅ (DONE)
- [ ] Sample alerts generated ✅ (DONE)
- [ ] Health check working ✅ (DONE)
- [ ] Alert CRUD endpoints (IN PROGRESS - your task!)
- [ ] Entity profile endpoint
- [ ] Unit tests for alerts

## Support

Check the comprehensive documentation in `backend/README.md` for detailed information on:
- API endpoint specifications
- Database schema details
- Testing strategy
- Integration with other developers
