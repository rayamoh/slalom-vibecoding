# Product Context

Below is a comprehensive set of product requirements for a financial crime detection program built around the PaySim-based mobile money dataset you described. I’m writing this as a Product Requirements Document (PRD) with explicit front-end, back-end, and fraud model requirements, plus non-functional requirements, acceptance criteria, and an MVP → scale roadmap.

***

## 1) Product intent and scope

**NOTE: Phased Development Approach**
- **Phase 1 (Local POC)**: Batch scoring, SQLite, rule-based + ML detection, no authentication
- **Phase 2 (Production)**: Real-time scoring, PostgreSQL, authentication, Docker, CI/CD, cloud deployment

### 1.1 Goal

Detect and operationalize investigation of fraudulent mobile money transactions (primarily TRANSFER and CASH-OUT patterns consistent with account depletion) using:

*   Batch scoring (Phase 1) and real-time scoring (Phase 2+)
*   ML-based detection + rule-based detection (both phases)
*   Alerting and case management
*   Explainability and auditability suitable for regulated environments

### 1.2 Dataset-specific constraints that shape requirements

The dataset includes `isFraud` (label) and `isFlaggedFraud` (high-value transfer rule > 200,000). Fraudulent transactions are “annulled,” so balance columns become misleading for detecting fraud.

Hard constraint:

*   Do not use these columns for model features:
    *   `oldbalanceOrg`, `newbalanceOrig`, `oldbalanceDest`, `newbalanceDest`

Allowed for modeling/features:

*   `step`, `type`, `amount`, `nameOrig`, `nameDest`, (and any engineered features from these)

### 1.3 Primary user personas

*   Fraud Analyst / Investigator: triage alerts, investigate entities, disposition cases
*   Fraud Operations Lead: manage queues, KPIs, coverage, false positives
*   Model Risk / Compliance: validate model, monitor drift, approve changes
*   Platform / Data Engineer: maintain pipelines, availability, security
*   Product Owner: configure policies, thresholds, SLAs, roadmap

### 1.4 In-scope (Phase 1 - Local POC)

*   Transaction batch ingestion and processing
*   Feature computation and feature engineering (excluding forbidden columns)
*   **Rule-based fraud detection (deterministic rules)**
*   ML model scoring (scikit-learn/XGBoost)
*   Combined decision logic (ML + rules)
*   Alert generation and queue management
*   Basic case management
*   Investigator console: alerts, cases, entity views, explanation (SHAP + rule reasons)
*   SQLite database for local storage
*   No authentication (local demo only)

### 1.4b In-scope (Phase 2 - Production Deployment)

*   Real-time streaming transaction ingestion
*   Authentication and authorization (JWT/OAuth)
*   PostgreSQL database with proper migrations
*   Docker containerization and CI/CD
*   Cloud deployment (AWS/GCP/Azure)
*   Redis caching for features and sessions
*   Feature store integration
*   Model registry and versioning
*   Governance: audit trails, access control
*   Feedback loop: dispositions into training/monitoring

### 1.5 Out-of-scope (initially)

*   Network graph analytics at scale (Phase 3)
*   Customer communications and account actioning (block/hold) automation (Phase 3)
*   Multi-channel identity verification integrations (Phase 3)
*   Cross-institution consortium intelligence (future)

***

## 2) Functional requirements

## 2.1 Front-end (Investigation + Operations Console)

### 2.1.1 Core screens and workflows

#### A) Alert Queue (Triage)

Purpose: quickly sort and prioritize suspected fraud.

Requirements:

*   Queue views:
    *   “New”, “In Review”, “Pending Info”, “Escalated”, “Closed”
*   Sort / filter by:
    *   Risk score (descending)
    *   Transaction type
    *   Amount
    *   Time window (`step` mapped to date-time)
    *   Flag indicators (e.g., `isFlaggedFraud` / “High-value transfer rule hit”)
    *   Entity (nameOrig/nameDest)
*   Bulk actions:
    *   Assign to analyst, change status, add tags, export (controlled)
*   SLA indicators:
    *   Time since alert creation
    *   Breach warnings (e.g., 2h/6h/24h)

Acceptance criteria:

*   Analysts can triage 100 alerts in < 10 minutes with filters + bulk assignment.
*   95th percentile page load < 2 seconds for queue of 10k alerts.

#### B) Alert Detail (Explain + Decide)

Purpose: understand why the model flagged.

Requirements:

*   Transaction summary panel:
    *   `type`, `amount`, `step` (translated to timestamp), nameOrig, nameDest
*   Risk panel:
    *   Risk score (0–100)
    *   Decision band: Low/Med/High/Critical (configurable)
    *   Reason codes (top features / rule hits)
*   “Why flagged” explanation:
    *   Model explanation: top contributing engineered features (see model section)
    *   Rule explanation: “High-value transfer > 200,000” and any additional rules
*   Analyst actions:
    *   Create case / add to existing case
    *   Disposition: “Fraud”, “Not Fraud”, “Inconclusive”
    *   Add narrative notes
    *   Attach evidence artifacts (files/links) with retention policy
*   Audit log visible:
    *   who changed what and when

Acceptance criteria:

*   Every alert shows at least 3 reason codes (or “insufficient context” fallback).
*   All actions produce immutable audit events.

#### C) Case Management

Purpose: investigation lifecycle across multiple alerts/entities.

Requirements:

*   Case entity:
    *   ID, status, priority, assignee, created time, last updated
    *   Linked alerts and linked entities (orig/dest)
    *   Timeline of events (chronological)
    *   Notes and attachments
*   Workflow:
    *   Open → Investigating → Escalated → Resolved
    *   Required fields for closure: disposition, rationale, confidence, impacted amount
*   Collaboration:
    *   @mentions (optional), internal comments, assignment

Acceptance criteria:

*   A case can link N alerts and show timeline within 2 seconds up to N=500.

#### D) Entity Profile (Customer / Merchant)

Purpose: entity-centric view for pattern recognition.

Requirements:

*   Entity (nameOrig or nameDest) overview:
    *   Role: Sender/Receiver frequency
    *   Rolling aggregates: count, total amount, avg amount by type and window
    *   Top counterparties
    *   Risk history: prior alerts/cases and outcomes
*   Relationship view (lightweight in Phase 1):
    *   Top 10 counterparties graph-like list (Phase 3 for full graphs)

Acceptance criteria:

*   Entity profile computed using engineered features, not raw balances.

#### E) Operations Dashboard

Purpose: manage performance, coverage, and workload.

Requirements:

*   KPIs:
    *   Alert volume/day, by type
    *   True positive rate (TPR) and false positive rate (FPR) based on dispositions
    *   Average handling time
    *   Backlog and SLA breaches
    *   Score distribution drift over time
*   Threshold simulator:
    *   Slide threshold and view expected alert volume and estimated precision/recall (based on validation curves)

Acceptance criteria:

*   Dashboard supports last 30 days and last 24h slices.

### 2.1.2 Front-end non-functional requirements

**Phase 1 (Local POC)**:
*   No authentication required (local demo only)
*   Basic input validation
*   Simple logging for debugging
*   Accessibility: WCAG 2.1 AA (best effort)
*   Localization-ready: currency formatting, time zones

**Phase 2+ (Production)**:
*   Role-based access control (RBAC):
    *   Analyst vs Lead vs Admin vs Auditor (read-only)
*   Security:
    *   SSO integration (OIDC/SAML), MFA enforced by IdP
    *   Session timeouts, device posture optional
*   Auditability:
    *   all UI actions producing state changes create audit events

***

## 2.2 Back-end (Data, Scoring, Alerting, Case Platform)

### 2.2.1 Data ingestion and normalization

#### Inputs

*   Transaction events with schema fields:
    *   `step`, `type`, `amount`, `nameOrig`, `nameDest`
    *   (optional) ingestion metadata: eventId, ingestionTime, sourceSystem

Requirements:

*   Accept both:
    *   Streaming: event-by-event ingestion (real-time detection)
    *   Batch: daily/hourly file loads (backfill/training)

Validation rules:

*   Required fields present and non-null: step, type, amount, nameOrig, nameDest
*   type is one of: CASH-IN, CASH-OUT, DEBIT, PAYMENT, TRANSFER
*   amount >= 0; enforce upper bounds sanity rules (configurable)
*   step is integer \[1..744] in dataset; in production accept timestamp and derive step-like buckets

Data quality outputs:

*   Quarantine invalid events to a “dead-letter” store with reasons
*   Emit metrics: invalid rate, missing field counts

### 2.2.2 Feature computation layer

Because we can’t rely on balances, we need robust engineered behavioral features.

Requirements:

*   Feature families (computed per transaction using history windows):
    1.  Velocity features (per entity):
        *   tx\_count\_{1h,6h,24h,7d} for nameOrig and nameDest
        *   total\_amount\_{1h,6h,24h,7d}
        *   avg\_amount, max\_amount, std\_amount
    2.  Counterparty novelty:
        *   is\_new\_counterparty\_{24h,7d} (orig→dest pair unseen)
        *   unique\_counterparties\_count\_{24h,7d}
    3.  Transaction-type behavior:
        *   type\_ratio\_{window}: e.g., TRANSFER share of all tx
        *   CASH-OUT following TRANSFER within X hours (sequence flags)
    4.  Amount outlierness:
        *   zscore\_amount\_vs\_entity\_baseline
        *   percentile bucket by entity
    5.  Temporal patterns:
        *   hour-of-day (from step), day index
        *   unusual time for entity (distance from typical activity)
    6.  Pair-based risk memory:
        *   prior alerts on orig/dest/pair within 30 days
    7.  Rule hits:
        *   high\_value\_transfer = (type=TRANSFER and amount>200000)

Feature store requirements:

*   Online feature store for real-time scoring (low latency)
*   Offline feature store for training parity (“training/serving skew” controls)
*   Feature definitions versioned and tested

#*Phase 1 (Batch Processing)**:
*   Batch scoring API:
    *   Input: transaction event + derived features
    *   Output: risk score, risk band, reason codes, model version, timestamp
*   Process transactions in batches (CSV/JSON files)
*   Write results to SQLite database
*   Latency target: < 1 second per transaction (acceptable for demo)

**Phase 2+ (Real-time Processing)**:
*   Real-time scoring API:
    *   Input: streaming transaction event + derived features
    *   Output: risk score, risk band, reason codes, model version, timestamp
*   Latency and throughput targets (configurable):
    **Hybrid detection approach (Phase 1+)**:
    *   ML-based scoring (probabilistic risk assessment)
    *   Rule-based detection (deterministic fraud patterns)
    *   Combined decision logic

*   **Rule-Based Detection Engine**:
    *   High-value TRANSFER rule:
        *   Trigger: `type == 'TRANSFER' AND amount > 200,000`
        *   Reason code: "HIGH_VALUE_TRANSFER"
    *   Velocity-based rules:
        *   Trigger: Transaction count from same origin exceeds threshold in time window
        *   Example: `tx_count_24h > 10` or `total_amount_1h > 500,000`
        *   Reason codes: "HIGH_VELOCITY_COUNT", "HIGH_VELOCITY_AMOUNT"
    *   Sequence pattern rules:
        *   Trigger: TRANSFER followed by CASH-OUT within short time window
        *   Example: `type == 'CASH_OUT' AND prev_tx_type == 'TRANSFER' AND time_diff < 1_hour`
        *   Reason code: "SUSPICIOUS_SEQUENCE"
    *   Configurable thresholds per rule type

*   Decision policy engine that combines:
    *   ML model score threshold(s): Low/Medium/High risk bands
    *   Deterministic rules (as defined above)
    *   Suppression/allow lists (entity-level exceptions; governed) - Phase 2+
    
*   Alert creation:
    *   Create alert if:
        *   ML score >= threshold OR rule triggered OR both (configurable)
    *   Alert metadata includes:
        *   ML score and confidence
        *   List of triggered rules with reason codes
        *   Feature contributions (SHAP values)
    *   Deduplicate alerts (Phase 2+):
        *   If same orig-dest pair triggers within X minutes, merge or link
        
*   Prioritization:
    *   Priority = f(ML score, amount, triggered rules count, entity history)
    *   Critical: High ML score (>0.8) AND rule triggered
    *   High: High ML score OR multiple rules triggered
    *   Medium: Medium ML score (0.5-0.8) OR single rule triggered
    *   Low: Low ML score (<0.5) with no rule triggers
*   Decision policy engine that combines:
    *   Model score threshold(s)
    *   Deterministic rules (e.g., amount>200,000 TRANSFER)
    *   Suppression/allow lists (entity-level exceptions; governed)
*   Alert creation:
    *   Create alert if:
        *   score >= threshold OR rule hit OR both (configurable)
    *   Deduplicate alerts:
        *   If same orig-dest pair triggers within X minutes, merge or link
*   Prioritization:
    *   Priority = f(score, amount, rule hit, entity history)

### 2.2.5 Case management service

Requirements:

*   Entities:
    *   Alert, Case, Entity (orig/dest), Disposition, Notes, Attachments
*   Workflow state machine:
    *   enforce allowed transitions
*   Assignment and queues:
    *   automatic routing rules (e.g., by region, load balancing)
*   Audit trail:
    *   immutable event log of changes

### 2.2.6 Storage and data model

Requirements:

*   Transaction store:
    *   Raw events (immutable), normalized events
*   Feature store:
    *   online KV + offline lake/warehouse tables
*   Scored transactions:
    *   score outputs keyed by eventId
*   Alerts and cases:
    *   relational store for transactional consistency + search index for text/narratives

Retention:

*   Configurable retention (e.g., 7 years for audit logs in regulated settings)
*   PII strategy:
    *   In dataset, nameOrig/nameDest are identifiers; in production treat as sensitive
    *   Tokenize/pseudonymize identifiers in analytics contexts

### 2.2.7 APIs (high-level)

Provide REST/gRPC (internal) endpoints.

Example API contracts:

```http
POST /v1/score
Content-Type: application/json

{
  "eventId": "uuid",
  "timestamp": "2026-02-10T15:45:00Z",
  "step": 370,
  "type": "TRANSFER",
  "amount": 250000.0,
  "nameOrig": "C123...",
  "nameDest": "C456..."
}
```

Response:

```json
{
  "eventId": "uuid",
  "riskScore": 0.93,
  "riskBand": "CRITICAL",
  "decision": "ALERT",
  "reasonCodes": [
    {"code":"HIGH_VALUE_TRANSFER_RULE", "weight":0.35},
    {"code":"NEW_COUNTERPARTY_7D", "weight":0.18},
    {"code":"ORIG_VELOCITY_SPIKE_1H", "weight":0.14}
  ],
  "modelVersion": "fraud-xgb-2026-02-01",
  "policyVersion": "policy-2026-02-08",
  "scoredAt": "2026-02-10T15:45:00Z"
}
```

Case endpoints (examples):

*   `POST /v1/alerts/{id}/create-case`
*   `PATCH /v1/cases/{id}` (status, assignee, priority)
*   `POST /v1/cases/{id}/dispositions`
*   `GET /v1/entities/{entityId}/profile`

### 2.2.8 Observability and controls

Requirements:

*   Metrics:
    *   ingestion lag, scoring latency, alert volume, case backlog
    *   model score distribution drift, feature drift, null rates
*   Logging:
    *   structured logs, trace IDs across services
*   Alerting:
    *   SRE alerts for outages; model alerts for drift/performance degradation
*   Config management:
    *   thresholds, routing rules, suppression lists are versioned and audited
*   Kill-switch:
    *   ability to disable model-based alerts and fall back to rules only

***

## 3) Fraud detection model requirements

## 3.1 Modeling objective

*   Predict probability that a transaction is fraudulent (`isFraud`)
*   Support explainability for investigators
*   Optimize operational utility (precision at top-K, not just AUC)

Primary metrics:

*   Precision\@K (e.g., precision among top 1% highest scores)
*   Recall at fixed alert volume (alerts/day constraint)
*   PR-AUC (given typical class imbalance)
*   Cost-weighted utility (fraud amount vs investigation cost)

Secondary metrics:

*   ROC-AUC, calibration (Brier score), stability over time

## 3.2 Data preparation requirements

### 3.2.1 Feature restrictions and leakage controls

*   Exclude balance columns entirely.
*   Ensure no target leakage:
    *   Do not use any feature derived from `isFraud` or post-transaction outcomes.
*   Time-aware splitting:
    *   Use step-based splits to simulate production:
        *   Train: steps 1–500
        *   Validation: 501–620
        *   Test: 621–744
    *   Alternatively rolling-origin evaluation.

### 3.2.2 Handling identifiers

`nameOrig` and `nameDest` are high-cardinality. Requirements:

*   Do not one-hot encode raw IDs (sparse and leakage prone).
*   Use aggregated behavioral features from history windows:
    *   counts, sums, unique counterparties, novelty indicators
*   Optional: target encoding with strict time-based fit (only past data), but requires careful governance and skew checks.

### 3.2.3 Class imbalance strategy

*   Use:
    *   class weights / focal loss (if deep learning)
    *   downsampling negatives for training, but evaluate on true distribution
*   Keep calibration step (Platt/Isotonic) on validation set.

## 3.3 Candidate model approaches (requirements-driven)

Model must:

*   Support low-latency inference
*   Provide reason codes / feature contributions
*   Be robust under skew and drift

Recommended baseline:

*   Gradient boosted trees (e.g., XGBoost/LightGBM/CatBoost-like behavior)
*   Logistic regression baseline for interpretability and monitoring anchor

Sequence enhancement (Phase 2+):

*   Add explicit sequence features (TRANSFER → CASH-OUT within X hours)
*   Consider temporal models if warranted, but only if explainability and latency remain acceptable.

## 3.4 Explainability requirements

*   Generate reason codes for each alert:
    *   For tree models: SHAP-like top contributors or internal gain-based attributions
*   Map engineered features to investigator-friendly language:
    *   “Unusually high transfer amount for this sender”
    *   “New recipient not seen in last 7 days”
    *   “Spike in transaction volume in last hour”
*   Store explanation payload with the alert (immutable snapshot).

## 3.5 Thresholding and decision policy requirements

*   Support multi-threshold bands:
    *   e.g., CRITICAL >= 0.90, HIGH >= 0.75, MED >= 0.60
*   Support queue caps:
    *   “Do not generate more than N alerts/day; raise threshold automatically” (optional)
*   Support hard rules override:
    *   `isFlaggedFraud` equivalent: type=TRANSFER and amount > 200,000 must always alert (configurable)

## 3.6 Model validation and governance requirements

*   Model registry:
    *   model artifact, training data window, feature set version, hyperparameters
*   Offline validation report must include:
    *   metrics by transaction type (TRANSFER/CASH-OUT/etc.)
    *   stability across time slices (early/mid/late steps)
    *   calibration plots and recommended thresholds
*   Approval workflow:
    *   “Candidate” → “Staging” → “Production”
    *   roll-back supported

## 3.7 Monitoring and drift requirements

Production monitoring must include:

*   Feature drift:
    *   PSI/KS tests on key engineered features (amount distribution, velocity)
*   Score drift:
    *   score histogram shift, alert rate changes
*   Performance monitoring:
    *   Use investigator dispositions as proxy labels (with noise controls)
    *   Periodic backtesting when ground truth becomes available

Triggers:

*   If drift > threshold or precision proxy drops:
    *   alert Model Risk + Product
    *   auto-deploy to “rules-only” if severe and approved

## 3.8 Feedback loop requirements

*   Capture analyst dispositions and rationale codes:
    *   fraud confirmed, false positive, insufficient info
*   Use dispositions for:
    *   active learning candidate selection
    *   retraining dataset curation (with label quality checks)
*   Prevent training contamination:
    *   Only use dispositions after a cooling-off period (e.g., 7 days) and quality gating.

***

## 4) System architecture (logical)

### Real-time path (target)

1.  Ingest transaction event → validate → write raw store
2.  Compute online features (online feature store)
3.  Score via inference service
4.  Decision policy engine (rules + threshold)
5.  Create alert (and optionally case)
6.  Notify UI queue + metrics/monitoring

### Batch path

1.  Load daily/hourly events into lake/warehouse
2.  Offline feature computation (same definitions as online)
3.  Batch score + generate alerts
4.  Backfill UI + analytics tables

Key parity requirement:

*   Offline and online feature definitions must be identical and versioned.

***

## 5) Non-functional requirements (NFRs)

### Security & compliance

*   RBAC with least privilege
*   Encryption:
    *   in transit (TLS)
    *   at rest (KMS-managed keys)
*   Audit log:
    *   immutable, append-only storage (WORM-like)
*   Data minimization:
    *   avoid exposing raw identifiers broadly; use masked views in UI for non-privileged roles

### Reliability and performance

*   Availability target:
    *   99.9% for scoring + alerting services
*   Scalability:
    *   horizontal scaling for ingestion, scoring, feature reads
*   Back-pressure handling:
    *   queue-based ingestion, retries, dead-lettering

### Maintainability

*   Feature store and model deployment:
    *   CI/CD with tests: schema, feature parity, latency budget
*   Observability:
    *   tracing across eventId

***

## 6) MVP definition (what “done” looks like)

### MVP (6–10 weeks)

*   Batch ingestion + batch scoring daily (or hourly)
*   Baseline model (GBDT + LR benchmark)
*   Alert queue + alert detail + basic case creation
*   Manual dispositions captured
*   Audit logs, RBAC, basic dashboards

Success metrics (MVP)

*   Precision\@top alerts beats rule-only baseline by ≥ 30%
*   Analyst handling time reduced by ≥ 20% via explanations
*   < 2% ingestion failures, all quarantined with reasons

### Phase 2 (10–16 weeks)

*   Real-time scoring
*   Online feature store
*   Threshold simulator, queue caps
*   Drift monitoring + automated reporting
*   Enhanced entity profiles and sequence features

### Phase 3

*   Graph analytics, ring detection
*   Automated holds/blocks (with approvals)
*   Advanced investigation tooling (link analysis UI)

***

## 7) Detailed acceptance criteria

This section provides comprehensive, testable acceptance criteria organized by system component. Each criterion is written in "Given-When-Then" or measurable assertion format to enable clear validation and QA testing.

### 7.1 Front-end acceptance criteria

#### 7.1.1 Alert Queue (Triage)

**AC-FE-001: Queue view rendering and performance**
*   Given: An analyst navigates to the Alert Queue with 10,000 active alerts
*   When: The page loads
*   Then: The initial view (first 100 alerts) renders in < 2 seconds (P95)
*   And: Pagination controls are visible and functional
*   And: Total alert count is displayed and accurate

**AC-FE-002: Queue filtering capabilities**
*   Given: The Alert Queue contains alerts across all transaction types and risk bands
*   When: An analyst applies filters for:
    *   Risk score range (e.g., 80-100)
    *   Transaction type = "TRANSFER"
    *   Date range = last 24 hours
*   Then: Filtered results return in < 3 seconds
*   And: Result count updates to show "Showing X of Y alerts"
*   And: All displayed alerts match ALL applied filter criteria
*   And: Filter state persists across page refresh

**AC-FE-003: Multi-select and bulk actions**
*   Given: An analyst has filtered the queue to 50 alerts
*   When: Analyst selects "Select All" checkbox
*   Then: All 50 visible alerts are selected (visual confirmation via checkboxes)
*   When: Analyst clicks "Assign to..." and selects an analyst
*   Then: All 50 alerts are assigned with a single API call (bulk operation)
*   And: Success notification shows "50 alerts assigned to [name]"
*   And: Audit log records single bulk action with alert IDs list

**AC-FE-004: SLA breach indicators**
*   Given: Alerts have configurable SLA thresholds (e.g., 2h warning, 6h breach)
*   When: An alert has been in "New" status for 1h 50min
*   Then: Alert row displays yellow warning indicator
*   When: An alert exceeds 6h in "New" status
*   Then: Alert row displays red breach indicator
*   And: Alert appears in "SLA Breached" filter view

**AC-FE-005: Queue sorting**
*   Given: The Alert Queue is displayed
*   When: Analyst clicks column header "Risk Score"
*   Then: Alerts sort descending by risk score (highest first)
*   When: Analyst clicks "Risk Score" header again
*   Then: Alerts sort ascending by risk score
*   And: Sort direction indicator (↑/↓) displays correctly

#### 7.1.2 Alert Detail (Explain + Decide)

**AC-FE-006: Alert detail completeness**
*   Given: An analyst opens an alert detail page
*   Then: The following sections must all be visible without scrolling beyond the first viewport:
    *   Transaction summary (type, amount, timestamp, nameOrig, nameDest)
    *   Risk panel (score, band, model version)
    *   Reason codes section (minimum 3 codes or "insufficient context" message)
*   And: Action buttons (Create Case, Disposition, Add Notes) are always visible

**AC-FE-007: Reason codes display**
*   Given: The fraud model has generated explanation data for an alert
*   When: Alert detail loads
*   Then: At least 3 reason codes display, each showing:
    *   Plain-language description (e.g., "Unusually high transfer amount for this sender")
    *   Contribution weight or importance indicator (visual bar or percentage)
    *   Feature name reference (e.g., "orig_total_amount_24h")
*   And: Reason codes are ordered by contribution weight (descending)

**AC-FE-008: Rule hit indication**
*   Given: An alert was triggered by the "high_value_transfer" rule
*   When: Alert detail loads
*   Then: A distinct "Rule Hit" badge displays
*   And: Rule explanation shows: "High-value transfer > 200,000 threshold"
*   And: Rule name and threshold value are visible

**AC-FE-009: Disposition workflow**
*   Given: An analyst is viewing an alert
*   When: Analyst clicks "Disposition" button
*   Then: A modal/form appears requiring:
    *   Disposition selection (radio buttons): "Fraud", "Not Fraud", "Inconclusive"
    *   Rationale text field (minimum 10 characters required)
    *   Confidence level (dropdown): "High", "Medium", "Low"
*   When: Analyst submits with all required fields
*   Then: Alert status updates to "Closed"
*   And: Disposition timestamp and analyst ID are recorded
*   And: Success notification displays
*   And: Audit log entry created

**AC-FE-010: Audit history visibility**
*   Given: An alert has undergone multiple state changes
*   When: Analyst scrolls to Audit History section
*   Then: All state changes display in reverse chronological order, each showing:
    *   Timestamp (with timezone)
    *   User ID and display name
    *   Action (e.g., "Status changed: New → In Review")
    *   IP address (if security setting enabled)
*   And: Audit entries are immutable (no edit/delete options visible)

**AC-FE-011: Case creation from alert**
*   Given: An analyst is viewing an alert that is not yet linked to a case
*   When: Analyst clicks "Create Case"
*   Then: Case creation form pre-populates with:
    *   Alert ID in linked alerts list
    *   Entities (nameOrig, nameDest) in linked entities list
    *   Default priority based on alert risk band
*   When: Analyst submits the form
*   Then: New case is created and case ID displays
*   And: Alert detail updates to show case link
*   And: Analyst is redirected to Case Detail page

#### 7.1.3 Case Management

**AC-FE-012: Case detail structure**
*   Given: A case exists with 3 linked alerts and 2 linked entities
*   When: An analyst opens the case detail page
*   Then: The following sections are present and populated:
    *   Case header (ID, status, priority, assignee, created/updated times)
    *   Linked alerts section (list of 3 alerts with risk scores)
    *   Linked entities section (nameOrig, nameDest with role indicators)
    *   Timeline (chronological events across all linked alerts)
    *   Notes section
    *   Attachments section

**AC-FE-013: Case timeline performance**
*   Given: A case has 500 linked alerts generating 2,000 timeline events
*   When: Case detail page loads
*   Then: Timeline renders in < 2 seconds
*   And: Events display in strict chronological order
*   And: Pagination or infinite scroll is implemented for > 100 events

**AC-FE-014: Case workflow state enforcement**
*   Given: A case is in "Open" status
*   When: Analyst attempts to change status
*   Then: Allowed transitions are: "Investigating", "Escalated"
*   And: Disallowed transitions (e.g., directly to "Resolved") are grayed out or hidden
*   When: Case is in "Investigating" status
*   Then: Allowed transitions include: "Escalated", "Resolved"

**AC-FE-015: Case closure requirements**
*   Given: An analyst attempts to change case status to "Resolved"
*   When: The status change form opens
*   Then: The following fields are marked required:
    *   Disposition (dropdown)
    *   Rationale (text, min 50 characters)
    *   Confidence level (dropdown)
    *   Impacted amount (currency field, > 0)
*   When: Analyst attempts to submit without all required fields
*   Then: Validation errors display
*   And: Form does not submit
*   When: All required fields are populated and valid
*   Then: Case status updates to "Resolved"
*   And: Closure timestamp recorded

**AC-FE-016: Case notes and collaboration**
*   Given: An analyst is viewing a case
*   When: Analyst adds a note with text and clicks Save
*   Then: Note appears in Notes section with timestamp and author
*   And: Note is immutable once saved (no edit button visible)
*   When: Note contains @mention (e.g., "@analyst2")
*   Then: Mentioned user receives notification (if notification system enabled)

#### 7.1.4 Entity Profile

**AC-FE-017: Entity aggregation accuracy**
*   Given: An entity (nameOrig="C12345") has 50 transactions in the system
*   When: Analyst navigates to entity profile for C12345
*   Then: Profile displays rolling aggregates matching feature store values:
    *   Total transaction count (last 24h, 7d, 30d)
    *   Total amount (by time window)
    *   Average transaction amount (by time window)
    *   Transaction count by type (TRANSFER, CASH-OUT, etc.)
*   And: Aggregates exclude balance columns (only use step, type, amount, counterparties)

**AC-FE-018: Entity risk history**
*   Given: An entity has been flagged in 3 alerts (2 fraud, 1 false positive)
*   When: Entity profile loads
*   Then: Risk History section displays:
    *   List of 3 linked alerts with dates and outcomes
    *   Summary: "2 confirmed fraud, 1 false positive"
    *   Risk trend indicator (if available)

**AC-FE-019: Top counterparties display**
*   Given: An entity has transacted with 100 unique counterparties
*   When: Entity profile loads
*   Then: Top Counterparties section shows:
    *   Top 10 counterparties by transaction count
    *   Each counterparty shows: ID, transaction count, total amount
    *   Link to counterparty's entity profile

#### 7.1.5 Operations Dashboard

**AC-FE-020: KPI calculation accuracy**
*   Given: Operations Dashboard displays last 24h metrics
*   When: Dashboard loads
*   Then: The following KPIs display with values matching backend aggregations:
    *   Alert volume (total count)
    *   Alerts by type (TRANSFER, CASH-OUT counts)
    *   True positive rate (confirmed fraud / total dispositioned alerts)
    *   False positive rate (FP / (FP + TN))
    *   Average handling time (median time from alert creation to disposition)
    *   Current backlog (alerts in New + In Review states)
    *   SLA breach count

**AC-FE-021: Time range selector**
*   Given: Dashboard supports multiple time ranges
*   When: Analyst selects "Last 7 days" from time range dropdown
*   Then: All KPIs refresh to show 7-day aggregates
*   And: Charts update to 7-day view
*   And: Load time remains < 3 seconds

**AC-FE-022: Threshold simulator**
*   Given: The system has validation metrics for current model
*   When: Analyst opens Threshold Simulator tool
*   Then: Slider displays current threshold (e.g., 0.75)
*   When: Analyst moves slider to 0.85
*   Then: Simulator displays estimated impact:
    *   Expected alert volume reduction (percentage and count)
    *   Estimated precision (based on validation curve)
    *   Estimated recall (based on validation curve)
*   And: Chart shows precision-recall curve with current and simulated thresholds marked

### 7.2 Back-end acceptance criteria

#### 7.2.1 Data ingestion

**AC-BE-001: Transaction event validation**
*   Given: An event is submitted to the ingestion endpoint
*   When: The event contains all required fields (step, type, amount, nameOrig, nameDest)
*   Then: Event is accepted (HTTP 202) and written to raw event store
*   And: Response includes eventId and ingestionTimestamp
*   When: Event is missing required field (e.g., type is null)
*   Then: Event is rejected (HTTP 400)
*   And: Event is written to dead-letter queue with error code "MISSING_REQUIRED_FIELD"
*   And: Error response includes field name and validation rule

**AC-BE-002: Transaction type validation**
*   Given: An event is submitted with type field
*   When: type is one of: "CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"
*   Then: Event passes validation
*   When: type is "INVALID_TYPE"
*   Then: Event is rejected (HTTP 400)
*   And: Dead-letter entry created with error code "INVALID_TRANSACTION_TYPE"

**AC-BE-003: Amount validation**
*   Given: An event is submitted with amount field
*   When: amount >= 0 and amount <= 1,000,000,000 (configurable upper bound)
*   Then: Event passes validation
*   When: amount < 0
*   Then: Event is rejected with error code "INVALID_AMOUNT_NEGATIVE"
*   When: amount > upper bound
*   Then: Event is rejected with error code "INVALID_AMOUNT_EXCEEDS_LIMIT"

**AC-BE-004: Batch ingestion throughput**
*   Given: A batch file contains 100,000 transaction events
*   When: Batch ingestion job is triggered
*   Then: All events are validated and written within 5 minutes
*   And: Batch processing emits progress metrics every 10,000 events
*   And: Final summary shows: total processed, accepted, rejected counts
*   And: Rejected events are in dead-letter store with error reasons

**AC-BE-005: Streaming ingestion latency**
*   Given: Streaming ingestion is active
*   When: Events arrive at rate of 500 TPS
*   Then: P95 ingestion latency (event submitted to written in raw store) < 200ms
*   And: P99 ingestion latency < 500ms
*   And: No events are dropped (message broker guarantees at-least-once delivery)

**AC-BE-006: Dead-letter queue observability**
*   Given: Invalid events are being rejected
*   When: Dead-letter queue is queried
*   Then: Each dead-letter entry contains:
    *   Original event payload (full)
    *   Error code (e.g., "MISSING_REQUIRED_FIELD")
    *   Error message (human-readable)
    *   Timestamp
    *   Retry count (if applicable)
*   And: Dead-letter dashboard shows error code distribution

#### 7.2.2 Feature computation

**AC-BE-007: Feature computation correctness (velocity)**
*   Given: nameOrig="C123" has 5 transactions in last 1 hour with amounts [100, 200, 150, 300, 250]
*   When: Feature computation runs for new transaction from C123
*   Then: Features computed correctly:
    *   `orig_txn_count_1h = 5`
    *   `orig_total_amount_1h = 1000`
    *   `orig_avg_amount_1h = 200`
*   And: Computation uses only transactions where step falls within 1-hour window of current transaction

**AC-BE-008: Feature computation correctness (counterparty novelty)**
*   Given: nameOrig="C123" has transacted with nameDest in ["D1", "D2", "D3"] in last 7 days
*   When: New transaction from C123 to D4 is processed
*   Then: `orig_new_counterparty_7d = True`
*   When: New transaction from C123 to D2 is processed
*   Then: `orig_new_counterparty_7d = False`

**AC-BE-009: Feature store online/offline parity**
*   Given: Feature definitions version 1.2.0 is active
*   When: Offline feature batch computation runs
*   And: Online feature computation runs for same transaction
*   Then: All feature values match exactly (within floating-point precision tolerance of 1e-6)
*   And: Feature schema (names, types) is identical in both stores

**AC-BE-010: Feature computation latency (online)**
*   Given: A transaction event is received for real-time scoring
*   When: Online feature computation is triggered
*   Then: All features (30-50 features) are computed and returned in < 50ms (P95)
*   And: Feature store provides sub-10ms key-value lookups for entity aggregates

**AC-BE-011: Feature null handling**
*   Given: A transaction is from a new entity with no transaction history
*   When: Feature computation runs
*   Then: Aggregate features default to safe values:
    *   Count features = 0
    *   Amount features = 0
    *   Ratio features = 0 or null (with null handling in model)
*   And: No errors are raised
*   And: `is_new_entity` flag is set to True

**AC-BE-012: Balance column exclusion enforcement**
*   Given: Feature computation code is deployed
*   When: Feature computation runs
*   Then: Static analysis confirms no references to:
    *   `oldbalanceOrg`, `newbalanceOrig`, `oldbalanceDest`, `newbalanceDest`
*   And: Unit tests validate features are computed using only:
    *   `step`, `type`, `amount`, `nameOrig`, `nameDest`

#### 7.2.3 Scoring service

**AC-BE-013: Scoring API contract compliance**
*   Given: A scoring request is submitted with valid transaction + features
*   When: Scoring endpoint returns response
*   Then: Response contains all required fields:
    *   `eventId` (matches request)
    *   `riskScore` (float, 0.0 to 1.0)
    *   `riskBand` (string: "LOW", "MEDIUM", "HIGH", "CRITICAL")
    *   `decision` (string: "ALERT" or "PASS")
    *   `reasonCodes` (array, min 3 elements)
    *   `modelVersion` (string, e.g., "fraud-xgb-2026-02-01")
    *   `policyVersion` (string)
    *   `scoredAt` (ISO 8601 timestamp)

**AC-BE-014: Scoring latency (real-time)**
*   Given: Real-time scoring path is active
*   When: Scoring requests arrive at 500 TPS
*   Then: P95 scoring latency < 150ms (excluding feature computation)
*   And: P99 scoring latency < 300ms
*   And: No requests timeout or fail due to capacity constraints

**AC-BE-015: Scoring latency (batch)**
*   Given: Batch scoring job processes 1,000,000 transactions
*   When: Job is triggered
*   Then: Job completes within 30 minutes (average 556 TPS)
*   And: All scores are written to scored transactions table
*   And: Job emits progress metrics every 100,000 transactions

**AC-BE-016: Model version tracking**
*   Given: Model version "fraud-xgb-v2.1" is deployed to production
*   When: Scoring requests are processed
*   Then: All score responses include `modelVersion = "fraud-xgb-v2.1"`
*   And: Scored transaction records include modelVersion column for auditability
*   When: Model is updated to "fraud-xgb-v2.2"
*   Then: New scores use new version
*   And: Historical scores retain original model version in records

**AC-BE-017: Reason code generation**
*   Given: A transaction is scored and receives riskScore = 0.87
*   When: Reason codes are generated (via SHAP or equivalent)
*   Then: At least 3 reason codes are returned, each containing:
    *   `code` (feature identifier, e.g., "orig_velocity_spike_1h")
    *   `description` (plain-language, e.g., "Unusually high activity in last hour")
    *   `weight` or `contribution` (float)
*   And: Reason codes are ordered by absolute contribution (descending)
*   And: Sum of contribution weights approximates score magnitude

#### 7.2.4 Decisioning and alerting

**AC-BE-018: Threshold-based alert generation**
*   Given: Alert threshold is configured at 0.75
*   When: A transaction scores 0.76
*   Then: Alert is created with decision = "ALERT"
*   When: A transaction scores 0.74
*   Then: No alert is created, decision = "PASS"
*   And: Transaction is still recorded in scored transactions table

**AC-BE-019: Rule-based alert generation**
*   Given: "high_value_transfer" rule is enabled (type=TRANSFER, amount > 200,000)
*   When: A TRANSFER transaction with amount = 250,000 is processed
*   Then: Alert is created regardless of model score
*   And: Alert includes reasonCode with code = "HIGH_VALUE_TRANSFER_RULE"
*   And: Alert metadata includes ruleId and rule parameters

**AC-BE-020: Combined score and rule logic**
*   Given: Alert threshold = 0.75 and high_value_transfer rule is enabled
*   When: A TRANSFER with amount = 250,000 scores 0.60 (below threshold)
*   Then: Alert is still created (rule override)
*   And: Alert shows both model score (0.60) and rule hit
*   When: A TRANSFER with amount = 250,000 scores 0.85 (above threshold)
*   Then: Alert is created
*   And: Alert shows score AND rule hit in reason codes

**AC-BE-021: Alert deduplication**
*   Given: Deduplication window is 10 minutes for same orig-dest pair
*   When: Two transactions from C123 to D456 trigger alerts within 5 minutes
*   Then: Second alert is either:
    *   Merged into first alert (single alert, multiple transaction references), OR
    *   Linked to first alert (two alerts with sibling link)
*   And: Deduplication logic is documented and configurable

**AC-BE-022: Alert priority assignment**
*   Given: Priority formula is: f(score, amount, ruleHit, priorHistory)
*   When: Alert is created with:
    *   riskScore = 0.95
    *   amount = 500,000
    *   rule hit = True
    *   entity has 2 prior fraud dispositions
*   Then: Alert priority = "CRITICAL"
*   When: Alert is created with:
    *   riskScore = 0.60
    *   amount = 5,000
    *   rule hit = False
    *   entity has no prior history
*   Then: Alert priority = "LOW" or "MEDIUM"

#### 7.2.5 Case management service

**AC-BE-023: Case creation**
*   Given: An analyst creates a case via API
*   When: Request includes valid initial data (priority, assignee, linked alerts)
*   Then: Case is created (HTTP 201)
*   And: Response includes caseId
*   And: Case defaults to status = "Open"
*   And: Audit log entry created with action = "CASE_CREATED"

**AC-BE-024: Case state machine enforcement**
*   Given: Case is in status "Open"
*   When: API request attempts to transition to "Investigating"
*   Then: Transition succeeds (allowed)
*   When: API request attempts to transition to "Resolved" (skipping Investigating)
*   Then: Transition fails (HTTP 400)
*   And: Error message: "Invalid state transition: Open → Resolved"

**AC-BE-025: Case closure validation**
*   Given: Analyst attempts to close a case (status → "Resolved")
*   When: Required fields (disposition, rationale, confidence, impactedAmount) are missing
*   Then: Request fails (HTTP 400)
*   And: Error lists missing required fields
*   When: All required fields are provided
*   Then: Case status updates to "Resolved"
*   And: closedAt timestamp is set
*   And: closedBy userId is recorded

**AC-BE-026: Case query performance**
*   Given: System contains 100,000 cases
*   When: API query: GET /v1/cases?status=Open&assignee={userId}&limit=50
*   Then: Response returns in < 1 second
*   And: Results are correctly filtered and paginated

#### 7.2.6 Audit trail

**AC-BE-027: Audit log completeness**
*   Given: Any state-changing operation occurs (alert disposition, case status change, threshold update)
*   When: Operation completes
*   Then: Audit log entry is created containing:
    *   Timestamp (UTC, ISO 8601)
    *   User ID and username
    *   Action type (enum, e.g., "ALERT_DISPOSITIONED")
    *   Resource type and ID (e.g., "Alert", alertId)
    *   Old state (if applicable)
    *   New state
    *   IP address (optional, configurable)
    *   Session ID or trace ID

**AC-BE-028: Audit log immutability**
*   Given: Audit logs are stored in append-only store
*   When: Any attempt to UPDATE or DELETE audit log entry is made
*   Then: Operation fails (database-level constraint prevents modification)
*   And: Audit store supports only INSERT and SELECT operations

**AC-BE-029: Audit log queryability**
*   Given: Audit logs exist for last 90 days
*   When: Query: "Get all actions by userId=analyst123 in last 7 days"
*   Then: Results return in < 2 seconds
*   And: Results include all matching audit entries, ordered by timestamp descending

#### 7.2.7 Observability and monitoring

**AC-BE-030: Metrics emission**
*   Given: Production system is running
*   When: Transactions are processed
*   Then: The following metrics are emitted to monitoring system (1-minute granularity):
    *   `ingestion.events.total` (counter)
    *   `ingestion.events.invalid` (counter)
    *   `scoring.latency.p95` (histogram)
    *   `scoring.requests.total` (counter)
    *   `alerts.generated.total` (counter, labeled by priority)
    *   `feature_computation.latency.p95` (histogram)
    *   `cases.backlog.count` (gauge)

**AC-BE-031: Error rate alerting**
*   Given: Error rate threshold is 1% of requests
*   When: Scoring service error rate exceeds 1% over 5-minute window
*   Then: Alert fires to on-call engineer
*   And: Alert includes: service name, error rate, sample error messages

**AC-BE-032: Distributed tracing**
*   Given: A transaction flows through: ingestion → features → scoring → alerting
*   When: Request includes traceId header
*   Then: All service logs include traceId
*   And: Tracing system (e.g., Jaeger, Zipkin) shows complete request path with span durations

### 7.3 Model acceptance criteria

#### 7.3.1 Model performance metrics

**AC-ML-001: Time-based evaluation**
*   Given: Model is trained on steps 1-500
*   When: Model is evaluated on test set (steps 621-744)
*   Then: Evaluation report includes:
    *   Precision@1% (top 1% of scores)
    *   Precision@5%, Precision@10%
    *   Recall at fixed alert rate (e.g., 100 alerts/day equivalent)
    *   PR-AUC
    *   ROC-AUC
*   And: Metrics are computed separately for each transaction type (TRANSFER, CASH_OUT)

**AC-ML-002: Minimum performance thresholds**
*   Given: Model evaluation is complete
*   Then: The following minimum thresholds must be met for production deployment:
    *   Precision@1% >= 0.70 (70% of top-scored alerts are true fraud)
    *   Recall at 100 alerts/day >= 0.30 (30% of fraud captured within alert budget)
    *   PR-AUC >= 0.40 (given class imbalance)
    *   ROC-AUC >= 0.85

**AC-ML-003: Baseline comparison**
*   Given: A rule-only baseline model exists (high_value_transfer rule only)
*   When: New model is evaluated
*   Then: Precision@top alerts must exceed rule-only baseline by >= 30%
*   And: Comparison report shows side-by-side metrics

**AC-ML-004: Calibration validation**
*   Given: Model produces risk scores 0.0 to 1.0
*   When: Scores are binned into 10 deciles
*   Then: Observed fraud rate in each bin matches predicted score within ± 0.10 tolerance
*   And: Calibration plot (predicted vs. observed) is included in validation report
*   When: Calibration is poor (Brier score > 0.15)
*   Then: Model requires re-calibration (Platt scaling or isotonic regression) before deployment

**AC-ML-005: Stability across time slices**
*   Given: Test set spans steps 621-744 (124 time periods)
*   When: Test set is divided into early/mid/late tertiles
*   Then: ROC-AUC variance across tertiles < 0.05
*   And: If variance > 0.05, model drift investigation is triggered

#### 7.3.2 Feature engineering and restrictions

**AC-ML-006: Balance column exclusion verification**
*   Given: Model training code and feature pipeline
*   When: Code review and static analysis is performed
*   Then: No references to balance columns exist:
    *   `oldbalanceOrg`, `newbalanceOrig`, `oldbalanceDest`, `newbalanceDest`
*   And: Automated tests fail if any balance column is added to feature set

**AC-ML-007: Allowed feature verification**
*   Given: Model feature set is defined
*   When: Feature lineage is traced
*   Then: All features derive only from:
    *   `step`, `type`, `amount`, `nameOrig`, `nameDest`
    *   Engineered aggregations of the above (velocity, counterparty, sequences)
*   And: Feature documentation clearly maps each feature to source columns

**AC-ML-008: Time-based split validation**
*   Given: Model training dataset
*   When: Train/validation/test split is performed
*   Then: Split respects temporal ordering:
    *   Train: steps 1-500
    *   Validation: steps 501-620
    *   Test: steps 621-744
*   And: No data leakage: test transaction steps are strictly > validation steps

**AC-ML-009: Target leakage testing**
*   Given: Feature engineering pipeline
*   When: Features are computed for a transaction at step T
*   Then: Only historical data (steps < T) is used in feature aggregations
*   And: Automated tests verify no future information leakage
*   And: No features correlate > 0.99 with target (excluding expected patterns)

#### 7.3.3 Model explainability

**AC-ML-010: Explanation payload generation**
*   Given: A transaction is scored by the model
*   When: Explanation is generated (SHAP, feature importance, or equivalent)
*   Then: Explanation includes:
    *   Top 5 positive contributing features (increasing fraud risk)
    *   Top 5 negative contributing features (decreasing fraud risk)
    *   Contribution values (SHAP values or equivalent)
*   And: Contributions sum approximately to the score (additivity property)

**AC-ML-011: Explanation human-readability mapping**
*   Given: Model produces explanation with feature "orig_txn_count_1h"
*   When: Explanation is prepared for UI
*   Then: Feature is mapped to plain-language description:
    *   "Sender transaction count in last hour"
*   And: Mapping dictionary is maintained and versioned
*   And: All engineered features have mapped descriptions

**AC-ML-012: Explanation storage and immutability**
*   Given: An alert is created with explanation payload
*   When: Alert is stored
*   Then: Explanation JSON is stored in alert record (denormalized)
*   And: Explanation cannot be regenerated or modified post-alert creation (immutable snapshot)

#### 7.3.4 Model governance and deployment

**AC-ML-013: Model registry metadata**
*   Given: A model is trained and validated
*   When: Model is registered in model registry
*   Then: Registry entry includes:
    *   Model artifact (serialized model file)
    *   Model version ID (semantic version, e.g., 2.1.0)
    *   Training data window (step range)
    *   Feature set version
    *   Hyperparameters (full config)
    *   Performance metrics (from validation)
    *   Training timestamp and author
    *   Approval status (Candidate / Staging / Production)

**AC-ML-014: Model approval workflow**
*   Given: A model is in "Candidate" status in registry
*   When: Model Risk team reviews validation report
*   Then: Model can be promoted to "Staging"
*   When: Model is tested in staging environment and passes performance criteria
*   Then: Model can be promoted to "Production"
*   And: Each promotion requires approval from authorized role
*   And: Approval audit trail is recorded

**AC-ML-015: Model rollback capability**
*   Given: Model v2.1.0 is in production
*   When: Model v2.2.0 is deployed and causes performance degradation
*   Then: Rollback to v2.1.0 can be executed within 5 minutes
*   And: Rollback is tested in staging before production
*   And: All scores generated during v2.2.0 period retain model version metadata

**AC-ML-016: A/B testing support (Phase 2)**
*   Given: Two model versions exist (v2.1 and v2.2)
*   When: A/B test is configured (e.g., 90% traffic to v2.1, 10% to v2.2)
*   Then: Scoring service routes requests according to split
*   And: Alert records include model version used
*   And: Performance metrics are computed separately for each variant

#### 7.3.5 Model monitoring and drift detection

**AC-ML-017: Feature drift monitoring (PSI)**
*   Given: Model is in production for 7 days
*   When: Drift detection job runs
*   Then: Population Stability Index (PSI) is computed for each feature:
    *   Compare production feature distribution vs. training distribution
*   When: Any feature PSI > 0.25 (significant drift)
*   Then: Drift alert fires to Model Risk and Product teams
*   And: Drift dashboard highlights drifted features

**AC-ML-018: Score distribution drift monitoring**
*   Given: Model is in production
*   When: Daily monitoring runs
*   Then: Score distribution (histogram) is compared to baseline (first 7 days of production)
*   When: KS test statistic > 0.10 (distribution shift)
*   Then: Score drift alert fires
*   And: Alerting rate is monitored: if daily alert count deviates > 50% from baseline, investigate

**AC-ML-019: Performance proxy monitoring**
*   Given: Analyst dispositions provide proxy labels
*   When: 100+ dispositions are collected over 7 days
*   Then: Proxy precision is computed: confirmed_fraud / total_dispositioned_alerts
*   When: Proxy precision drops > 20% from baseline (e.g., from 0.70 to < 0.56)
*   Then: Performance degradation alert fires
*   And: Model re-evaluation is triggered

**AC-ML-020: Automated fallback to rules-only mode**
*   Given: Severe drift or performance degradation is detected
*   When: Fallback criteria are met (e.g., PSI > 0.40 or precision < 0.40)
*   And: Fallback is pre-approved by Model Risk (via policy configuration)
*   Then: System automatically switches to "rules-only" mode
*   And: Model-based alerts are suppressed
*   And: High-priority incident is created for human review

**AC-ML-021: Drift investigation runbook**
*   Given: Feature or score drift is detected
*   When: Drift alert fires
*   Then: Automated report is generated including:
    *   Drifted features and PSI values
    *   Sample production transactions with unusual feature values
    *   Comparison charts (production vs. baseline distributions)
    *   Recommended actions (re-calibration, retraining, feature engineering review)

#### 7.3.6 Feedback loop and retraining

**AC-ML-022: Disposition capture**
*   Given: Analyst dispositions an alert
*   When: Disposition is saved
*   Then: Disposition record includes:
    *   Alert ID and linked transaction ID
    *   Disposition value (Fraud / Not Fraud / Inconclusive)
    *   Confidence level
    *   Disposition timestamp
    *   Analyst ID

**AC-ML-023: Feedback dataset curation**
*   Given: 10,000 dispositions have been collected over 30 days
*   When: Retraining dataset is prepared
*   Then: Feedback curation pipeline:
    *   Excludes dispositions with confidence = "Low"
    *   Excludes "Inconclusive" dispositions
    *   Applies cooling-off period (only use dispositions older than 7 days)
    *   Flags potential label noise (e.g., same transaction type from entity disposed as both Fraud and Not Fraud)
*   And: Curated feedback dataset is versioned

**AC-ML-024: Retraining trigger criteria**
*   Given: Model is in production
*   When: Any of the following conditions are met:
    *   >= 5,000 new curated feedback labels available
    *   Feature drift PSI > 0.30 for 3+ consecutive days
    *   Performance proxy precision < 0.50
    *   30 days since last retraining (scheduled refresh)
*   Then: Retraining workflow is triggered

**AC-ML-025: Retraining validation**
*   Given: Retrained model candidate is produced
*   When: Validation is performed
*   Then: New model must meet all AC-ML-002 minimum thresholds
*   And: New model must outperform current production model by >= 5% on at least one key metric (Precision@1% or Recall@100/day)
*   When: New model does not meet criteria
*   Then: Model is not promoted; investigation is triggered to determine if data quality, feature drift, or other issues exist

***

## 8) Dataset-specific feature blueprint (concrete examples)

Given only `step`, `type`, `amount`, `nameOrig`, `nameDest`:

### Per-transaction features

*   `amount_log = log1p(amount)`
*   `type_onehot` (5 categories)
*   `hour = step % 24`, `day = step // 24`

### Sender (nameOrig) rolling features

*   `orig_txn_count_1h`, `_6h`, `_24h`
*   `orig_total_amount_24h`
*   `orig_avg_amount_7d`
*   `orig_unique_dest_24h`, `_7d`
*   `orig_transfer_ratio_24h` (#TRANSFER / total)

### Recipient (nameDest) rolling features

*   `dest_txn_count_1h`, `_24h`
*   `dest_unique_orig_7d`
*   `dest_incoming_amount_24h`

### Pair (orig, dest) rolling features

*   `pair_seen_7d` (boolean)
*   `pair_count_24h`, `pair_total_amount_7d`

### Sequence flags

*   `transfer_then_cashout_2h`:
    *   if orig performed TRANSFER and then CASH-OUT within 2 hours historically (requires ordering by step)

### Rule feature

*   `high_value_transfer = (type == TRANSFER and amount > 200000)`

***

## 9) Open questions (to finalize product decisions quickly)

1.  Operational objective: do we optimize for maximum fraud capture or bounded alert volume (fixed investigation capacity)?
2.  Real-time requirement: do we need sub-second alerting on day one, or is hourly batch acceptable initially?
3.  Enforcement: do we ever auto-hold transactions, or only alert for investigation?
4.  Disposition truth source: are analyst dispositions considered “ground truth,” or do we have confirmed fraud outcomes later?

***

If you want, I can also produce:

*   A concrete data model (DDL-style schemas) for alerts/cases/features
*   A full set of user stories with MoSCoW prioritization
*   A reference architecture diagram (logical + deployment view)
*   A model validation report template (model risk governance ready)

---

<!-- Generated by Copilot -->
<!-- Last updated: Phase 1 scope changed to local POC with SQLite, rule-based + ML detection, no authentication -->

