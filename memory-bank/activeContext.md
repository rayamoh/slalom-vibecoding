# Active Context

## Current Focus
**Phase 1 Local POC - Parallel Development Strategy**: 3 developers working independently on Backend, ML/Rules, and Frontend with clear integration contracts.

## Recent Changes
- ✅ Created memory bank structure with all required files
- ✅ Populated productContext.md with comprehensive PRD for fraud detection system
- ✅ Established copilot-rules.md with security and workflow rules
- ✅ Defined memory-bank-instructions.md for Copilot workflow guidance
- ✅ Populated projectbrief.md with project vision and scope
- ✅ Populated systemPatterns.md with architecture and design patterns
- ✅ Populated techContext.md with technology stack and constraints
- ✅ Updated activeContext.md (this file) with current state
- ✅ **SCOPE CHANGE**: Refactored all memory bank files for POC-first approach
  - Phase 1: Local POC with SQLite, no auth, rule-based + ML
  - Phase 2: Production with PostgreSQL, Docker, CI/CD, authentication
- ✅ **NEW**: Created parallel-dev-plan.md for 3-person independent development
  - Developer 1: Backend API & Database
  - Developer 2: ML Model & Rules Engine
  - Developer 3: Frontend UI (Alert Queue & Triaging)
  - Detailed UI specifications for fraud alert triaging workflow

## Active Decisions

### Phase 1 Technology Stack (Local POC)
- **Backend**: Python with FastAPI - chosen for ML integration and async capabilities
- **Frontend**: React with TypeScript - chosen for type safety and ecosystem
- **Database**: SQLite - file-based, zero-config, perfect for local POC
- **ML**: scikit-learn/XGBoost - chosen for tabular data and explainability
- **Rule Engine**: Custom Python implementation for deterministic fraud rules
- **No Auth**: Local demo only, no authentication required in Phase 1
- **No Containers**: Direct execution, no Docker in Phase 1

### Phase 2 Technology Stack (Production) - Future
- **Database**: PostgreSQL with TimescaleDB for time-series
- **Cache**: Redis for feature caching and sessions
- **Streaming**: Kafka for real-time transaction processing
- **Auth**: JWT/OAuth for authentication and authorization
- **Infrastructure**: Docker, Kubernetes, CI/CD with GitHub Actions

### Architecture Approach
**Phase 1 (Simplified)**:
- Monolithic FastAPI application for POC
- SQLite for all data storage
- Batch processing only (no streaming)
- Simple rule engine + ML model integration
- Basic React UI with local state management

****Phase 1**: Local POC only, no production deployment considerations
- **Phase 1**: No authentication or security features (deferred to Phase 2)
- **Phase 2**: Must achieve < 100ms latency for real-time scoring
- All decisions require audit trails for compliance (Phase 2+)
- Model explanations required for regulatory acceptance (both phases)
- CQRS pattern for read/write optimization
- Model registry for version control and deployment
- Streaming architecture for real-time scoring

### Key Constraints Acknowledged
- Cannot use balance columns from dataset due to post-fraud annulment issue
- Must maintain < 100ms latency for real-time scoring
- All decisions require audit trails for compliance
- Model explanations required for regulatory acceptance

## Next Steps
updated memory bank documentation
2. Set up repository structure (without `/infrastructure` for now)
3. Create `.env.example` with SQLite configuration
4. Initialize basic project scaffolding

### Short-term (Phase 1 - Local POC)
1. **Data & Models**
   - Obtain PaySim dataset
   - Perform EDA and feature engineering (without forbidden balance columns)
   - Train baseline fraud detection model
   - Implement SHAP explainability

2. **Rule-Based Detection (NEW)**
   - Implement high-value TRANSFER rule (amount > 200k)
   - Implement velocity-based rules
   - Implement sequence pattern rules (TRANSFER → CASH-OUT)
   - Create combined decision engine (ML + Rules)

3. **Backend API**
   - Set up FastAPI project structure
   - Configure SQLite with Alembic migrations
   - Implement transaction batch ingestion
   - Implement model scoring service
   - Implement rule engine
   - Implement alert generation logic (ML + Rules)
   - Basic CRUD for alerts and cases

4. **Frontend Console**
   - Set up React TypeScript project
   - Build alert queue view
   - Build alert detail view with explanations (SHAP + Rule reasons)
   - Implement basic case management

5. **Local Setup**
   - Create seed data script
   - Write local development documentation
   - Basic error handling

### Me**Phase 1**: What subset of PaySim data to use for POC demo?
- [ ] **Phase 1**: What are the specific rule thresholds for demo purposes?
- [ ] **Phase 2**: What is the specific deployment target? (AWS/GCP/Azure/on-prem)
- [ ] **Phase 2**: What is the expected transaction volume? (for capacity planning)
- [ ] **Phase 2**: Are there existing systems to integrate with?
- [ ] **Phase 2**: What authentication system should be used? (OAuth, SAML, etc.)
- [ ] **Phase 2**: up CI/CD pipeline
- Deploy to cloud (AWS/GCP/Azure)
- Add Redis for caching
- Implement streaming pipeline for real-time scoring
- Performance optimization and load testingiews
- Performance optimization and load testing
- Model monitoring and drift detection

## Open Questions
- [ ] What is the specific deployment target? (AWS/GCP/Azure/on-
- **Phase 1 is POC only**: Minimal viable demo to prove concept
- **Phase 2 is production**: Full security, scalability, deployment

<!-- Generated by Copilot -->prem)
- [ ] What is the expected transaction volume? (for capacity planning)
- [ ] Are there existing systems to integrate with?
- [ ] What authentication system should be used? (OAuth, SAML, etc.)
- [ ] Specific compliance requirements beyond basic audit trails?

## Blockers
None currently - in documentation and planning phase.

## Notes
- Following Feature Development Workflow: PRD → Design → Tasks → Code
- productContext.md contains extensive PRD - can be used to generate design documents
- Need to create feature-specific folders when starting specific features
- Memory bank should be updated incrementally as work progresses