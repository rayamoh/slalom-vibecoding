# Project Brief

## Project Name
**VibeCoding Financial Crime Detection Platform**

## Vision
Build an end-to-end financial crime detection system that identifies fraudulent mobile money transactions in real-time, provides actionable alerts to fraud analysts, and maintains audit trails for regulatory compliance.

## Core Problem
Detecting fraudulent mobile money transactions (primarily TRANSFER and CASH-OUT patterns) in high-volume transaction streams while minimizing false positives and providing explainable results suitable for regulated environments.

## Target Users
- **Fraud Analysts/Investigators**: Triage alerts, investigate entities, disposition cases
- **Fraud Operations Leads**: Manage queues, KPIs, coverage, false positives
- **Model Risk/Compliance**: Validate model, monitor drift, approve changes
- **Platform/Data Engineers**: Maintain pipelines, availability, security
- **Product Owners**: Configure policies, thresholds, SLAs, roadmap

## Success Criteria
1. Real-time and batch transaction scoring with < 100ms latency for real-time
2. Alert generation and case management workflow for investigators
3. Explainable ML model outputs (SHAP/LIME) for regulatory compliance
4. Audit trails for all decisions and model predictions
5. Scalable architecture supporting 1000 TPS initially, scaling to 10k TPS

## Key Constraints
- **Dataset Constraint**: Cannot use balance columns (`oldbalanceOrg`, `newbalanceOrig`, `oldbalanceDest`, `newbalanceDest`) as they become misleading after fraud annulment
- **Regulatory**: Must maintain full audit trails and explainability
- **Performance**: Real-time scoring must be < 100ms
- **Security**: No secrets in version control, secure API access

## Scope

### In-Scope (Phase 1-2)
- Transaction ingestion (streaming + batch)
- Feature computation, model scoring, and alert generation
- Investigator console: alerts, cases, entity views, explanation
- Feedback loop: dispositions into training/monitoring
- Governance: audit trails, access control, model registry

### Out-of-Scope (Initially)
- Network graph analytics at scale (Phase 3)
- Customer communications and account actioning automation (Phase 3)
- Multi-channel identity verification integrations (Phase 3)
- Cross-institution consortium intelligence (future)

## Timeline
- **Phase 1 (MVP)**: Core detection and alerting - 3 months
- **Phase 2 (Scale)**: Performance optimization and advanced features - 3 months
- **Phase 3 (Advanced)**: Network analytics and automation - Future