# Tech Context

## Technology Stack

**Note**: Stack is phased - Phase 1 uses minimal local setup, Phase 2 adds production infrastructure.

### Backend Services
- **Language**: Python 3.11+
- **Framework**: FastAPI for REST APIs
- **Async**: AsyncIO for concurrent I/O operations
- **Validation**: Pydantic for data validation and settings management

### Machine Learning
- **ML Framework**: scikit-learn, XGBoost, LightGBM
- **Feature Engineering**: pandas, numpy
- **Explainability**: SHAP, LIME
- **Experiment Tracking**: MLflow (Phase 2+)
- **Model Registry**: MLflow or custom solution (Phase 2+)

### Rule-Based Detection (NEW - Phase 1)
- **Rule Engine**: Custom Python implementation
- **Rule Types**: 
  - High-value transaction thresholds
  - Velocity-based rules (transaction count/amount)
  - Sequence patterns (e.g., TRANSFER → CASH-OUT)
- **Integration**: Combined with ML scoring for final decisions

### Data Processing
- **Phase 1 (Local POC)**: Python scripts for batch processing
- **Phase 2+ (Production)**: 
  - Streaming: Apache Kafka or cloud-native streaming (Kinesis/Pub-Sub)
  - Batch: Apache Airflow or Prefect for orchestration
  - Feature Store: Feast or custom solution
  - Data Validation: Great Expectations

### Databases
**Phase 1 (Local POC)**:
- **Primary**: SQLite for alerts, cases, transactions, users
- **Benefit**: Zero-config, file-based, perfect for local development and demos
- **Limitations**: Single-writer, not suitable for production scale

**Phase 2+ (Production)**:
- **Relational**: PostgreSQL for alerts, cases, users
- **Time-Series**: TimescaleDB (PostgreSQL extension) for transaction data
- **Cache**: Redis for feature caching and session management
- **Document**: MongoDB for unstructured investigation notes (optional)

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit or Zustand
- **UI Library**: Material-UI or Ant Design
- **Charts**: Recharts or D3.js for visualizations
- **Data Grid**: AG Grid for alert queue tables

### Infrastructure
**Phase 1 (Local POC)**:
- **Development**: Local Python environment with venv
- **Database**: SQLite file-based database
- **No containers**: Direct execution on local machine
- **No CI/CD**: Manual testing and execution

**Phase 2+ (Production)**:
- **Containerization**: Docker
- **Orchestration**: Kubernetes (for production scale)
- **CI/CD**: GitHub Actions
- **Cloud Provider**: AWS/GCP/Azure (TBD based on deployment target)
- **IaC**: Terraform or Pulumi

### Development Tools
- **Version Control**: Git + GitHub
- **IDE**: VS Code with Copilot
- **Code Quality**: 
  - Python: black, ruff, mypy
  - TypeScript: ESLint, Prettier
- **Testing**: 
  - Python: pytest, pytest-asyncio
# Phase 1 - Local POC
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.0.0
pandas>=2.0.0
numpy>=1.24.0
scikit-learn>=1.3.0
xgboost>=2.0.0
shap>=0.42.0
sqlalchemy>=2.0.0
alembic  # for DB migrations
pydantic-settings
aiosqlite  # async SQLite support

# Phase 2+ - Production additions
python-jose[cryptography]  # JWT tokens
passlib[bcrypt]  # password hashing
redis>=4.0.0  # Redis client
psycopg2-binary>=2.9.0  # PostgreSQL driver
xgboost>=2.0.0
shap>=0.42.0
sqlalchemy>=2.0.0
alembic  # for DB migrations
pydantic-settings
python-jose[cryptography]  # JWT tokens
passlib[bcrypt]  # password hashing
```

### TypeScript/React Requirements
```json
{
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "@reduxjs/toolkit": "^1.9.0",
  "react-router-dom": "^6.0.0",
  "axios": "^1.0.0",
  "@mui/material": "^5.0.0"
}
```
Git

### Phase 1 Local Setup (No Docker)
1. Clone repository
2. Create Python virtual environment: `python -m venv venv`
3. Activate venv: 
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
4. Install Python dependencies: `pip install -r requirements.txt`
5. Install Node dependencies: `cd frontend && npm install`
6. Copy `.env.example` to `.env` and configure (SQLite path)
7. Initialize SQLite database: `alembic upgrade head`
8. Seed sample data: `python scripts/seed_data.py`
9. Start backend: `uvicorn main:app --reload`
10. Start frontend: `cd frontend && npm start`

### Phase 2+ Setup (With Docker)
- Docker Desktop required
- `docker-compose up -d` for all services
- See Phase 2 documentation for detailsr requirements.txt`
5. Install Node dependencies: `cd frontend && npm install`
6. Copy `.env.example` to `.env` and configure
7. Start local services: `docker-compose up -d` (DB, Redis, Kafka)
8. Run database migrations: `alembic upgrade head`
**Phase 1 (Local POC)**:
- **Batch scoring latency**: < 1 second per transaction (acceptable for demo)
- **API response time**: < 500ms p95 for console operations
- **Throughput**: Handle sample dataset (1000s of transactions) in batch mode

**Phase 2+ (Production)**:
9. Start backend: `uvicorn main:app --reload`
10. Start frontend: `cd frontend && npm start`

## Technical Constraints

### Performance Requirements
**Phase 1 (Local POC)**:
- No authentication required (local demo only)
- Basic input validation
- No secrets in version control
- Simple logging for debugging

**Phase 2+ (Production)**:
- API authentication required for all endpoints
- Audit trail for all fraud decisions
- Data encryption at rest and in transit
- PII masking in non-production environments
- Secrets management (environment variables, key vault)
- Rate limiting and CORS
### Data Constraints
- **Dataset limitation**: Cannot use balance columns for fraud detection
  - Excluded: `oldbalanceOrg`, `newbalanceOrig`, `oldbalanceDest`, `newbalanceDest`
  - Allowed: `step`, `type`, `amount`, `nameOrig`, `nameDest`, engineered features
- **Data retention**: 90 days for hot storage, 2 years for warm storage, 7 years archive

### Security Constraints
- NoPhase 1 Environment Variables
```bash
# API
API_HOST=localhost
API_PORT=8000

# Database - SQLite
DATABASE_URL=sqlite:///./fraud_detection.db

# ML Model
MODEL_PATH=models/fraud_detector_v1.pkl
MODEL_THRESHOLD_HIGH=0.8
MODEL_THRESHOLD_MEDIUM=0.5

# Rule Engine
RULE_HIGH_VALUE_THRESHOLD=200000
RULE_VELOCITY_WINDOW_HOURS=24
RULE_MAX_TRANSACTIONS_PER_HOUR=10

# Logging
LOG_LEVEL=INFO
```

### Phase 2+ Additional Environment Variables
```bash
# Secret Key for JWT
SECRET_KEY=<generated-secret>

# PostgreSQL
DATABASE_URL=postgresql://user:pass@localhost:5432/fraud_db
Phase 1 Testing
- **Unit Tests**: Core business logic, feature engineering, model inference
- **Target**: 60% code coverage for backend, 50% for frontend
- **Tools**: pytest (Python), Jest (TypeScript/React)
- **Manual Testing**: Local UI testing and API testing

### Phase 2+ Testing
- **Unit Tests**: Target 80% coverage backend, 70% frontend
- **Integration Tests**: API flows, database operations
- **Performance Tests**: Load testing with Locust or k6
- **Security Tests**: Authentication, authorization, input validation
- **E2E Tests**: Selenium or Playwright for full workflows

<!-- Generated by Copilot -->
# Monitoring
LOG_LEVEL=INFO
ENABLE_METRICS=true
```

## Testing Strategy

### Unit Tests
- All business logic and feature engineering functions
- Model inference logic
- API endpoint handlers
- Target: 80% code coverage

### Integration Tests
- API endpoint flows
- Database operations
- Feature store interactions
- Streaming pipeline

### Performance Tests
- Load testing with Locust or k6
- Latency benchmarks for real-time scoring
- Throughput testing for batch processing

### Security Tests
- API authentication/authorization
- Input validation and SQL injection prevention
- Secret scanning in pre-commit hooks