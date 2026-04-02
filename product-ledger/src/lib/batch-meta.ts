/**
 * MegaQR on-chain meta is map[string]string; frontend may also nest notes/customFields.
 * Use these helpers to read/write FSSAI-style batch fields without changing chaincode.
 */
import type { MegaQR, MegaQRMeta } from '@/types/fabric';

/** Keys stored in chaincode Meta map (flat string values) */
export const BATCH_META_KEYS = {
  productCategory: 'productCategory',
  netQuantity: 'netQuantity',
  ingredients: 'ingredients',
  allergenInfo: 'allergenInfo',
  vegIndicator: 'vegIndicator', // 'veg' | 'nonveg'
  fssaiLicense: 'fssaiLicense',
  manufacturingFacility: 'manufacturingFacility',
  storageInstructions: 'storageInstructions',
  countryOfOrigin: 'countryOfOrigin',
  lotSize: 'lotSize',
  nutritionalInfo: 'nutritionalInfo',
} as const;

export function getBatchMetaMap(mega: MegaQR): Record<string, string> {
  const out: Record<string, string> = {};
  const m = mega.meta as MegaQRMeta | Record<string, unknown> | null | undefined;
  if (!m || typeof m !== 'object') return out;

  const obj = m as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'certs' || k === 'customFields') continue;
    if (k === 'notes' && typeof v === 'string') {
      out.notes = v;
      continue;
    }
    if (typeof v === 'string' && v !== '') out[k] = v;
  }
  const cf = obj.customFields;
  if (cf && typeof cf === 'object') {
    for (const [k, v] of Object.entries(cf as Record<string, unknown>)) {
      if (typeof v === 'string' && v !== '') out[k] = v;
    }
  }
  return out;
}

export function batchMetaGet(mega: MegaQR, key: string): string | undefined {
  return getBatchMetaMap(mega)[key];
}

export function batchLotSizeDisplay(mega: MegaQR, fallback: number): number {
  const raw = batchMetaGet(mega, BATCH_META_KEYS.lotSize);
  if (raw) {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return fallback;
}

export function isVegFromMeta(mega: MegaQR): boolean | null {
  const v = batchMetaGet(mega, BATCH_META_KEYS.vegIndicator);
  if (v === 'veg') return true;
  if (v === 'nonveg') return false;
  return null;
}
