# Product Context

Below is a comprehensive set of product requirements for a financial crime detection program built around the PaySim-based mobile money dataset you described. I’m writing this as a Product Requirements Document (PRD) with explicit front-end, back-end, and fraud model requirements, plus non-functional requirements, acceptance criteria, and an MVP → scale roadmap.

***

## 1) Product intent and scope

### 1.1 Goal

Detect and operationalize investigation of fraudulent mobile money transactions (primarily TRANSFER and CASH-OUT patterns consistent with account depletion) using:

*   Real-time and batch scoring
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

### 1.4 In-scope (Phase 1–2)

*   Transaction ingestion (streaming + batch)
*   Feature computation, model scoring, and alert generation
*   Investigator console: alerts, cases, entity views, explanation
*   Feedback loop: dispositions into training/monitoring
*   Governance: audit trails, access control, model registry

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

*   Role-based access control (RBAC):
    *   Analyst vs Lead vs Admin vs Auditor (read-only)
*   Security:
    *   SSO integration (OIDC/SAML), MFA enforced by IdP
    *   Session timeouts, device posture optional
*   Accessibility:
    *   WCAG 2.1 AA
*   Localization-ready:
    *   currency formatting, time zones
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

### 2.2.3 Scoring service (Model inference)

Requirements:

*   Real-time scoring API:
    *   Input: transaction event + derived features
    *   Output: risk score, risk band, reason codes, model version, timestamp
*   Batch scoring:
    *   Process N transactions, write results to scored table, emit alerts
*   Latency and throughput targets (configurable):
    *   P95 < 150ms per event (excluding feature computation) for real-time path
    *   Support 500 TPS baseline, burst 5k TPS (scalable)

### 2.2.4 Decisioning and alert generation

Requirements:

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

## 7) Detailed acceptance criteria (samples)

### Front-end

*   Alert detail shows:
    *   score, band, ≥3 reason codes, rule hits, full audit history
*   Case closure requires:
    *   disposition + rationale + confidence level + impacted amount estimate
*   RBAC:
    *   Auditor can view but cannot modify alerts/cases

### Back-end

*   Ingestion:
    *   invalid events routed to dead-letter with error code
*   Scoring:
    *   returns modelVersion and policyVersion
*   Decisioning:
    *   high\_value\_transfer rule always produces alert when enabled
*   Audit:
    *   all state changes recorded, queryable by caseId

### Model

*   Time-based evaluation produced
*   Calibration within acceptable bounds:
    *   predicted risk bands correlate with observed fraud rates in test slice
*   Explainability payload stored with alert (immutable)

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
