# Active Context

## Current Focus
Setting up the project memory bank structure and establishing foundational documentation for the VibeCoding Financial Crime Detection Platform.

## Recent Changes
- ✅ Created memory bank structure with all required files
- ✅ Populated productContext.md with comprehensive PRD for fraud detection system
- ✅ Established copilot-rules.md with security and workflow rules
- ✅ Defined memory-bank-instructions.md for Copilot workflow guidance
- ✅ Populated projectbrief.md with project vision and scope
- ✅ Populated systemPatterns.md with architecture and design patterns
- ✅ Populated techContext.md with technology stack and constraints
- ✅ Updated activeContext.md (this file) with current state

## Active Decisions

### Technology Stack
- **Backend**: Python with FastAPI - chosen for ML integration and async capabilities
- **Frontend**: React with TypeScript - chosen for type safety and ecosystem
- **ML**: scikit-learn/XGBoost - chosen for tabular data and explainability
- **Data Processing**: Kafka for streaming (to be confirmed based on deployment target)

### Architecture Approach
- Event-driven microservices for scalability
- Feature store pattern for consistent ML features
- CQRS pattern for read/write optimization
- Model registry for version control and deployment

### Key Constraints Acknowledged
- Cannot use balance columns from dataset due to post-fraud annulment issue
- Must maintain < 100ms latency for real-time scoring
- All decisions require audit trails for compliance
- Model explanations required for regulatory acceptance

## Next Steps

### Immediate (Phase 0 - Foundation)
1. Review and validate all memory bank documentation
2. Set up repository structure (if not exists)
3. Create `.env.example` with safe placeholders
4. Initialize basic project scaffolding

### Short-term (Phase 1 - MVP)
1. **Data & Models**
   - Obtain PaySim dataset
   - Perform EDA and feature engineering (without forbidden balance columns)
   - Train baseline fraud detection model
   - Implement SHAP explainability

2. **Backend API**
   - Set up FastAPI project structure
   - Implement transaction ingestion endpoint
   - Implement model scoring service
   - Implement alert generation logic

3. **Frontend Console**
   - Set up React TypeScript project
   - Build alert queue view
   - Build alert detail view with explanations
   - Implement basic case management

4. **Infrastructure**
   - Set up local development with Docker Compose
   - Configure PostgreSQL for alerts/cases
   - Configure Redis for caching
   - Set up basic CI/CD pipeline

### Medium-term (Phase 2 - Scale)
- Implement streaming pipeline for real-time scoring
- Add feature store integration
- Build entity profiling and network views
- Performance optimization and load testing
- Model monitoring and drift detection

## Open Questions
- [ ] What is the specific deployment target? (AWS/GCP/Azure/on-prem)
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