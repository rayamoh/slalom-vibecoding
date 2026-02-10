// API Client for Fraud Detection System
// Supports both mock data (Phase 1 Week 1) and real backend API (Phase 1 Week 2+)

import axios, { AxiosInstance } from 'axios';
import {
  Alert,
  Case,
  EntityProfile,
  AlertsQueryParams,
  AlertUpdatePayload,
  BulkAlertUpdatePayload,
  CaseCreatePayload,
  CaseUpdatePayload,
  LinkAlertsPayload,
  PaginatedResponse,
} from '../types';
import {
  mockAlerts,
  mockCases,
  mockEntityProfiles,
  filterAlerts,
} from './mockData';

// Configuration
const USE_MOCK_DATA = true; // Set to false when backend is ready
const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simulated network delay for mock API (feels more realistic)
const simulateDelay = (ms: number = 300): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// ============================================================================
// Alert API
// ============================================================================

export const alertApi = {
  /**
   * Get list of alerts with optional filters
   */
  async getAlerts(params?: AlertsQueryParams): Promise<PaginatedResponse<Alert>> {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      const result = filterAlerts(mockAlerts, params || {});
      return {
        data: result.data,
        total: result.total,
        limit: params?.limit || 25,
        offset: params?.offset || 0,
      };
    }

    const response = await axiosInstance.get<PaginatedResponse<Alert>>('/alerts', {
      params,
    });
    return response.data;
  },

  /**
   * Get single alert by ID
   */
  async getAlertById(id: string): Promise<Alert | null> {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockAlerts.find((a) => a.id === id) || null;
    }

    const response = await axiosInstance.get<Alert>(`/alerts/${id}`);
    return response.data;
  },

  /**
   * Update an alert
   */
  async updateAlert(id: string, payload: AlertUpdatePayload): Promise<Alert> {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      const alert = mockAlerts.find((a) => a.id === id);
      if (!alert) {
        throw new Error(`Alert ${id} not found`);
      }
      // Simulate update
      const updated = { ...alert, ...payload, updated_at: new Date().toISOString() };
      const index = mockAlerts.findIndex((a) => a.id === id);
      mockAlerts[index] = updated;
      return updated;
    }

    const response = await axiosInstance.patch<Alert>(`/alerts/${id}`, payload);
    return response.data;
  },

  /**
   * Bulk update multiple alerts
   */
  async bulkUpdateAlerts(payload: BulkAlertUpdatePayload): Promise<{ updated: number }> {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      // Simulate bulk update
      payload.alert_ids.forEach((id) => {
        const index = mockAlerts.findIndex((a) => a.id === id);
        if (index !== -1) {
          mockAlerts[index] = {
            ...mockAlerts[index],
            ...payload.updates,
            updated_at: new Date().toISOString(),
          };
        }
      });
      return { updated: payload.alert_ids.length };
    }

    const response = await axiosInstance.post<{ updated: number }>(
      '/alerts/bulk-update',
      payload
    );
    return response.data;
  },
};

// ============================================================================
// Case API
// ============================================================================

export const caseApi = {
  /**
   * Get list of cases
   */
  async getCases(params?: {
    status?: string;
    priority?: string;
    sort_by?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Case>> {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      let filtered = [...mockCases];

      if (params?.status) {
        filtered = filtered.filter((c) => c.status === params.status);
      }

      if (params?.priority) {
        filtered = filtered.filter((c) => c.priority === params.priority);
      }

      // Sort
      if (params?.sort_by) {
        filtered.sort((a, b) => {
          switch (params.sort_by) {
            case 'priority':
              const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            case 'created_at':
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'updated_at':
              return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
            default:
              return 0;
          }
        });
      }

      const total = filtered.length;
      const offset = params?.offset || 0;
      const limit = params?.limit || 25;

      filtered = filtered.slice(offset, offset + limit);

      return {
        data: filtered,
        total,
        limit,
        offset,
      };
    }

    const response = await axiosInstance.get<PaginatedResponse<Case>>('/cases', {
      params,
    });
    return response.data;
  },

  /**
   * Get single case by ID
   */
  async getCaseById(id: string): Promise<Case | null> {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockCases.find((c) => c.id === id) || null;
    }

    const response = await axiosInstance.get<Case>(`/cases/${id}`);
    return response.data;
  },

  /**
   * Create new case
   */
  async createCase(payload: CaseCreatePayload): Promise<Case> {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      const newCase: Case = {
        id: `CASE-${(mockCases.length + 1).toString().padStart(3, '0')}`,
        title: `New Case ${mockCases.length + 1}`,
        status: 'open',
        priority: payload.priority,
        alert_ids: payload.alert_ids || [],
        linked_alerts: payload.alert_ids || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: payload.notes || '',
      };
      mockCases.push(newCase);
      return newCase;
    }

    const response = await axiosInstance.post<Case>('/cases', payload);
    return response.data;
  },

  /**
   * Update case
   */
  async updateCase(id: string, payload: CaseUpdatePayload): Promise<Case> {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      const caseItem = mockCases.find((c) => c.id === id);
      if (!caseItem) {
        throw new Error(`Case ${id} not found`);
      }
      const updated = { ...caseItem, ...payload, updated_at: new Date().toISOString() };
      const index = mockCases.findIndex((c) => c.id === id);
      mockCases[index] = updated;
      return updated;
    }

    const response = await axiosInstance.patch<Case>(`/cases/${id}`, payload);
    return response.data;
  },

  /**
   * Link alerts to case
   */
  async linkAlerts(caseId: string, payload: LinkAlertsPayload): Promise<{ success: boolean }> {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      const caseItem = mockCases.find((c) => c.id === caseId);
      if (!caseItem) {
        throw new Error(`Case ${caseId} not found`);
      }
      caseItem.alert_ids = [...caseItem.alert_ids, ...payload.alert_ids];
      caseItem.updated_at = new Date().toISOString();
      return { success: true };
    }

    const response = await axiosInstance.post<{ success: boolean }>(
      `/cases/${caseId}/alerts`,
      payload
    );
    return response.data;
  },
};

// ============================================================================
// Entity API
// ============================================================================

export const entityApi = {
  /**
   * Get entity profile by ID
   */
  async getEntityProfile(entityId: string): Promise<EntityProfile | null> {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockEntityProfiles[entityId] || null;
    }

    const response = await axiosInstance.get<EntityProfile>(`/entities/${entityId}`);
    return response.data;
  },
};

// ============================================================================
// Export combined API
// ============================================================================

const api = {
  alerts: alertApi,
  cases: caseApi,
  entities: entityApi,
};

export default api;
