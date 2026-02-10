# Backend Architecture - Developer 1

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Developer 3)                       │
│                    React UI - Alert Management                       │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ HTTP REST API
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                      FASTAPI APPLICATION                             │
│                       (Developer 1 - YOU)                            │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    API LAYER (app/api/)                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │  │
│  │  │ Alerts   │  │  Cases   │  │Entities  │  │ Scoring  │     │  │
│  │  │  Router  │  │  Router  │  │  Router  │  │  Router  │     │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │  │
│  └───────┼─────────────┼─────────────┼─────────────┼───────────┘  │
│          │             │             │             │               │
│  ┌───────▼─────────────▼─────────────▼─────────────▼───────────┐  │
│  │            SERVICE LAYER (app/services/)                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │  │
│  │  │AlertService  │  │ CaseService  │  │EntityService │       │  │
│  │  │              │  │              │  │              │       │  │
│  │  │ - list()     │  │ - create()   │  │ - profile()  │       │  │
│  │  │ - get()      │  │ - link()     │  │ - stats()    │       │  │
│  │  │ - update()   │  │ - close()    │  │ - history()  │       │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │  │
│  └─────────┼──────────────────┼──────────────────┼──────────────┘  │
│            │                  │                  │                  │
│  ┌─────────▼──────────────────▼──────────────────▼──────────────┐  │
│  │              ORM MODELS (app/models/)                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐              │  │
│  │  │Transaction │  │   Alert    │  │    Case    │              │  │
│  │  │            │  │            │  │            │              │  │
│  │  │ SQLAlchemy │  │ SQLAlchemy │  │ SQLAlchemy │              │  │
│  │  │   Model    │  │   Model    │  │   Model    │              │  │
│  │  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘              │  │
│  └─────────┼────────────────┼────────────────┼────────────────────┘  │
│            │                │                │                       │
└────────────┼────────────────┼────────────────┼───────────────────────┘
             │                │                │
             │    ┌───────────▼────────────────▼──────────┐
             └────►        SQLite Database                │
                  │                                        │
                  │  Tables:                               │
                  │  - transactions                        │
                  │  - alerts                              │
                  │  - cases                               │
                  │  - case_alerts (junction)              │
                  └────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    ML/RULES SERVICE (Developer 2)                    │
│                         Integration Point                            │
└─────────────────────────────────────────────────────────────────────┘
```

## Request Flow

### 1. List Alerts Flow
```
Frontend                API Router              Service              Database
   │                       │                       │                    │
   │  GET /api/alerts      │                       │                    │
   ├──────────────────────►│                       │                    │
   │  ?status=new&page=1   │                       │                    │
   │                       │ list_alerts()         │                    │
   │                       ├──────────────────────►│                    │
   │                       │ filters, pagination   │                    │
   │                       │                       │  Query + Filter    │
   │                       │                       ├───────────────────►│
   │                       │                       │                    │
   │                       │                       │  Results + Count   │
   │                       │                       │◄───────────────────┤
   │                       │                       │                    │
   │                       │  PaginatedAlerts      │                    │
   │                       │◄──────────────────────┤                    │
   │                       │                       │                    │
   │   JSON Response       │                       │                    │
   │◄──────────────────────┤                       │                    │
   │  {items: [], total}   │                       │                    │
```

### 2. Update Alert Flow
```
Frontend                API Router              Service              Database
   │                       │                       │                    │
   │  PATCH /api/alerts/id │                       │                    │
   ├──────────────────────►│                       │                    │
   │  {status: "review"}   │                       │                    │
   │                       │ update_alert()        │                    │
   │                       ├──────────────────────►│                    │
   │                       │                       │  UPDATE query      │
   │                       │                       ├───────────────────►│
   │                       │                       │                    │
   │                       │                       │  Updated record    │
   │                       │                       │◄───────────────────┤
   │                       │                       │                    │
   │                       │  Alert detail         │                    │
   │                       │◄──────────────────────┤                    │
   │                       │                       │                    │
   │   JSON Response       │                       │                    │
   │◄──────────────────────┤                       │                    │
   │  {data: {...}}        │                       │                    │
```

### 3. Score Transaction Flow (Week 3 - Integration)
```
API Router         Scoring Service       ML Module        Alert Service    Database
   │                     │                    │                  │             │
   │ score_transaction() │                    │                  │             │
   ├────────────────────►│                    │                  │             │
   │                     │ score_transaction()│                  │             │
   │                     ├───────────────────►│                  │             │
   │                     │                    │ ML inference     │             │
   │                     │                    │ + Rules check    │             │
   │                     │                    │                  │             │
   │                     │  Score + Reasons   │                  │             │
   │                     │◄───────────────────┤                  │             │
   │                     │                    │                  │             │
   │                     │  if triggered:     │                  │             │
   │                     │  create_alert()    │                  │             │
   │                     ├──────────────────────────────────────►│             │
   │                     │                                        │  INSERT     │
   │                     │                                        ├────────────►│
   │                     │                                        │             │
   │                     │                      Alert created     │             │
   │                     │◄────────────────────────────────────────             │
   │  Score result       │                                                      │
   │◄────────────────────┤                                                      │
```

## File Organization

```
backend/
│
├── app/
│   ├── main.py              # ⚡ App initialization, CORS, startup
│   ├── config.py            # ⚙️  Settings (DB URL, pagination, etc.)
│   ├── database.py          # 🗄️  DB engine, session factory
│   │
│   ├── models/              # 📊 SQLAlchemy ORM Models
│   │   ├── transaction.py   #    - Transaction table
│   │   ├── alert.py         #    - Alert table with enums
│   │   └── case.py          #    - Case table (Phase 1)
│   │
│   ├── schemas/             # ✅ Pydantic Request/Response Models
│   │   ├── alert.py         #    - Alert validation schemas
│   │   ├── case.py          #    - Case schemas
│   │   └── entity.py        #    - Entity profile schemas
│   │
│   ├── api/                 # 🌐 FastAPI Routers (YOUR MAIN WORK)
│   │   ├── alerts.py        #    - GET, PATCH alerts
│   │   ├── cases.py         #    - Case management
│   │   ├── entities.py      #    - Entity profiles
│   │   └── scoring.py       #    - ML scoring integration
│   │
│   ├── services/            # 💼 Business Logic Layer
│   │   ├── alert_service.py #    - Alert CRUD operations
│   │   ├── case_service.py  #    - Case workflow
│   │   └── entity_service.py#    - Profile aggregation
│   │
│   └── utils/               # 🛠️  Helper Functions
│       ├── pagination.py    #    - Pagination helpers
│       └── filtering.py     #    - Query filters
│
├── scripts/
│   ├── load_transactions.py # 📥 CSV → Database
│   └── seed_data.py         # 🌱 Generate sample alerts
│
├── tests/
│   ├── conftest.py          # 🧪 pytest fixtures
│   └── test_alerts.py       # ✅ Alert endpoint tests
│
├── requirements.txt         # 📦 Dependencies
├── .env.example            # 🔧 Config template
└── README.md               # 📖 Documentation
```

## API Endpoint Structure

```
/                           GET    Root endpoint (info)
/health                     GET    Health check

/api/alerts                 GET    List alerts (paginated, filtered)
/api/alerts/{id}            GET    Alert details (with transaction)
/api/alerts/{id}            PATCH  Update alert (status, notes)
/api/alerts/bulk-update     POST   Bulk update multiple alerts

/api/cases                  GET    List cases
/api/cases/{id}             GET    Case details
/api/cases                  POST   Create case
/api/cases/{id}             PATCH  Update case
/api/cases/{id}/alerts      POST   Link alerts to case
/api/cases/{id}/disposition POST   Close case with disposition

/api/entities/{id}          GET    Entity profile (aggregated stats)

/api/transactions           GET    List transactions
/api/transactions/{id}      GET    Transaction details
/api/transactions/upload    POST   Upload CSV (Phase 1)

/api/score/transaction      POST   Score a transaction (ML + Rules)
```

## Database Schema

```
┌────────────────────────────────────────────────────────────────────┐
│                           transactions                              │
├─────────────────┬────────────────────┬─────────────────────────────┤
│ id              │ UUID (PK)          │ Primary key                 │
│ step            │ Integer            │ Time step (1-744)           │
│ type            │ Enum               │ CASH_IN, CASH_OUT, etc.     │
│ amount          │ Decimal(15,2)      │ Transaction amount          │
│ nameOrig        │ String(100)        │ Sender entity ID            │
│ nameDest        │ String(100)        │ Receiver entity ID          │
│ oldbalanceOrg   │ Decimal            │ (Not for features)          │
│ newbalanceOrig  │ Decimal            │ (Not for features)          │
│ oldbalanceDest  │ Decimal            │ (Not for features)          │
│ newbalanceDest  │ Decimal            │ (Not for features)          │
│ isFraud         │ Boolean            │ Ground truth label          │
│ isFlaggedFraud  │ Boolean            │ Rule-based flag             │
│ created_at      │ DateTime           │ Timestamp                   │
└─────────────────┴────────────────────┴─────────────────────────────┘
                              │
                              │ 1:N
                              │
┌─────────────────┴────────────────────┬─────────────────────────────┐
│                alerts                │                              │
├─────────────────┬────────────────────┤                              │
│ id              │ UUID (PK)          │                              │
│ transaction_id  │ UUID (FK)          │ → transactions.id            │
│ status          │ Enum               │ new, in_review, closed       │
│ priority        │ Enum               │ low, medium, high, critical  │
│ ml_score        │ Float              │ 0.0 - 1.0                    │
│ ml_risk_band    │ Enum               │ low, medium, high, critical  │
│ ml_reason_codes │ JSON               │ ["high_amount", ...]         │
│ shap_values     │ JSON               │ Feature contributions        │
│ rules_triggered │ JSON               │ [{"rule_id": "R001", ...}]   │
│ assigned_to     │ String             │ Analyst name                 │
│ notes           │ Text               │ Investigation notes          │
│ created_at      │ DateTime           │                              │
│ updated_at      │ DateTime           │                              │
└─────────────────┴────────────────────┘                              │
                              │                                       │
                              │ M:N                                   │
                              │                                       │
                    ┌─────────▼──────────┐                           │
                    │   case_alerts      │                           │
                    ├────────────────────┤                           │
                    │ case_id (FK)       │                           │
                    │ alert_id (FK)      │                           │
                    │ added_at           │                           │
                    └─────────┬──────────┘                           │
                              │                                       │
                              │ N:1                                   │
                              │                                       │
┌─────────────────┴────────────────────┬─────────────────────────────┐
│                cases                 │                              │
├─────────────────┬────────────────────┤                              │
│ id              │ UUID (PK)          │                              │
│ status          │ Enum               │ open, investigating, resolved│
│ priority        │ Enum               │ low, medium, high, critical  │
│ disposition     │ Enum (nullable)    │ fraud, not_fraud             │
│ notes           │ Text               │ Case narrative               │
│ created_at      │ DateTime           │                              │
│ updated_at      │ DateTime           │                              │
│ resolved_at     │ DateTime           │                              │
└─────────────────┴────────────────────┴─────────────────────────────┘
```

## Data Flow Summary

1. **Data Loading** (scripts)
   - CSV → Python → SQLAlchemy → SQLite

2. **API Request** (runtime)
   - HTTP Request → Router → Service → ORM → Database
   - Database → ORM → Service → Pydantic → JSON Response

3. **ML Integration** (Week 3)
   - Transaction → Scoring Service → ML Model → Alert Creation

## Key Design Patterns

### 1. Layered Architecture
- **Router Layer**: HTTP handling, validation
- **Service Layer**: Business logic, aggregations
- **Model Layer**: Database ORM, relationships

### 2. Dependency Injection
```python
@router.get("/alerts")
def list_alerts(db: Session = Depends(get_db)):
    # db is injected by FastAPI
```

### 3. Schema Validation
```python
@router.patch("/alerts/{id}")
def update_alert(update: AlertUpdate):
    # Pydantic validates input automatically
```

### 4. ORM Relationships
```python
alert.transaction  # Automatic join via relationship()
```

## Performance Considerations

### Indexing Strategy
```python
# In models:
index=True  # On filtered/sorted columns
```

### Pagination
```python
# Offset-based pagination
query.offset(offset).limit(page_size)
```

### Eager Loading
```python
# Avoid N+1 queries
db.query(Alert).options(joinedload(Alert.transaction))
```

## Next Steps

1. ✅ Study this architecture
2. ✅ Read QUICKSTART.md
3. ✅ Implement alert endpoints
4. ✅ Test via Swagger UI
5. ✅ Integrate with Developer 3

**You understand the architecture. Now build it!** 🏗️
