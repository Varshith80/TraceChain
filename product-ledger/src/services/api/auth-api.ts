/**
 * Authentication API Service
 * Handles authentication with the backend server
 */

import { logger } from '@/lib/logger';
import type { SignUpData, UserWithRole } from '@/types/auth';

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
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export interface SignInResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    fullName: string | null;
    companyName: string | null;
    role: string;
    approved: boolean;
    approvalStatus: string;
  };
  token: string;
}

export interface SignUpResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    fullName: string | null;
    companyName: string | null;
    role: string;
    approved: boolean;
    approvalStatus: string;
  };
  token: string;
}

export async function signUp(data: SignUpData): Promise<SignUpResponse> {
  const response = await apiRequest<SignUpResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (response.token) {
    localStorage.setItem('auth_token', response.token);
  }

  return response;
}

export async function signInWithGoogle(accessToken: string): Promise<SignInResponse> {
  const response = await apiRequest<SignInResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ accessToken }),
  });

  if (response.token) {
    localStorage.setItem('auth_token', response.token);
  }

  return response;
}

export async function signIn(email: string, password: string): Promise<SignInResponse> {
  const response = await apiRequest<SignInResponse>('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (response.token) {
    localStorage.setItem('auth_token', response.token);
  }

  return response;
}

export async function getCurrentUser(): Promise<UserWithRole> {
  const response = await apiRequest<any>('/auth/me');
  // Map backend response to frontend UserWithRole type
  return {
    id: response.id,
    email: response.email,
    fullName: response.fullName || null,
    companyName: response.companyName || null,
    gstNumber: response.gstNumber || null,
    phone: response.phone || null,
    address: response.address || null,
    kycDocuments: [],
    approved: response.approved,
    approvalStatus: response.approvalStatus,
    rejectionReason: response.rejectionReason || null,
    role: response.role,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}

export function signOut(): void {
  localStorage.removeItem('auth_token');
}

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export type { ApiError };

