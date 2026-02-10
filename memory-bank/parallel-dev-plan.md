# Parallel Development Plan - Phase 1 POC

## Overview
3 developers working independently from their own laptops on Phase 1 POC with minimal dependencies.

## Team Structure

### 👤 Developer 1: Backend API & Database Lead
**Focus**: FastAPI + SQLite + Data Layer

### 👤 Developer 2: ML & Rules Engine Lead  
**Focus**: Model Training + Rule Logic + Scoring

### 👤 Developer 3: Frontend UI Lead
**Focus**: React + Alert Queue + Triaging Workflow

---

## Integration Contract (API Specification)

All developers work against this contract. Backend implements it, Frontend consumes it, ML/Rules provides the logic.

### Core Data Models

```typescript
// Alert Model
interface Alert {
  id: string;
  transaction_id: string;
  status: 'new' | 'in_review' | 'pending_info' | 'escalated' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Transaction details
  transaction: {
    type: 'CASH_IN' | 'CASH_OUT' | 'DEBIT' | 'PAYMENT' | 'TRANSFER';
    amount: number;
    step: number;
    timestamp: string;
    nameOrig: string;
    nameDest: string;
  };
  
  // ML scoring
  ml_score: number; // 0-1
  ml_risk_band: 'low' | 'medium' | 'high' | 'critical';
  ml_reason_codes: string[]; // e.g., ['high_amount', 'new_counterparty']
  shap_values: { feature: string; value: number }[];
  
  // Rule-based detection
  rules_triggered: {
    rule_id: string;
    rule_name: string;
    reason: string;
  }[];
  
  // Metadata
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  notes?: string;
}

// Case Model
interface Case {
  id: string;
  status: 'open' | 'investigating' | 'escalated' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  alert_ids: string[];
  disposition?: 'fraud' | 'not_fraud' | 'inconclusive';
  created_at: string;
  updated_at: string;
  notes: string;
}

// Entity Profile Model
interface EntityProfile {
  entity_id: string; // nameOrig or nameDest
  role: 'sender' | 'receiver' | 'both';
  
  // Statistics
  total_transactions: number;
  total_amount: number;
  avg_amount: number;
  transaction_types: { type: string; count: number }[];
  
  // Risk history
  prior_alerts: number;
  prior_cases: number;
  
  // Top counterparties
  top_counterparties: { entity: string; count: number; total_amount: number }[];
}
```

### REST API Endpoints

#### Alerts
- `GET /api/alerts` - List alerts with filters
  - Query params: `status`, `priority`, `sort_by`, `limit`, `offset`
- `GET /api/alerts/{id}` - Get alert details
- `PATCH /api/alerts/{id}` - Update alert (status, notes, assigned_to)
- `POST /api/alerts/bulk-update` - Bulk update multiple alerts

#### Cases
- `GET /api/cases` - List cases
- `GET /api/cases/{id}` - Get case details
- `POST /api/cases` - Create new case
- `PATCH /api/cases/{id}` - Update case
- `POST /api/cases/{id}/alerts` - Link alerts to case

#### Entities
- `GET /api/entities/{id}` - Get entity profile

#### Transactions
- `POST /api/transactions/upload` - Upload transaction file for batch scoring
- `GET /api/transactions/{id}` - Get transaction details

#### Scoring (Internal)
- `POST /api/score/transaction` - Score a single transaction (ML + Rules)

---

## 🔵 Developer 1: Backend API & Database

### Objective
Build the FastAPI application with SQLite database and REST API endpoints for alerts, cases, and entities.

### Tasks (2-3 weeks)

#### Week 1: Foundation & Database
- [ ] **TASK-BE-001**: FastAPI project scaffolding
  - Setup: `fastapi`, `uvicorn`, `pydantic`, `sqlalchemy`, `alembic`
  - Project structure: `/backend/app/`, `/backend/models/`, `/backend/api/`, `/backend/db/`
  - Health check endpoint: `GET /health`
  
- [ ] **TASK-BE-002**: SQLite database schema
  - Tables: `transactions`, `alerts`, `cases`, `entities`, `alert_cases` (junction)
  - Alembic migrations setup
  - Seed script with sample data (100 alerts, 20 cases)
  
- [ ] **TASK-BE-003**: CRUD for Alerts
  - `GET /api/alerts` with filtering/pagination
  - `GET /api/alerts/{id}`
  - `PATCH /api/alerts/{id}` (status, notes, assigned_to)
  - `POST /api/alerts/bulk-update`

#### Week 2: Cases & Entities
- [ ] **TASK-BE-004**: CRUD for Cases
  - `GET /api/cases`, `GET /api/cases/{id}`
  - `POST /api/cases`, `PATCH /api/cases/{id}`
  - `POST /api/cases/{id}/alerts` (link alerts)
  
- [ ] **TASK-BE-005**: Entity profile endpoint
  - `GET /api/entities/{id}`
  - Aggregate statistics from transactions
  - Top counterparties query
  
- [ ] **TASK-BE-006**: Transaction endpoints
  - `POST /api/transactions/upload` (CSV/JSON file)
  - `GET /api/transactions/{id}`
  - Parse and store in SQLite

#### Week 3: Integration & Testing
- [ ] **TASK-BE-007**: Scoring integration endpoint
  - `POST /api/score/transaction` (calls ML/Rules service)
  - Initially: Mock response, later: integrate with Developer 2's code
  
- [ ] **TASK-BE-008**: Alert generation logic
  - After scoring, create alert if triggered
  - Link transaction to alert
  
- [ ] **TASK-BE-009**: Unit tests
  - pytest for all endpoints
  - Test with mock data

### Mock Data Strategy
- Create `seed_data.py` with 100 sample alerts across all statuses
- Include mock SHAP values and rule triggers
- This allows Developer 3 to work immediately

### Independent Work
✅ Can work 100% independently with mock ML/Rules responses
✅ Provides seed data for Frontend developer
✅ Integration point: Week 3 with Developer 2's scoring service

---

## 🟢 Developer 2: ML Model & Rules Engine

### Objective
Train ML model, implement rule engine, create scoring service that combines both.

### Tasks (2-3 weeks)

#### Week 1: Data & Model Training
- [ ] **TASK-ML-001**: Obtain PaySim dataset
  - Download and version control
  - Place in `/data/raw/`
  
- [ ] **TASK-ML-002**: EDA notebook
  - Jupyter notebook: `notebooks/01_eda.ipynb`
  - Analyze fraud patterns, class distribution
  - Document forbidden columns (balance fields)
  
- [ ] **TASK-ML-003**: Feature engineering
  - Create features (velocity, counterparty novelty, amount z-scores)
  - Save feature engineering code: `/models/features.py`
  - Exclude forbidden balance columns
  
- [ ] **TASK-ML-004**: Train baseline model
  - XGBoost or RandomForest classifier
  - Train on 70% data, validate on 30%
  - Save model artifact: `/models/fraud_detector_v1.pkl`
  - Document performance metrics

#### Week 2: Rules & Explainability
- [ ] **TASK-RULE-001**: Implement rule engine
  - File: `/models/rules_engine.py`
  - Rules:
    - High-value TRANSFER (amount > 200,000)
    - Velocity: tx_count_24h > 10
    - Sequence: TRANSFER → CASH_OUT within 1 hour
  - Each rule returns: `triggered: bool`, `rule_id: str`, `reason: str`
  
- [ ] **TASK-ML-005**: SHAP explainability
  - Integrate SHAP for model explanations
  - Function: `explain_prediction(transaction) -> List[{feature, value}]`
  - Top 5 feature contributions per prediction
  
- [ ] **TASK-RULE-002**: Combined scoring service
  - File: `/models/scoring_service.py`
  - Function: `score_transaction(transaction) -> ScoringResult`
  - Returns: ML score, risk band, SHAP values, triggered rules
  - Can be imported by Backend developer

#### Week 3: Integration & Validation
- [ ] **TASK-ML-006**: Model evaluation
  - Confusion matrix, precision/recall
  - Document in `notebooks/02_evaluation.ipynb`
  
- [ ] **TASK-RULE-003**: Combined decision logic
  - Alert if: `ml_score > 0.7 OR rules_triggered > 0`
  - Priority logic: `critical` if both ML + rules triggered
  
- [ ] **TASK-ML-007**: Integration with Backend
  - Provide scoring module to Developer 1
  - Test integration with Backend API
  - Create batch scoring script

### Mock Data Strategy
- Use small subset of PaySim (1000 transactions) for fast iteration
- Create `test_transactions.csv` for Developer 1 and 3 to use

### Independent Work
✅ Can work 100% independently on model training
✅ Provides test data and scoring module for other developers
✅ Integration point: Week 3 with Developer 1's API

---

## 🟡 Developer 3: Frontend UI (Alert Queue & Triaging)

### Objective
Build React application for fraud investigators to view alerts, triage, and manage cases.

### Tasks (2-3 weeks)

#### Week 1: Setup & Alert Queue
- [ ] **TASK-FE-001**: React TypeScript setup
  - Create React app with TypeScript
  - Setup: `axios`, `react-router-dom`, `@mui/material` (or Ant Design)
  - Project structure: `/frontend/src/components/`, `/frontend/src/pages/`, `/frontend/src/api/`
  
- [ ] **TASK-FE-002**: API client with mock data
  - File: `/frontend/src/api/client.ts`
  - Mock API responses for development
  - Axios client with base URL configuration
  
- [ ] **TASK-FE-004**: Alert Queue page
  - Page: `/alerts`
  - Features:
    - Table/Grid showing all alerts
    - Columns: ID, Priority, Type, Amount, Status, Created, Score
    - Status badges with colors (New=blue, In Review=yellow, Closed=green)
    - Priority indicators (Critical=red, High=orange, Medium=yellow, Low=gray)
  - Filtering:
    - Status dropdown (New, In Review, Escalated, Closed)
    - Priority filter
    - Amount range slider
    - Transaction type checkboxes
  - Sorting:
    - By priority (default)
    - By risk score
    - By amount
    - By created date
  - Pagination: 25 alerts per page

#### Week 2: Alert Detail & Triaging
- [ ] **TASK-FE-005**: Alert Detail page
  - Page: `/alerts/:id`
  - Sections:
    1. **Transaction Summary Card**
       - Type, Amount, Timestamp, Origin → Destination
       - Visual: Horizontal flow diagram
    2. **Risk Assessment Panel**
       - ML Score gauge (0-100 with color bands)
       - Risk Band badge (Low/Medium/High/Critical)
       - Rules Triggered section with badges
    3. **Explanation Panel (Tabbed)**
       - Tab 1: ML Explanation (SHAP chart - horizontal bar)
       - Tab 2: Rule Reasons (list of triggered rules with descriptions)
    4. **Actions Panel**
       - Status dropdown (change status)
       - Assign to analyst dropdown (mockable)
       - Notes textarea
       - "Create Case" button
       - "Add to Existing Case" button
       - "Mark as Fraud/Not Fraud" buttons
  
- [ ] **TASK-FE-006**: SHAP visualization component
  - Component: `ShapExplanation.tsx`
  - Horizontal bar chart showing feature contributions
  - Red bars for features increasing fraud score
  - Blue bars for features decreasing fraud score
  - Use Chart.js or Recharts

#### Week 3: Case Management & Polish
- [ ] **TASK-FE-008**: Case Management page
  - Page: `/cases`
  - Case list with status, priority, alert count
  - Click to view case details
  
- [ ] **TASK-FE-008b**: Case Detail page
  - Page: `/cases/:id`
  - Show linked alerts
  - Timeline of status changes
  - Disposition workflow (Fraud/Not Fraud/Inconclusive)
  
- [ ] **TASK-FE-007**: Entity Profile page (Simple)
  - Page: `/entities/:id`
  - Basic statistics: total transactions, total amount
  - Top counterparties table
  
- [ ] **TASK-FE-009**: Disposition workflow
  - Modal dialog for finalizing disposition
  - Required fields: disposition, confidence, notes
  - Submit button saves to backend

- [ ] **TASK-FE-010**: Component tests
  - Jest + React Testing Library
  - Test alert filtering, sorting
  - Test status changes

### Mock Data Strategy
- Create `mock-data.ts` with 50 sample alerts
- Include diverse scenarios:
  - ML-only triggers
  - Rule-only triggers
  - Combined triggers
  - Different priorities and statuses
- Allows full UI development before backend is ready

### Independent Work
✅ Can work 100% independently with mock data
✅ Switch to real API when Developer 1 completes endpoints
✅ Integration point: Week 2-3 with Developer 1's API

---

## UI Specifications (Detailed)

### Alert Queue Screen

```
┌─────────────────────────────────────────────────────────────────┐
│ Fraud Detection - Alert Queue                    [User: Demo]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Filters:  [Status: All ▼] [Priority: All ▼] [Type: All ▼]      │
│           Amount: [$0 ━━━━━━━○━━━━━━━ $500k]                    │
│           [Reset Filters]                                        │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ID      Priority  Type      Amount    Score  Status  Created│ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ A-001   🔴 Crit  TRANSFER  $250,000   0.92   New     2m ago │ │
│ │ A-002   🟠 High  CASH_OUT  $180,000   0.85   New     5m ago │ │
│ │ A-003   🟡 Med   TRANSFER  $120,000   0.68   Review  10m ago│ │
│ │ A-004   🟢 Low   PAYMENT   $5,000     0.42   Review  15m ago│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ [◄ Prev]  Page 1 of 4  [Next ►]                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Alert Detail Screen

```
┌─────────────────────────────────────────────────────────────────┐
│ Alert Detail - A-001                              [← Back]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ┌─ Transaction Summary ────────────────────────────────────────┐│
│ │ TRANSFER                                                      ││
│ │ C123456789 ────→ $250,000 ────→ C987654321                  ││
│ │ Step 243 | 2026-02-10 14:32:15                               ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                   │
│ ┌─ Risk Assessment ────────────────────────────────────────────┐│
│ │ ML Score: [████████████░░░░] 92/100  🔴 CRITICAL            ││
│ │                                                               ││
│ │ Rules Triggered:                                              ││
│ │ • HIGH_VALUE_TRANSFER: Amount exceeds $200,000               ││
│ │ • NEW_COUNTERPARTY: First transaction between these entities ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                   │
│ ┌─ Explanation ─────────────────────────────────────────────────┐│
│ │ [ML Features] [Rule Details]                                  ││
│ │                                                               ││
│ │ Top Contributing Features (SHAP):                             ││
│ │ amount_zscore        ████████ +0.45                          ││
│ │ new_counterparty     ███████ +0.38                           ││
│ │ hour_of_day          ██ +0.12                                ││
│ │ tx_count_24h         █ -0.08                                 ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                   │
│ ┌─ Actions ─────────────────────────────────────────────────────┐│
│ │ Status: [In Review ▼]  Assign: [Analyst 1 ▼]                ││
│ │                                                               ││
│ │ Notes: [_____________________________________________]        ││
│ │                                                               ││
│ │ [Create New Case] [Add to Case]                              ││
│ │ [Mark as Fraud] [Mark as Not Fraud]                          ││
│ └───────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Timeline

### Week 1 (Independent Work)
- Dev 1: Database + mock endpoints
- Dev 2: Data exploration + feature engineering
- Dev 3: UI setup + mock data

### Week 2 (Partial Integration)
- Dev 1: Complete CRUD endpoints, provide to Dev 3
- Dev 2: Model training + rules engine
- Dev 3: Connect UI to Dev 1's API (replace mocks)

### Week 3 (Full Integration)
- Dev 1: Integrate Dev 2's scoring service
- Dev 2: Provide scoring module + batch script
- Dev 3: Test end-to-end flow, polish UI

### Week 4 (Demo Preparation)
- All: Integration testing
- All: Seed demo data with interesting scenarios
- All: Demo preparation and documentation

---

## Development Setup (Per Laptop)

### Developer 1 (Backend)
```bash
# Backend only
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
alembic upgrade head
python seed_data.py
uvicorn app.main:app --reload
# API runs on http://localhost:8000
```

### Developer 2 (ML/Rules)
```bash
# ML work only
cd models
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
jupyter notebook  # For EDA
python train_model.py
python test_scoring.py
```

### Developer 3 (Frontend)
```bash
# Frontend only
cd frontend
npm install
npm start
# UI runs on http://localhost:3000
# Initially uses mock data, later connects to http://localhost:8000
```

---

## Communication & Collaboration

### Daily Standups (15 min)
- What did I complete yesterday?
- What am I working on today?
- Any blockers or dependencies?

### Integration Points
- **End of Week 1**: Dev 1 provides API spec + seed data
- **End of Week 2**: Dev 2 provides scoring module, Dev 3 connects to API
- **End of Week 3**: Full integration testing

### Shared Artifacts
- API contract (this document)
- Mock data files
- Integration test scenarios

---

## Success Criteria

### Developer 1 Success
✅ All API endpoints functional with SQLite
✅ Seed data with 100+ alerts
✅ Unit tests passing
✅ Dev 3 can query and update alerts

### Developer 2 Success
✅ ML model trained with >80% precision
✅ 3+ rules implemented and tested
✅ Scoring service returns combined results
✅ Can score test transactions

### Developer 3 Success
✅ Alert queue displays and filters alerts
✅ Alert detail shows ML + Rule explanations
✅ Triaging workflow (status changes) works
✅ UI is responsive and polished

### Integrated System Success
✅ Upload transaction file → alerts generated
✅ View alerts in UI → see ML + Rule explanations
✅ Triage alerts → status changes persist
✅ Create cases → link multiple alerts
✅ Demo end-to-end flow

---

<!-- Generated by Copilot -->
