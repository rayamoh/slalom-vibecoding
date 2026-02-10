# Tech Context

## Technology Stack

### Backend Services
- **Language**: Python 3.11+
- **Framework**: FastAPI for REST APIs
- **Async**: AsyncIO for concurrent I/O operations
- **Validation**: Pydantic for data validation and settings management

### Machine Learning
- **ML Framework**: scikit-learn, XGBoost, LightGBM
- **Feature Engineering**: pandas, numpy
- **Explainability**: SHAP, LIME
- **Experiment Tracking**: MLflow (planned)
- **Model Registry**: MLflow or custom solution

### Data Processing
- **Streaming**: Apache Kafka or cloud-native streaming (Kinesis/Pub-Sub)
- **Batch**: Apache Airflow or Prefect for orchestration
- **Feature Store**: Feast or custom solution
- **Data Validation**: Great Expectations

### Databases
- **Time-Series**: InfluxDB or TimescaleDB for transaction data
- **Relational**: PostgreSQL for alerts, cases, users
- **Document**: MongoDB for unstructured investigation notes (optional)
- **Cache**: Redis for feature caching and session management

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit or Zustand
- **UI Library**: Material-UI or Ant Design
- **Charts**: Recharts or D3.js for visualizations
- **Data Grid**: AG Grid for alert queue tables

### Infrastructure
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
  - TypeScript: Jest, React Testing Library
- **API Testing**: Postman or Thunder Client

## Key Dependencies

### Python Requirements (Core)
```python
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

## Development Environment Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm/yarn
- Docker Desktop
- Git

### Local Setup
1. Clone repository
2. Create Python virtual environment: `python -m venv venv`
3. Activate venv: `source venv/bin/activate` (macOS/Linux)
4. Install Python dependencies: `pip install -r requirements.txt`
5. Install Node dependencies: `cd frontend && npm install`
6. Copy `.env.example` to `.env` and configure
7. Start local services: `docker-compose up -d` (DB, Redis, Kafka)
8. Run database migrations: `alembic upgrade head`
9. Start backend: `uvicorn main:app --reload`
10. Start frontend: `cd frontend && npm start`

## Technical Constraints

### Performance Requirements
- **Real-time scoring latency**: < 100ms p95
- **API response time**: < 200ms p95 for console operations
- **Throughput**: Support 1000 TPS initially, scale to 10k TPS
- **Feature computation**: < 50ms for real-time features

### Data Constraints
- **Dataset limitation**: Cannot use balance columns for fraud detection
  - Excluded: `oldbalanceOrg`, `newbalanceOrig`, `oldbalanceDest`, `newbalanceDest`
  - Allowed: `step`, `type`, `amount`, `nameOrig`, `nameDest`, engineered features
- **Data retention**: 90 days for hot storage, 2 years for warm storage, 7 years archive

### Security Constraints
- No secrets in version control
- API authentication required for all endpoints
- Audit trail for all fraud decisions
- Data encryption at rest and in transit
- PII masking in non-production environments

### Compliance
- Model explainability required for regulatory review
- Audit logs retained for 7 years
- Role-based access control for all user actions
- Model validation and approval workflow

## Environment Configuration

### Environment Variables
```bash
# API
API_HOST=localhost
API_PORT=8000
SECRET_KEY=<generated-secret>

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/fraud_db
REDIS_URL=redis://localhost:6379

# ML Model
MODEL_PATH=/models/fraud_detector_v1.pkl
MODEL_THRESHOLD_HIGH=0.8
MODEL_THRESHOLD_MEDIUM=0.5

# Feature Store
FEATURE_STORE_URL=<feast-or-custom-url>

# Kafka/Streaming
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
TRANSACTION_TOPIC=transactions

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