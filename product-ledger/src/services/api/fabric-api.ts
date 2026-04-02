/**
 * Fabric API Service
 * 
 * This service layer defines the API contract for interacting with the Hyperledger Fabric
 * blockchain backend. In production, this will call a REST API gateway that communicates
 * with Fabric chaincode.
 * 
 * For development/demo, mock data is returned.
 */

import { logger } from '@/lib/logger';
import { getAuthToken } from './auth-api';
import type {
  MegaQR,
  ChildQR,
  AuditLog,
  CounterfeitReport,
  CreateMegaQRRequest,
  CreateMegaQRResponse,
  GenerateChildQRsRequest,
  GenerateChildQRsResponse,
  CommitMessageRequest,
  CommitMessageResponse,
  RecallProductRequest,
  RecallProductResponse,
} from '@/types/fabric';

// API Base URL - Backend server URL
// Detect API URL - use same hostname as current page if accessed via IP
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  // If accessing via IP address, use same IP for backend
  const currentHost = window.location.hostname;
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    return `http://${currentHost}:3001/api`;
  }
  
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Get authentication header using JWT token from localStorage
 */
const getAuthHeader = (): HeadersInit => {
  const token = getAuthToken();
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Generic API error handler
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const authHeaders = getAuthHeader();
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new ApiError(response.status, error.error || error.message || 'Request failed');
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// ============ Mega QR APIs (Manufacturer) ============

export async function createMegaQR(data: CreateMegaQRRequest): Promise<CreateMegaQRResponse> {
  return apiRequest<CreateMegaQRResponse>('/mega', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMegaQR(megaID: string): Promise<MegaQR> {
  return apiRequest<MegaQR>(`/mega/${megaID}`);
}

export async function getManufacturerMegaQRs(manufacturerID: string): Promise<MegaQR[]> {
  return apiRequest<MegaQR[]>(`/mega?manufacturerID=${manufacturerID}`);
}

export async function generateChildQRs(data: GenerateChildQRsRequest): Promise<GenerateChildQRsResponse> {
  return apiRequest<GenerateChildQRsResponse>(`/mega/${data.megaID}/generate-children`, {
    method: 'POST',
    body: JSON.stringify({ count: data.count, childIDs: data.childIDs }),
  });
}

export async function commitMessageToMega(
  megaID: string,
  data: CommitMessageRequest
): Promise<CommitMessageResponse> {
  return apiRequest<CommitMessageResponse>(`/mega/${megaID}/commit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============ Child QR APIs ============

export async function getChildQR(childID: string): Promise<ChildQR> {
  return apiRequest<ChildQR>(`/child/${childID}`);
}

export async function getChildrenByMegaID(megaID: string): Promise<ChildQR[]> {
  return apiRequest<ChildQR[]>(`/mega/${megaID}/children`);
}

export async function getChildrenByMegaIDPaged(megaID: string, opts: { limit: number; offset?: number }): Promise<{
  megaID: string;
  total: number;
  offset: number;
  limit: number;
  children: ChildQR[];
}> {
  const offset = opts.offset ?? 0;
  return apiRequest(`/mega/${megaID}/children?limit=${opts.limit}&offset=${offset}`);
}

export async function commitMessageToChild(
  childID: string,
  data: CommitMessageRequest
): Promise<CommitMessageResponse> {
  return apiRequest<CommitMessageResponse>(`/child/${childID}/commit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============ Audit & Reporting APIs ============

export async function getAuditLogs(filters?: {
  startDate?: string;
  endDate?: string;
  userID?: string;
  targetType?: string;
  action?: string;
}): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.userID) params.append('userID', filters.userID);
  if (filters?.targetType) params.append('targetType', filters.targetType);
  if (filters?.action) params.append('action', filters.action);
  
  return apiRequest<AuditLog[]>(`/audit/logs?${params.toString()}`);
}

export async function submitCounterfeitReport(
  report: Omit<CounterfeitReport, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; reportID: string }> {
  return apiRequest(`/report/counterfeit`, {
    method: 'POST',
    body: JSON.stringify(report),
  });
}

export async function recallProduct(data: RecallProductRequest): Promise<RecallProductResponse> {
  return apiRequest<RecallProductResponse>(`/admin/recall`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============ Verification APIs ============

export async function verifyChildQR(childID: string): Promise<{
  valid: boolean;
  childQR?: ChildQR;
  megaQR?: MegaQR;
  hashMatch: boolean;
  message: string;
}> {
  return apiRequest(`/verify/${childID}`);
}

// Export types for external use
export type { ApiError };
