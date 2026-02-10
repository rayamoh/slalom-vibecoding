// Type definitions for Fraud Detection System
// Based on API contract from parallel-dev-plan.md

export type TransactionType = 'CASH_IN' | 'CASH_OUT' | 'DEBIT' | 'PAYMENT' | 'TRANSFER';

export type AlertStatus = 'new' | 'in_review' | 'pending_info' | 'escalated' | 'closed';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type RiskBand = 'low' | 'medium' | 'high' | 'critical';

export type CaseStatus = 'open' | 'in_progress' | 'pending_review' | 'closed';

export type Disposition = 'fraud' | 'not_fraud' | 'inconclusive';

export type EntityRole = 'sender' | 'receiver' | 'both';

export interface Transaction {
  type: TransactionType;
  amount: number;
  step: number;
  timestamp: string; // ISO 8601 format
  nameOrig: string;
  nameDest: string;
}

export interface ShapValue {
  feature: string;
  value: number; // Positive = increases fraud risk, Negative = decreases fraud risk
}

export interface RuleTriggered {
  rule_id: string;
  rule_name: string;
  reason: string;
}

export interface Alert {
  id: string;
  transaction_id: string;
  status: AlertStatus;
  priority: Priority;

  // Transaction details
  transaction: Transaction;

  // ML scoring
  ml_score: number; // 0-1 (will be displayed as 0-100)
  ml_risk_band: RiskBand;
  ml_reason_codes: string[];
  shap_values: ShapValue[];

  // Rule-based detection
  rules_triggered: RuleTriggered[];

  // Metadata
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  assigned_to?: string;
  notes?: string;
}

export interface Case {
  id: string;
  title: string;
  status: CaseStatus;
  priority: Priority;
  alert_ids: string[];
  linked_alerts: string[]; // Same as alert_ids, for compatibility
  assigned_to?: string;
  disposition?: Disposition;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  notes: string;
}

export interface TransactionTypeCount {
  type: string;
  count: number;
}

export interface TopCounterparty {
  entity: string;
  count: number;
  total_amount: number;
}

export interface EntityProfile {
  entity_id: string; // nameOrig or nameDest
  role: EntityRole;

  // Statistics
  total_transactions: number;
  total_amount: number;
  avg_amount: number;
  transaction_types: TransactionTypeCount[];

  // Risk history
  prior_alerts: number;
  prior_cases: number;

  // Top counterparties
  top_counterparties: TopCounterparty[];
}

// API Request/Response types

export interface AlertsQueryParams {
  status?: AlertStatus;
  priority?: Priority;
  sort_by?: 'priority' | 'risk_score' | 'amount' | 'created_at';
  limit?: number;
  offset?: number;
}

export interface AlertUpdatePayload {
  status?: AlertStatus;
  notes?: string;
  assigned_to?: string;
}

export interface BulkAlertUpdatePayload {
  alert_ids: string[];
  updates: {
    status?: AlertStatus;
    assigned_to?: string;
  };
}

export interface CaseCreatePayload {
  priority: Priority;
  alert_ids?: string[];
  notes?: string;
}

export interface CaseUpdatePayload {
  status?: CaseStatus;
  priority?: Priority;
  notes?: string;
  disposition?: Disposition;
}

export interface LinkAlertsPayload {
  alert_ids: string[];
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// Feature name mapping for human-readable display
export const FEATURE_LABEL_MAP: Record<string, string> = {
  amount_zscore: 'Transaction amount (relative to baseline)',
  new_counterparty: 'New recipient (not seen in last 7 days)',
  new_counterparty_7d: 'New recipient (not seen in last 7 days)',
  new_counterparty_24h: 'New recipient (not seen in last 24 hours)',
  hour_of_day: 'Time of day (unusual hour)',
  tx_count_24h: 'Transaction count (last 24 hours)',
  orig_txn_count_1h: 'Sender transaction count (last hour)',
  orig_txn_count_6h: 'Sender transaction count (last 6 hours)',
  orig_txn_count_24h: 'Sender transaction count (last 24 hours)',
  orig_txn_count_7d: 'Sender transaction count (last 7 days)',
  orig_total_amount_1h: 'Sender total amount (last hour)',
  orig_total_amount_6h: 'Sender total amount (last 6 hours)',
  orig_total_amount_24h: 'Sender total amount (last 24 hours)',
  orig_total_amount_7d: 'Sender total amount (last 7 days)',
  orig_avg_amount_7d: 'Sender average amount (last 7 days)',
  orig_unique_dest_24h: 'Sender unique recipients (last 24 hours)',
  orig_unique_dest_7d: 'Sender unique recipients (last 7 days)',
  orig_transfer_ratio_24h: 'Sender transfer ratio (last 24 hours)',
  dest_txn_count_1h: 'Recipient transaction count (last hour)',
  dest_txn_count_24h: 'Recipient transaction count (last 24 hours)',
  dest_unique_orig_7d: 'Recipient unique senders (last 7 days)',
  dest_incoming_amount_24h: 'Recipient incoming amount (last 24 hours)',
  pair_seen_7d: 'Sender-recipient pair seen before (last 7 days)',
  pair_count_24h: 'Sender-recipient pair count (last 24 hours)',
  pair_total_amount_7d: 'Sender-recipient pair total amount (last 7 days)',
  transfer_then_cashout_2h: 'Transfer followed by cash-out within 2 hours',
  high_value_transfer: 'High-value transfer (> 200,000)',
};

// Priority and status color mapping
export const PRIORITY_COLORS: Record<Priority, string> = {
  critical: '#d32f2f', // Red
  high: '#f57c00', // Orange
  medium: '#fbc02d', // Yellow
  low: '#757575', // Gray
};

export const STATUS_COLORS: Record<AlertStatus, string> = {
  new: '#1976d2', // Blue
  in_review: '#fbc02d', // Yellow
  pending_info: '#7b1fa2', // Purple
  escalated: '#d32f2f', // Red
  closed: '#388e3c', // Green
};

export const CASE_STATUS_COLORS: Record<CaseStatus, string> = {
  open: '#1976d2', // Blue
  in_progress: '#fbc02d', // Yellow
  pending_review: '#7b1fa2', // Purple
  closed: '#388e3c', // Green
};

export const RISK_BAND_COLORS: Record<RiskBand, string> = {
  critical: '#d32f2f', // Red
  high: '#f57c00', // Orange
  medium: '#fbc02d', // Yellow
  low: '#757575', // Gray
};
