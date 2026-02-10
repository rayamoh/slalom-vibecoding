// Mock data for frontend development
// Developer 3 can work independently before backend is ready

import {
  Alert,
  Case,
  EntityProfile,
  AlertStatus,
  CaseStatus,
  Priority,
  TransactionType,
} from '../types';

// Helper to generate realistic timestamps
const hoursAgo = (hours: number): string => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
};

const minutesAgo = (minutes: number): string => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
};

// Mock Alerts (50 diverse scenarios)
export const mockAlerts: Alert[] = [
  // Critical Priority - High ML score + Rule triggered
  {
    id: 'A-001',
    transaction_id: 'TX-001',
    status: 'new',
    priority: 'critical',
    transaction: {
      type: 'TRANSFER',
      amount: 250000,
      step: 370,
      timestamp: minutesAgo(2),
      nameOrig: 'C123456789',
      nameDest: 'C987654321',
    },
    ml_score: 0.92,
    ml_risk_band: 'critical',
    ml_reason_codes: ['high_amount', 'new_counterparty', 'velocity_spike'],
    shap_values: [
      { feature: 'amount_zscore', value: 0.45 },
      { feature: 'new_counterparty_7d', value: 0.38 },
      { feature: 'orig_txn_count_1h', value: 0.14 },
      { feature: 'hour_of_day', value: 0.12 },
      { feature: 'pair_seen_7d', value: -0.08 },
    ],
    rules_triggered: [
      {
        rule_id: 'RULE_001',
        rule_name: 'HIGH_VALUE_TRANSFER',
        reason: 'Transfer amount exceeds $200,000 threshold',
      },
      {
        rule_id: 'RULE_003',
        rule_name: 'NEW_COUNTERPARTY',
        reason: 'First transaction between these entities in last 7 days',
      },
    ],
    created_at: minutesAgo(2),
    updated_at: minutesAgo(2),
  },

  // High Priority - High ML score OR multiple rules
  {
    id: 'A-002',
    transaction_id: 'TX-002',
    status: 'new',
    priority: 'high',
    transaction: {
      type: 'CASH_OUT',
      amount: 180000,
      step: 372,
      timestamp: minutesAgo(5),
      nameOrig: 'C234567890',
      nameDest: 'M876543210',
    },
    ml_score: 0.85,
    ml_risk_band: 'high',
    ml_reason_codes: ['cashout_after_transfer', 'high_amount'],
    shap_values: [
      { feature: 'transfer_then_cashout_2h', value: 0.52 },
      { feature: 'amount_zscore', value: 0.33 },
      { feature: 'dest_txn_count_1h', value: 0.18 },
      { feature: 'orig_total_amount_24h', value: -0.12 },
    ],
    rules_triggered: [
      {
        rule_id: 'RULE_004',
        rule_name: 'SUSPICIOUS_SEQUENCE',
        reason: 'CASH_OUT within 1 hour of TRANSFER from same origin',
      },
    ],
    created_at: minutesAgo(5),
    updated_at: minutesAgo(5),
  },

  // Medium Priority - Medium ML score
  {
    id: 'A-003',
    transaction_id: 'TX-003',
    status: 'in_review',
    priority: 'medium',
    transaction: {
      type: 'TRANSFER',
      amount: 120000,
      step: 375,
      timestamp: minutesAgo(10),
      nameOrig: 'C345678901',
      nameDest: 'C765432109',
    },
    ml_score: 0.68,
    ml_risk_band: 'medium',
    ml_reason_codes: ['unusual_time', 'amount_deviation'],
    shap_values: [
      { feature: 'hour_of_day', value: 0.28 },
      { feature: 'amount_zscore', value: 0.22 },
      { feature: 'orig_avg_amount_7d', value: 0.15 },
      { feature: 'pair_count_24h', value: -0.05 },
    ],
    rules_triggered: [],
    created_at: minutesAgo(10),
    updated_at: minutesAgo(8),
    assigned_to: 'analyst1',
    notes: 'Reviewing transaction pattern',
  },

  // Low Priority - Low ML score, no rules
  {
    id: 'A-004',
    transaction_id: 'TX-004',
    status: 'in_review',
    priority: 'low',
    transaction: {
      type: 'PAYMENT',
      amount: 5000,
      step: 378,
      timestamp: minutesAgo(15),
      nameOrig: 'C456789012',
      nameDest: 'M654321098',
    },
    ml_score: 0.42,
    ml_risk_band: 'low',
    ml_reason_codes: ['small_amount'],
    shap_values: [
      { feature: 'amount_zscore', value: -0.35 },
      { feature: 'pair_seen_7d', value: -0.22 },
      { feature: 'orig_txn_count_24h', value: 0.08 },
    ],
    rules_triggered: [],
    created_at: minutesAgo(15),
    updated_at: minutesAgo(12),
    assigned_to: 'analyst2',
  },

  // Additional alerts for testing pagination and filters
  ...generateAdditionalAlerts(46),
];

// Helper function to generate additional alerts for testing
function generateAdditionalAlerts(count: number): Alert[] {
  const alerts: Alert[] = [];
  const statuses: AlertStatus[] = ['new', 'in_review', 'pending_info', 'escalated', 'closed'];
  const priorities: Priority[] = ['low', 'medium', 'high', 'critical'];
  const types: TransactionType[] = ['CASH_IN', 'CASH_OUT', 'DEBIT', 'PAYMENT', 'TRANSFER'];

  for (let i = 0; i < count; i++) {
    const num = i + 5;
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    const txType = types[i % types.length];
    const riskScore = Math.random();

    alerts.push({
      id: `A-${num.toString().padStart(3, '0')}`,
      transaction_id: `TX-${num.toString().padStart(3, '0')}`,
      status,
      priority,
      transaction: {
        type: txType,
        amount: Math.floor(Math.random() * 300000) + 1000,
        step: 300 + i,
        timestamp: hoursAgo(i % 24),
        nameOrig: `C${Math.floor(Math.random() * 1000000000)}`,
        nameDest: `C${Math.floor(Math.random() * 1000000000)}`,
      },
      ml_score: riskScore,
      ml_risk_band: riskScore > 0.75 ? 'high' : riskScore > 0.5 ? 'medium' : 'low',
      ml_reason_codes: ['feature_' + (i % 3)],
      shap_values: [
        { feature: 'amount_zscore', value: (Math.random() - 0.5) * 0.8 },
        { feature: 'new_counterparty_7d', value: (Math.random() - 0.5) * 0.6 },
        { feature: 'orig_txn_count_1h', value: (Math.random() - 0.5) * 0.4 },
      ],
      rules_triggered:
        priority === 'critical' && Math.random() > 0.5
          ? [
            {
              rule_id: 'RULE_001',
              rule_name: 'HIGH_VALUE_TRANSFER',
              reason: 'Amount exceeds threshold',
            },
          ]
          : [],
      created_at: hoursAgo(i % 48),
      updated_at: hoursAgo(i % 24),
      assigned_to: status !== 'new' ? `analyst${(i % 3) + 1}` : undefined,
      notes: status === 'closed' ? 'Investigation complete' : undefined,
    });
  }

  return alerts;
}

// Mock Cases (20 cases)
export const mockCases: Case[] = [
  {
    id: 'CASE-001',
    title: 'Suspected Fraud Ring - High Value Transfers',
    status: 'open',
    priority: 'critical',
    alert_ids: ['A-001', 'A-002'],
    linked_alerts: ['A-001', 'A-002'],
    assigned_to: 'analyst1',
   created_at: hoursAgo(2),
    updated_at: hoursAgo(1),
    notes: 'Investigating potential fraud ring - high-value transfers followed by cash-outs',
  },
  {
    id: 'CASE-002',
    title: 'Unusual Time Transfer Investigation',
    status: 'in_progress',
    priority: 'high',
    alert_ids: ['A-003'],
    linked_alerts: ['A-003'],
    assigned_to: 'analyst2',
    created_at: hoursAgo(10),
    updated_at: hoursAgo(8),
    notes: 'Single suspicious transfer at unusual time',
  },
  {
    id: 'CASE-003',
    title: 'Legitimate Payment Verification',
    status: 'closed',
    priority: 'medium',
    alert_ids: ['A-004'],
    linked_alerts: ['A-004'],
    assigned_to: 'analyst1',
    disposition: 'not_fraud',
    created_at: hoursAgo(24),
    updated_at: hoursAgo(12),
    notes: 'Legitimate payment confirmed with customer',
  },
  ...generateAdditionalCases(17),
];

function generateAdditionalCases(count: number): Case[] {
  const cases: Case[] = [];
  const statuses: CaseStatus[] = [
    'open',
    'in_progress',
    'pending_review',
    'closed',
  ];
  const priorities: Priority[] = ['low', 'medium', 'high', 'critical'];
  const analysts = ['analyst1', 'analyst2', 'analyst3', undefined];

  for (let i = 0; i < count; i++) {
    const num = i + 4;
    const status = statuses[i % statuses.length];

    cases.push({
      id: `CASE-${num.toString().padStart(3, '0')}`,
      title: `Case ${num} - ${status.replace('_', ' ').toUpperCase()}`,
      status,
      priority: priorities[i % priorities.length],
      alert_ids: [`A-${(num * 2).toString().padStart(3, '0')}`],
      linked_alerts: [`A-${(num * 2).toString().padStart(3, '0')}`],
      assigned_to: analysts[i % analysts.length],
      disposition:
        status === 'closed'
          ? i % 2 === 0
            ? 'fraud'
            : 'not_fraud'
          : undefined,
      created_at: hoursAgo((i % 72) + 1),
      updated_at: hoursAgo(i % 48),
      notes: `Case ${num} - ${status}`,
    });
  }

  return cases;
}

// Mock Entity Profiles
export const mockEntityProfiles: Record<string, EntityProfile> = {
  C123456789: {
    entity_id: 'C123456789',
    role: 'sender',
    total_transactions: 45,
    total_amount: 1250000,
    avg_amount: 27777,
    transaction_types: [
      { type: 'TRANSFER', count: 25 },
      { type: 'PAYMENT', count: 15 },
      { type: 'CASH_OUT', count: 5 },
    ],
    prior_alerts: 3,
    prior_cases: 1,
    top_counterparties: [
      { entity: 'C987654321', count: 12, total_amount: 450000 },
      { entity: 'M876543210', count: 8, total_amount: 280000 },
      { entity: 'C765432109', count: 6, total_amount: 150000 },
    ],
  },
  C987654321: {
    entity_id: 'C987654321',
    role: 'receiver',
    total_transactions: 32,
    total_amount: 890000,
    avg_amount: 27812,
    transaction_types: [
      { type: 'TRANSFER', count: 20 },
      { type: 'PAYMENT', count: 12 },
    ],
    prior_alerts: 1,
    prior_cases: 0,
    top_counterparties: [
      { entity: 'C123456789', count: 12, total_amount: 450000 },
      { entity: 'C234567890', count: 10, total_amount: 320000 },
    ],
  },
};

// Mock search/filter functions (simulate API behavior)
export const filterAlerts = (
  alerts: Alert[],
  filters: {
    status?: AlertStatus;
    priority?: Priority;
    sort_by?: 'priority' | 'risk_score' | 'amount' | 'created_at';
    limit?: number;
    offset?: number;
  }
): { data: Alert[]; total: number } => {
  let filtered = [...alerts];

  // Apply filters
  if (filters.status) {
    filtered = filtered.filter((a) => a.status === filters.status);
  }
  if (filters.priority) {
    filtered = filtered.filter((a) => a.priority === filters.priority);
  }

  // Apply sorting
  if (filters.sort_by) {
    filtered.sort((a, b) => {
      switch (filters.sort_by) {
        case 'priority':
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'risk_score':
          return b.ml_score - a.ml_score;
        case 'amount':
          return b.transaction.amount - a.transaction.amount;
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }

  const total = filtered.length;
  const offset = filters.offset || 0;
  const limit = filters.limit || 25;

  // Apply pagination
  filtered = filtered.slice(offset, offset + limit);

  return { data: filtered, total };
};
