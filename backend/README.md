# Backend API - Developer 1 Guide

## Overview
FastAPI backend service providing REST APIs for fraud detection alert management, case handling, and entity profiling. Uses SQLite for data storage and integrates with ML scoring service.

## Tech Stack
- **Framework**: FastAPI 0.109+
- **Database**: SQLite (development), PostgreSQL (production-ready)
- **ORM**: SQLAlchemy 2.0+
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **Testing**: pytest, pytest-asyncio
- **API Docs**: Automatic OpenAPI (Swagger UI)

## Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Configuration and settings
│   ├── database.py             # Database connection and session
│   │
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── transaction.py
│   │   ├── alert.py
│   │   ├── case.py
│   │   └── entity.py
│   │
│   ├── schemas/                # Pydantic models for validation
│   │   ├── __init__.py
│   │   ├── transaction.py
│   │   ├── alert.py
│   │   ├── case.py
│   │   └── entity.py
│   │
│   ├── api/                    # API route handlers
│   │   ├── __init__.py
│   │   ├── alerts.py
│   │   ├── cases.py
│   │   ├── entities.py
│   │   ├── transactions.py
│   │   └── scoring.py
│   │
│   ├── services/               # Business logic layer
│   │   ├── __init__.py
│   │   ├── alert_service.py
│   │   ├── case_service.py
│   │   ├── entity_service.py
│   │   └── scoring_service.py
│   │
│   └── utils/                  # Helper utilities
│       ├── __init__.py
│       ├── pagination.py
│       ├── filtering.py
│       └── audit.py
│
├── alembic/                    # Database migrations
│   ├── versions/
│   └── env.py
│
├── tests/                      # Test suite
│   ├── __init__.py
│   ├── conftest.py            # pytest fixtures
│   ├── test_alerts.py
│   ├── test_cases.py
│   └── test_entities.py
│
├── scripts/                    # Utility scripts
│   ├── seed_data.py           # Generate sample data
│   └── load_transactions.py   # Load CSV into database
│
├── alembic.ini                # Alembic configuration
├── requirements.txt           # Python dependencies
├── .env.example              # Example environment variables
└── README.md                 # This file
```

## Quick Start

### 1. Environment Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Database Setup
```bash
# Create .env file
cp .env.example .env

# Initialize database with Alembic
alembic upgrade head

# Load transaction data from CSV
python scripts/load_transactions.py

# Generate sample alerts and cases
python scripts/seed_data.py
```

### 3. Run Development Server
```bash
# Start FastAPI server with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# API will be available at:
# - API: http://localhost:8000
# - Swagger UI: http://localhost:8000/docs
# - ReDoc: http://localhost:8000/redoc
```

### 4. Run Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_alerts.py -v
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Alerts
- `GET /api/alerts` - List alerts with filtering and pagination
- `GET /api/alerts/{id}` - Get alert details
- `PATCH /api/alerts/{id}` - Update alert status/notes
- `POST /api/alerts/bulk-update` - Bulk update multiple alerts

### Cases
- `GET /api/cases` - List cases
- `GET /api/cases/{id}` - Get case details
- `POST /api/cases` - Create new case
- `PATCH /api/cases/{id}` - Update case
- `POST /api/cases/{id}/alerts` - Link alerts to case
- `POST /api/cases/{id}/disposition` - Close case with disposition

### Entities
- `GET /api/entities/{id}` - Get entity profile with statistics

### Transactions
- `GET /api/transactions` - List transactions
- `GET /api/transactions/{id}` - Get transaction details
- `POST /api/transactions/upload` - Upload CSV for batch processing

### Scoring (Internal)
- `POST /api/score/transaction` - Score a single transaction

## Configuration

### Environment Variables (.env)
```bash
# Database
DATABASE_URL=sqlite:///./fraud_detection.db

# API Settings
API_V1_PREFIX=/api
PROJECT_NAME="Fraud Detection API"
DEBUG=True

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Scoring Service (Phase 2)
ML_MODEL_PATH=../models/fraud_detector_v1.pkl
SCORING_TIMEOUT=30

# Pagination
DEFAULT_PAGE_SIZE=25
MAX_PAGE_SIZE=100
```

## Database Schema

### Core Tables

#### transactions
- `id` (UUID, PK)
- `step` (Integer) - Time step
- `type` (Enum) - CASH_IN, CASH_OUT, DEBIT, PAYMENT, TRANSFER
- `amount` (Decimal)
- `nameOrig` (String) - Sender entity ID
- `nameDest` (String) - Receiver entity ID
- `oldbalanceOrg` (Decimal) - Not used for features
- `newbalanceOrig` (Decimal) - Not used for features
- `oldbalanceDest` (Decimal) - Not used for features
- `newbalanceDest` (Decimal) - Not used for features
- `isFraud` (Boolean) - Ground truth label
- `isFlaggedFraud` (Boolean) - Rule-based flag
- `created_at` (DateTime)

#### alerts
- `id` (UUID, PK)
- `transaction_id` (UUID, FK)
- `status` (Enum) - new, in_review, pending_info, escalated, closed
- `priority` (Enum) - low, medium, high, critical
- `ml_score` (Float) - 0.0 to 1.0
- `ml_risk_band` (Enum) - low, medium, high, critical
- `ml_reason_codes` (JSON) - Array of strings
- `shap_values` (JSON) - Feature contributions
- `rules_triggered` (JSON) - Array of rule objects
- `assigned_to` (String, nullable)
- `notes` (Text, nullable)
- `created_at` (DateTime)
- `updated_at` (DateTime)

#### cases
- `id` (UUID, PK)
- `status` (Enum) - open, investigating, escalated, resolved
- `priority` (Enum) - low, medium, high, critical
- `disposition` (Enum, nullable) - fraud, not_fraud, inconclusive
- `disposition_confidence` (Float, nullable)
- `disposition_notes` (Text, nullable)
- `created_at` (DateTime)
- `updated_at` (DateTime)
- `resolved_at` (DateTime, nullable)

#### case_alerts (Junction Table)
- `case_id` (UUID, FK)
- `alert_id` (UUID, FK)
- `added_at` (DateTime)

#### entities (Materialized View)
- `entity_id` (String, PK)
- `total_transactions` (Integer)
- `total_amount` (Decimal)
- `avg_amount` (Decimal)
- `transaction_types` (JSON)
- `prior_alerts` (Integer)
- `prior_cases` (Integer)
- `first_seen` (DateTime)
- `last_seen` (DateTime)

## Development Workflow

### Phase 1: Foundation (Week 1)
**Focus**: Database schema, basic CRUD operations

#### Task BE-001: Project Scaffolding
```bash
# Initialize project structure
mkdir -p backend/app/{models,schemas,api,services,utils}
mkdir -p backend/tests backend/scripts backend/alembic/versions

# Create requirements.txt
# Set up FastAPI main.py with health check
# Configure CORS and middleware
```

**Deliverables**:
- ✅ FastAPI app with `/health` endpoint
- ✅ Project structure created
- ✅ Requirements.txt with all dependencies

#### Task BE-002: Database Schema & Migrations
```bash
# Initialize Alembic
alembic init alembic

# Create initial migration
alembic revision --autogenerate -m "initial_schema"

# Apply migration
alembic upgrade head
```

**Deliverables**:
- ✅ SQLAlchemy models for transactions, alerts, cases
- ✅ Alembic migration scripts
- ✅ Database initialized

#### Task BE-003: Seed Data Script
```bash
python scripts/seed_data.py --alerts 100 --cases 20
```

**Deliverables**:
- ✅ Script generates realistic sample data
- ✅ Includes mock ML scores and SHAP values
- ✅ Covers all alert statuses and priorities

#### Task BE-004: Alert CRUD Endpoints
**Implement**:
- `GET /api/alerts` with filtering, sorting, pagination
- `GET /api/alerts/{id}`
- `PATCH /api/alerts/{id}`
- `POST /api/alerts/bulk-update`

**Deliverables**:
- ✅ All endpoints functional and tested
- ✅ Swagger documentation auto-generated
- ✅ Filtering by status, priority, type, amount range

### Phase 2: Cases & Entities (Week 2)

#### Task BE-005: Case Management Endpoints
**Implement**:
- `GET /api/cases`, `GET /api/cases/{id}`
- `POST /api/cases` - Create case
- `PATCH /api/cases/{id}` - Update case
- `POST /api/cases/{id}/alerts` - Link alerts
- `POST /api/cases/{id}/disposition` - Close with disposition

**Deliverables**:
- ✅ Case workflow state machine enforced
- ✅ Alert linking/unlinking works
- ✅ Disposition requires required fields

#### Task BE-006: Entity Profile Endpoint
**Implement**:
- `GET /api/entities/{id}`
- Aggregate statistics from transactions
- Calculate prior alerts/cases
- Top counterparties computation

**Deliverables**:
- ✅ Entity profile returns all required statistics
- ✅ Performance optimized (< 500ms for 10k transactions)
- ✅ Handles both nameOrig and nameDest roles

#### Task BE-007: Transaction Endpoints
**Implement**:
- `POST /api/transactions/upload` - CSV upload
- `GET /api/transactions/{id}`
- CSV parsing and validation

**Deliverables**:
- ✅ CSV upload validates column schema
- ✅ Invalid rows reported with reasons
- ✅ Bulk insert performance optimized

### Phase 3: Integration & Scoring (Week 3)

#### Task BE-008: Scoring Integration Endpoint
**Implement**:
- `POST /api/score/transaction`
- Initially returns mock response
- Integration point for ML service (Developer 2)

**Deliverables**:
- ✅ Endpoint structure matches scoring contract
- ✅ Mock response for testing
- ✅ Ready for Developer 2 integration

#### Task BE-009: Alert Generation Logic
**Implement**:
- After scoring, automatically create alert if triggered
- Link transaction to alert
- Set priority based on score + rules

**Deliverables**:
- ✅ Alerts generated from scored transactions
- ✅ Priority logic: critical if both ML + rules triggered
- ✅ Proper transaction linking

#### Task BE-010: Unit Tests
**Coverage targets**:
- Alert endpoints: >90%
- Case endpoints: >90%
- Entity profile: >80%

**Deliverables**:
- ✅ pytest suite with fixtures
- ✅ Test database isolation
- ✅ All edge cases covered

## Testing Strategy

### Unit Tests
```python
# tests/test_alerts.py
def test_list_alerts_with_filters(client, sample_alerts):
    response = client.get("/api/alerts?status=new&priority=high")
    assert response.status_code == 200
    data = response.json()
    assert all(a["status"] == "new" for a in data["items"])
```

### Integration Tests
```python
# tests/test_integration.py
def test_end_to_end_alert_workflow(client):
    # Create transaction
    # Score transaction
    # Verify alert created
    # Update alert status
    # Create case
    # Link alert to case
    # Close case with disposition
```

### Test Database
```python
# tests/conftest.py
@pytest.fixture
def db_session():
    # Create test database
    # Yield session
    # Teardown database
```

## API Response Formats

### Success Response
```json
{
  "status": "success",
  "data": { ... },
  "metadata": {
    "request_id": "uuid",
    "timestamp": "2026-02-10T15:30:00Z",
    "version": "v1"
  }
}
```

### Paginated Response
```json
{
  "status": "success",
  "data": {
    "items": [...],
    "total": 150,
    "page": 1,
    "page_size": 25,
    "total_pages": 6
  },
  "metadata": { ... }
}
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid alert status",
    "details": {
      "field": "status",
      "allowed_values": ["new", "in_review", "pending_info", "escalated", "closed"]
    }
  },
  "metadata": { ... }
}
```

## Performance Requirements

### Latency Targets
- Alert list (paginated): < 200ms (P95)
- Alert detail: < 100ms (P95)
- Entity profile: < 500ms (P95)
- Bulk operations: < 2s for 100 items

### Optimization Techniques
- Database indexes on filtered/sorted columns
- Eager loading for relationships
- Query result caching (Redis, Phase 2)
- Pagination for large datasets

## Security Considerations

### Input Validation
- Pydantic models validate all inputs
- SQL injection prevention via ORM
- File upload size limits (10 MB)
- Rate limiting (Phase 2)

### Authentication (Phase 2)
- JWT token-based auth
- Role-based access control (RBAC)
- Audit logging for all mutations

## Troubleshooting

### Common Issues

**Issue**: Database locked error
```bash
# Solution: Close all database connections
rm fraud_detection.db
alembic upgrade head
```

**Issue**: Migration conflict
```bash
# Solution: Rollback and reapply
alembic downgrade -1
alembic upgrade head
```

**Issue**: Import errors
```bash
# Solution: Ensure proper Python path
export PYTHONPATH="${PYTHONPATH}:${PWD}"
```

## Next Steps

### Week 1 Checklist
- [ ] Set up project structure
- [ ] Create database models
- [ ] Initialize Alembic migrations
- [ ] Implement health check endpoint
- [ ] Load transaction data from CSV
- [ ] Create seed data script
- [ ] Implement alert CRUD endpoints
- [ ] Write unit tests for alerts

### Integration with Other Developers
- **Developer 2 (ML)**: Provide scoring endpoint contract, ready for integration in Week 3
- **Developer 3 (Frontend)**: Provide seed data and API documentation, ready for consumption in Week 2

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/en/20/)
- [Alembic Tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html)
- [Pydantic V2 Documentation](https://docs.pydantic.dev/latest/)

## Support

For questions or issues:
1. Check this README
2. Review API docs at `/docs`
3. Check test examples in `/tests`
4. Consult with team during daily standup
