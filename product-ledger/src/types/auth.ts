import type { AppRole } from './fabric';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  companyName?: string;
  gstNumber?: string;
  phone?: string;
  address?: string;
  kycDocuments?: string[];
  approved: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithRole extends UserProfile {
  role: AppRole;
}

export interface SignUpData {
  email: string;
  password: string;
  role: AppRole;
  fullName: string;
  companyName?: string;
  gstNumber?: string;
  phone?: string;
  address?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthState {
  user: UserWithRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}