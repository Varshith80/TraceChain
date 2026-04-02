/**
 * API Key Management (Stub - No local DB)
 *
 * API keys require an api_keys table in Supabase.
 * Until that table exists, API key auth is disabled and management returns empty/errors.
 */

import * as crypto from 'crypto';

export interface APIKey {
  id: string;
  manufacturerId: string;
  keyHash: string;
  keyPrefix: string;
  name: string;
  description?: string;
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  rateLimitPerDay: number;
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  revokedAt?: string;
  revokedReason?: string;
}

export interface APIKeyWithPlaintext {
  apiKey: APIKey;
  plaintextKey: string;
}

const NOT_CONFIGURED = 'API key management requires api_keys table in Supabase.';

export function generateAPIKey(): string {
  return `pl_${crypto.randomBytes(24).toString('base64url')}`;
}

export function getKeyPrefix(key: string): string {
  return key.substring(0, 8);
}

export async function validateAPIKey(_plaintextKey: string): Promise<APIKey | null> {
  return null;
}

export async function createAPIKey(
  _manufacturerId: string,
  _name: string,
  _description?: string,
  _rateLimits?: object,
  _expiresAt?: string
): Promise<APIKeyWithPlaintext> {
  throw new Error(NOT_CONFIGURED);
}

export async function getAPIKeyById(_id: string): Promise<APIKey | null> {
  return null;
}

export async function getAPIKeysByManufacturer(_manufacturerId: string): Promise<APIKey[]> {
  return [];
}

export async function revokeAPIKey(_id: string, _reason?: string): Promise<void> {
  throw new Error(NOT_CONFIGURED);
}

export async function updateAPIKeyRateLimits(
  _id: string,
  _rateLimits: { perMinute?: number; perHour?: number; perDay?: number }
): Promise<void> {
  throw new Error(NOT_CONFIGURED);
}

export async function logAPIKeyUsage(
  _apiKeyId: string,
  _manufacturerId: string,
  _endpoint: string,
  _method: string,
  _ipAddress?: string,
  _userAgent?: string,
  _statusCode?: number,
  _responseTimeMs?: number
): Promise<void> {
  // No-op
}
