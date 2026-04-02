/**
 * User operations via Supabase
 * Uses profiles + user_roles tables (existing Supabase schema)
 */

import { getSupabase } from '../lib/supabase.js';
import { logger } from '../utils/logger.js';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  companyName: string | null;
  gstNumber: string | null;
  phone: string | null;
  address: string | null;
  kycDocuments: string[] | null;
  approved: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function mapRowToUser(row: any, role: string): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    companyName: row.company_name,
    gstNumber: row.gst_number,
    phone: row.phone,
    address: row.address,
    kycDocuments: row.kyc_documents || [],
    approved: row.approved ?? false,
    approvalStatus: row.approval_status || 'pending',
    rejectionReason: row.rejection_reason,
    role: role || 'consumer',
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = getSupabase();

  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (profileError || !profile) {
    return null;
  }

  const { data: roleRow } = await (supabase as any)
    .from('user_roles')
    .select('role')
    .eq('user_id', profile.id)
    .limit(1)
    .single();

  return mapRowToUser(profile, roleRow?.role || 'consumer');
}

export async function getUserById(id: string): Promise<User | null> {
  const supabase = getSupabase();

  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  const { data: roleRow } = await (supabase as any)
    .from('user_roles')
    .select('role')
    .eq('user_id', id)
    .limit(1)
    .single();

  return mapRowToUser(profile, roleRow?.role || 'consumer');
}

export async function createUser(data: {
  email: string;
  password: string;
  fullName?: string;
  companyName?: string;
  gstNumber?: string;
  phone?: string;
  address?: string;
  role: string;
}): Promise<User> {
  const supabase = getSupabase();

  const approved =
    data.role === 'consumer' || data.role === 'admin';
  const approvalStatus =
    data.role === 'consumer' || data.role === 'admin' ? 'approved' : 'pending';

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName,
      company_name: data.companyName,
      gst_number: data.gstNumber,
      role: data.role,
      phone: data.phone,
      address: data.address,
    },
  });

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      throw new Error('Email already exists');
    }
    logger.error('Supabase createUser error:', authError);
    throw authError;
  }

  if (!authUser.user) {
    throw new Error('Failed to create user');
  }

  const userId = authUser.user.id;

  // Trigger creates profile + user_roles; update profile deterministically (no reliance on trigger defaults)
  const { error: updateError } = await (supabase as any)
    .from('profiles')
    .update({
      full_name: data.fullName || null,
      company_name: data.companyName || null,
      gst_number: data.gstNumber || null,
      phone: data.phone || null,
      address: data.address || null,
      approved,
      approval_status: approvalStatus,
    })
    .eq('id', userId);

  if (updateError) {
    logger.warn('Failed to update profile fields (non-critical):', updateError);
  }

  // Profiles + roles may appear a moment after auth user creation (trigger); retry briefly.
  let user: User | null = null;
  for (let i = 0; i < 10; i++) {
    user = await getUserById(userId);
    if (user) break;
    await sleep(200);
  }
  if (!user) {
    throw new Error('Failed to retrieve created user');
  }

  return user;
}

export async function verifyPassword(
  email: string,
  password: string
): Promise<User | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return null;
  }

  return getUserById(data.user.id);
}

export async function getAllUsers(filters?: {
  role?: string;
  approvalStatus?: string;
}): Promise<User[]> {
  const supabase = getSupabase();

  let profileQuery = (supabase as any).from('profiles').select('*').order('created_at', { ascending: false });

  if (filters?.approvalStatus) {
    profileQuery = profileQuery.eq('approval_status', filters.approvalStatus);
  }

  const { data: profiles, error } = await profileQuery;

  if (error) {
    logger.error('Error fetching profiles:', error);
    return [];
  }

  if (!profiles?.length) {
    return [];
  }

  const { data: roles } = await (supabase as any).from('user_roles').select('user_id, role');

  const roleMap = new Map<string, string>();
  for (const r of roles || []) {
    roleMap.set(r.user_id, r.role);
  }

  let users = profiles.map((p: any) => mapRowToUser(p, roleMap.get(p.id) || 'consumer'));

  if (filters?.role) {
    users = users.filter((u: User) => u.role === filters.role);
  }

  return users;
}

/**
 * Get or create consumer user from Supabase OAuth (Google). Used for Google sign-in.
 */
export async function ensureConsumerFromOAuth(
  authUserId: string,
  email: string,
  fullName?: string | null
): Promise<User> {
  let user = await getUserById(authUserId);
  if (user) {
    const supabase = getSupabase();
    const { data: roleRow } = await (supabase as any)
      .from('user_roles')
      .select('role')
      .eq('user_id', authUserId)
      .eq('role', 'consumer')
      .limit(1)
      .single();
    if (!roleRow) {
      await (supabase as any).from('user_roles').insert({ user_id: authUserId, role: 'consumer' });
    }
    // Google OAuth = consumer only; return user with consumer role for JWT
    return { ...user, role: 'consumer' };
  }

  // Profile may not exist (OAuth trigger might have failed); create/update
  const supabase = getSupabase();
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', authUserId)
    .single();

  if (!profile) {
    await (supabase as any).from('profiles').insert({
      id: authUserId,
      email,
      full_name: fullName || null,
      approved: true,
      approval_status: 'approved',
    });
  } else {
    await (supabase as any)
      .from('profiles')
      .update({ approved: true, approval_status: 'approved', full_name: fullName || profile.full_name })
      .eq('id', authUserId);
  }

  const { data: existingRole } = await (supabase as any)
    .from('user_roles')
    .select('role')
    .eq('user_id', authUserId)
    .limit(1)
    .single();

  if (!existingRole) {
    await (supabase as any).from('user_roles').insert({ user_id: authUserId, role: 'consumer' });
  }

  const u = await getUserById(authUserId);
  if (!u) throw new Error('Failed to retrieve OAuth user');
  return { ...u, role: 'consumer' };
}

export async function updateUserApproval(
  userId: string,
  approved: boolean,
  rejectionReason?: string
): Promise<User> {
  const supabase = getSupabase();

  const { error } = await (supabase as any)
    .from('profiles')
    .update({
      approved,
      approval_status: approved ? 'approved' : 'rejected',
      rejection_reason: rejectionReason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    logger.error('Error updating user approval:', error);
    throw new Error('User not found');
  }

  const user = await getUserById(userId);
  if (!user) {
    throw new Error('Failed to retrieve updated user');
  }

  return user;
}
