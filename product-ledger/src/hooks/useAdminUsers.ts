import { useState, useEffect } from 'react';
import { getAuthToken } from '@/services/api/auth-api';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { AppRole } from '@/types/fabric';

// Detect API URL - use same hostname as current page if accessed via IP
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  const currentHost = window.location.hostname;
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    return `http://${currentHost}:3001/api`;
  }
  
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  company_name: string | null;
  gst_number: string | null;
  phone: string | null;
  address: string | null;
  approved: boolean | null;
  approval_status: string | null;
  created_at: string | null;
  kyc_documents: string[] | null;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      
      const combinedUsers: AdminUser[] = data.map((user: any) => ({
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role as AppRole,
        company_name: user.companyName,
        gst_number: user.gstNumber,
        phone: user.phone,
        address: user.address,
        approved: user.approved,
        approval_status: user.approvalStatus,
        created_at: user.createdAt,
        kyc_documents: [],
      }));

      setUsers(combinedUsers);
    } catch (err) {
      logger.error('Failed to fetch users', err);
      setError('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve user');
      }

      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, approved: true, approval_status: 'approved' } 
          : u
      ));
      
      toast.success('User approved successfully');
    } catch (err) {
      logger.error('Failed to approve user', err);
      toast.error('Failed to approve user');
      throw err;
    }
  };

  const rejectUser = async (userId: string, reason: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved: false, rejectionReason: reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject user');
      }

      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, approved: false, approval_status: 'rejected' } 
          : u
      ));
      
      toast.success('User rejected');
    } catch (err) {
      logger.error('Failed to reject user', err);
      toast.error('Failed to reject user');
      throw err;
    }
  };

  const revokeApproval = async (userId: string) => {
    const confirmed = window.confirm('Are you sure you want to revoke this user\'s approval?');
    if (!confirmed) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved: false, rejectionReason: 'Approval revoked' }),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke approval');
      }

      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, approved: false, approval_status: 'pending' } 
          : u
      ));
      
      toast.success('User approval revoked');
    } catch (err) {
      logger.error('Failed to revoke approval', err);
      toast.error('Failed to revoke approval');
      throw err;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const pendingUsers = users.filter(u => u.approval_status === 'pending' && u.role !== 'consumer');
  const approvedUsers = users.filter(u => u.approved === true);
  const rejectedUsers = users.filter(u => u.approval_status === 'rejected');

  return {
    users,
    pendingUsers,
    approvedUsers,
    rejectedUsers,
    isLoading,
    error,
    refetch: fetchUsers,
    approveUser,
    rejectUser,
    revokeApproval,
  };
}
