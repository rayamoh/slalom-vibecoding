# Developer 1: Backend API Implementation Guide

## 🎯 Overview
You are the **Backend API & Database Lead** responsible for building the FastAPI service that manages transactions, alerts, cases, and entity profiles. Your work provides the foundation for both the ML service (Developer 2) and Frontend UI (Developer 3).

## 📦 What's Already Done

✅ **Project Structure Created**
- Complete FastAPI app scaffolding in `/backend`
- Configuration management with Pydantic settings
- Database models for Transaction and Alert
- Pydantic schemas for API validation
- Test framework with pytest fixtures
- Data loading and seeding scripts

✅ **Documentation Complete**
- `backend/README.md` - Comprehensive guide
- `backend/QUICKSTART.md` - 15-minute setup
- API contract defined in `memory-bank/parallel-dev-plan.md`

## 🚀 Quick Start (15 Minutes)

```bash
# 1. Setup environment
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# 2. Configure (optional - defaults work)
cp .env.example .env

# 3. Load data
python scripts/load_transactions.py --limit 10000
python scripts/seed_data.py --alerts 100

# 4. Start server
uvicorn app.main:app --reload

# 5. Test (new terminal)
curl http://localhost:8000/health
# Or visit http://localhost:8000/docs
```

## 📋 Week 1 Tasks (Detailed)

### Task BE-001: ✅ Project Scaffolding (COMPLETE)
**Status**: Done - structure created, health check working

### Task BE-002: ✅ Database Models (COMPLETE)
**Status**: Done - Transaction and Alert models created

### Task BE-003: ✅ Data Loading (COMPLETE)
**Status**: Done - scripts ready for use

---

### Task BE-004: 🚧 Alert CRUD Endpoints (YOUR TASK)
**Priority**: HIGH | **Estimated Time**: 4-6 hours

#### What to Build
Create `backend/app/api/alerts.py` with these endpoints:

1. **GET /api/alerts** - List alerts with filters
2. **GET /api/alerts/{id}** - Get alert details
3. **PATCH /api/alerts/{id}** - Update alert
4. **POST /api/alerts/bulk-update** - Bulk update

#### Step-by-Step Implementation

**Step 1**: Create alert service layer
```python
# File: backend/app/services/alert_service.py

from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.alert import Alert, AlertStatus, AlertPriority
from app.schemas.alert import AlertFilter, AlertUpdate


class AlertService:
    """Business logic for alert operations."""
    
    @staticmethod
    def list_alerts(
        db: Session,
        filters: Optional[AlertFilter] = None,
        page: int = 1,
        page_size: int = 25,
        sort_by: str = "created_at",
        sort_desc: bool = True,
    ) -> tuple[List[Alert], int]:
        """
        List alerts with filtering, pagination, and sorting.
        
        Returns:
            tuple: (alerts, total_count)
        """
        query = db.query(Alert)
        
        # Apply filters
        if filters:
            if filters.status:
                query = query.filter(Alert.status.in_(filters.status))
            if filters.priority:
                query = query.filter(Alert.priority.in_(filters.priority))
            if filters.min_score is not None:
                query = query.filter(Alert.ml_score >= filters.min_score)
            if filters.max_score is not None:
                query = query.filter(Alert.ml_score <= filters.max_score)
            # Add more filters as needed
        
        # Get total count before pagination
        total = query.count()
        
        # Apply sorting
        sort_column = getattr(Alert, sort_by, Alert.created_at)
        if sort_desc:
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Apply pagination
        offset = (page - 1) * page_size
        alerts = query.offset(offset).limit(page_size).all()
        
        return alerts, total
    
    @staticmethod
    def get_alert(db: Session, alert_id: UUID) -> Optional[Alert]:
        """Get alert by ID with related transaction."""
        return db.query(Alert).filter(Alert.id == str(alert_id)).first()
    
    @staticmethod
    def update_alert(
        db: Session,
        alert_id: UUID,
        update: AlertUpdate
    ) -> Optional[Alert]:
        """Update alert fields."""
        alert = AlertService.get_alert(db, alert_id)
        if not alert:
            return None
        
        # Update fields
        if update.status:
            alert.status = update.status
        if update.priority:
            alert.priority = update.priority
        if update.assigned_to is not None:
            alert.assigned_to = update.assigned_to
        if update.notes is not None:
            alert.notes = update.notes
        
        db.commit()
        db.refresh(alert)
        return alert
    
    @staticmethod
    def bulk_update_alerts(
        db: Session,
        alert_ids: List[UUID],
        update: AlertUpdate
    ) -> int:
        """Bulk update multiple alerts."""
        query = db.query(Alert).filter(
            Alert.id.in_([str(id) for id in alert_ids])
        )
        
        update_data = {}
        if update.status:
            update_data["status"] = update.status
        if update.priority:
            update_data["priority"] = update.priority
        if update.assigned_to is not None:
            update_data["assigned_to"] = update.assigned_to
        
        count = query.update(update_data, synchronize_session=False)
        db.commit()
        return count
```

**Step 2**: Create alert router
```python
# File: backend/app/api/alerts.py

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.schemas.alert import (
    AlertDetail,
    AlertFilter,
    AlertList,
    AlertListResponse,
    AlertResponse,
    AlertUpdate,
    BulkAlertUpdate,
    PaginatedAlerts,
)
from app.services.alert_service import AlertService

router = APIRouter()


@router.get("/", response_model=AlertListResponse)
async def list_alerts(
    # Filters
    status: Optional[List[str]] = Query(None),
    priority: Optional[List[str]] = Query(None),
    assigned_to: Optional[str] = None,
    min_score: Optional[float] = Query(None, ge=0.0, le=1.0),
    max_score: Optional[float] = Query(None, ge=0.0, le=1.0),
    # Pagination
    page: int = Query(1, ge=1),
    page_size: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE),
    # Sorting
    sort_by: str = "created_at",
    sort_desc: bool = True,
    # Database
    db: Session = Depends(get_db),
):
    """
    List alerts with filtering, pagination, and sorting.
    
    **Filters:**
    - status: Filter by alert status (new, in_review, etc.)
    - priority: Filter by priority (low, medium, high, critical)
    - assigned_to: Filter by assigned analyst
    - min_score/max_score: Filter by ML score range
    
    **Pagination:**
    - page: Page number (starts at 1)
    - page_size: Items per page (default 25, max 100)
    
    **Sorting:**
    - sort_by: Column to sort by (default: created_at)
    - sort_desc: Sort descending (default: true)
    """
    # Build filters
    filters = AlertFilter(
        status=status,
        priority=priority,
        assigned_to=assigned_to,
        min_score=min_score,
        max_score=max_score,
    )
    
    # Get alerts
    alerts, total = AlertService.list_alerts(
        db=db,
        filters=filters,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_desc=sort_desc,
    )
    
    # Calculate pagination
    total_pages = (total + page_size - 1) // page_size
    
    # Build response
    return AlertListResponse(
        status="success",
        data=PaginatedAlerts(
            items=[AlertList.from_orm(alert) for alert in alerts],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
        metadata={
            "request_id": None,  # TODO: Add request ID middleware
            "timestamp": datetime.utcnow().isoformat(),
            "version": "v1",
        },
    )


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Get detailed information about a specific alert.
    
    Includes:
    - Transaction details
    - ML score and risk band
    - SHAP feature explanations
    - Triggered rules
    - Status and notes
    """
    alert = AlertService.get_alert(db, alert_id)
    
    if not alert:
        raise HTTPException(
            status_code=404,
            detail=f"Alert {alert_id} not found"
        )
    
    return AlertResponse(
        status="success",
        data=AlertDetail.from_orm(alert),
        metadata={
            "request_id": None,
            "timestamp": datetime.utcnow().isoformat(),
            "version": "v1",
        },
    )


@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: UUID,
    update: AlertUpdate,
    db: Session = Depends(get_db),
):
    """
    Update an alert's status, priority, assignment, or notes.
    
    **Allowed updates:**
    - status: Change workflow status
    - priority: Adjust priority level
    - assigned_to: Assign to analyst
    - notes: Add investigation notes
    """
    alert = AlertService.update_alert(db, alert_id, update)
    
    if not alert:
        raise HTTPException(
            status_code=404,
            detail=f"Alert {alert_id} not found"
        )
    
    return AlertResponse(
        status="success",
        data=AlertDetail.from_orm(alert),
        metadata={
            "request_id": None,
            "timestamp": datetime.utcnow().isoformat(),
            "version": "v1",
        },
    )


@router.post("/bulk-update")
async def bulk_update_alerts(
    bulk_update: BulkAlertUpdate,
    db: Session = Depends(get_db),
):
    """
    Update multiple alerts at once.
    
    Useful for:
    - Bulk status changes
    - Bulk assignment
    - Bulk priority updates
    """
    update = AlertUpdate(
        status=bulk_update.status,
        priority=bulk_update.priority,
        assigned_to=bulk_update.assigned_to,
    )
    
    count = AlertService.bulk_update_alerts(
        db, bulk_update.alert_ids, update
    )
    
    return {
        "status": "success",
        "data": {
            "updated_count": count,
            "requested_count": len(bulk_update.alert_ids),
        },
        "metadata": {
            "request_id": None,
            "timestamp": datetime.utcnow().isoformat(),
            "version": "v1",
        },
    }
```

**Step 3**: Register router in main.py
```python
# In backend/app/main.py

# Add after existing imports
from app.api import alerts

# Add after app creation (around line 45)
app.include_router(
    alerts.router,
    prefix=f"{settings.API_V1_PREFIX}/alerts",
    tags=["Alerts"],
)
```

**Step 4**: Test the endpoints
```bash
# Start server
uvicorn app.main:app --reload

# In another terminal, test:

# List all alerts
curl http://localhost:8000/api/alerts

# Filter by status
curl "http://localhost:8000/api/alerts?status=new&status=in_review"

# Get specific alert (use ID from list response)
curl http://localhost:8000/api/alerts/{alert_id}

# Update alert
curl -X PATCH http://localhost:8000/api/alerts/{alert_id} \
  -H "Content-Type: application/json" \
  -d '{"status": "in_review", "notes": "Investigating"}'
```

**Acceptance Criteria**:
- ✅ All 4 endpoints functional
- ✅ Filtering works correctly
- ✅ Pagination returns correct totals
- ✅ Swagger docs auto-generated
- ✅ Returns proper error messages (404, validation)

---

### Task BE-005: Entity Profile Endpoint
**Priority**: MEDIUM | **Estimated Time**: 3-4 hours

Create `GET /api/entities/{entity_id}` that returns:
- Total transactions count
- Total and average amounts
- Transaction type distribution
- Prior alerts/cases count
- Top counterparties

**Implementation hint**:
```python
# backend/app/services/entity_service.py

from sqlalchemy import func
from app.models.transaction import Transaction

def get_entity_profile(db: Session, entity_id: str):
    # Aggregate as nameOrig
    orig_stats = db.query(
        func.count(Transaction.id).label('count'),
        func.sum(Transaction.amount).label('total'),
        func.avg(Transaction.amount).label('avg'),
    ).filter(Transaction.nameOrig == entity_id).first()
    
    # Aggregate as nameDest
    dest_stats = db.query(
        func.count(Transaction.id).label('count'),
        func.sum(Transaction.amount).label('total'),
        func.avg(Transaction.amount).label('avg'),
    ).filter(Transaction.nameDest == entity_id).first()
    
    # Combine results...
```

---

### Task BE-006: Transaction Upload Endpoint
**Priority**: LOW (Phase 1) | **Estimated Time**: 2-3 hours

Create `POST /api/transactions/upload` for CSV file upload.

**Note**: This can be deferred - loading script works for MVP.

---

## 📊 Integration Points

### With Developer 2 (ML Service)
**Week 3**: You'll integrate their scoring module

```python
# They will provide:
from models.scoring_service import score_transaction

# You will call it in:
# backend/app/api/scoring.py

@router.post("/transaction")
async def score_transaction_endpoint(transaction_data):
    result = score_transaction(transaction_data)
    # Create alert if triggered
    if result.ml_score > 0.7 or result.rules_triggered:
        create_alert(...)
    return result
```

### With Developer 3 (Frontend)
**Week 2**: They'll start consuming your API

**What they need**:
- ✅ Seed data with sample alerts (done)
- ✅ Alert list endpoint (your task)
- ✅ Alert detail endpoint (your task)
- ✅ Alert update endpoint (your task)

---

## 🧪 Testing Guidelines

### Manual Testing
```bash
# Use Swagger UI
http://localhost:8000/docs

# Or curl
curl -X POST http://localhost:8000/api/alerts/bulk-update \
  -H "Content-Type: application/json" \
  -d '{
    "alert_ids": ["uuid1", "uuid2"],
    "status": "in_review"
  }'
```

### Unit Testing
```python
# backend/tests/test_alerts.py

def test_list_alerts_with_filters(client, multiple_alerts):
    response = client.get("/api/alerts?status=new")
    assert response.status_code == 200
    data = response.json()
    assert all(a["status"] == "new" for a in data["data"]["items"])
```

Run tests:
```bash
pytest tests/test_alerts.py -v
pytest --cov=app  # With coverage
```

---

## 🎯 Week 1 Deliverables

By end of Week 1, you should have:

- [x] ✅ Project setup complete
- [x] ✅ Data loaded into database
- [x] ✅ Sample alerts generated
- [ ] 🚧 Alert CRUD endpoints working
- [ ] ⏳ Entity profile endpoint
- [ ] ⏳ Basic unit tests passing

**Demo-ready**: Developer 3 can query alerts and see data in UI

---

## 📚 Resources

### Documentation
- `backend/README.md` - Full reference
- `backend/QUICKSTART.md` - Setup guide
- `memory-bank/parallel-dev-plan.md` - API contract

### Code References
- `app/models/alert.py` - Alert ORM model
- `app/schemas/alert.py` - Pydantic schemas
- `tests/conftest.py` - Test fixtures
- `scripts/seed_data.py` - Sample data generation

### External Docs
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [SQLAlchemy 2.0 Docs](https://docs.sqlalchemy.org/en/20/)
- [Pydantic Docs](https://docs.pydantic.dev/)

---

## 🆘 Troubleshooting

**Problem**: Import errors  
**Solution**: Make sure venv is activated, reinstall requirements

**Problem**: Database locked  
**Solution**: `rm fraud_detection.db` and reload data

**Problem**: Pydantic validation errors  
**Solution**: Check schema definitions match model fields

**Problem**: Foreign key errors  
**Solution**: Ensure transaction exists before creating alert

---

## 🎉 Success Metrics

You'll know you're done when:
1. ✅ All alert endpoints return 200 OK
2. ✅ Filtering and pagination work correctly
3. ✅ Swagger docs show all endpoints
4. ✅ Developer 3 can query your API from their UI
5. ✅ Basic tests pass

---

## 📞 Support

- Check `backend/README.md` for detailed documentation
- Review test examples in `tests/`
- Consult API contract in `parallel-dev-plan.md`
- Ask questions during daily standup

**You've got this! The foundation is solid, now let's build the API endpoints.** 🚀
