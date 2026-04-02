/**
 * Mock data for development and demo mode
 * This simulates Fabric ledger state when the real API is unavailable
 */

import type { MegaQR, ChildQR, AuditLog, CommittedMessage } from '@/types/fabric';

const now = new Date().toISOString();
const yesterday = new Date(Date.now() - 86400000).toISOString();
const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString();

export const mockCommittedMessages: CommittedMessage[] = [
  { msg: 'Packed', actorID: 'manufacturer-001', ts: lastWeek },
  { msg: 'Quality Checked', actorID: 'manufacturer-001', ts: lastWeek },
  { msg: 'Shipped', actorID: 'manufacturer-001', ts: yesterday },
  { msg: 'Received at Retailer', actorID: 'retailer-001', ts: now },
];

export const mockMegaQRs: MegaQR[] = [
  {
    objectType: 'MegaQR',
    megaID: 'MEGA-2025-0001',
    megaHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    product: 'Organic Honey 500g',
    batchNo: 'B2025-001',
    mfgDate: '2025-01-01',
    expiryDate: '2027-01-01',
    manufacturerID: 'manufacturer-001',
    manufacturerName: 'Golden Bee Farms',
    childList: ['CHILD-0001', 'CHILD-0002', 'CHILD-0003', 'CHILD-0004', 'CHILD-0005'],
    committedMessages: mockCommittedMessages.slice(0, 3),
    meta: { notes: 'Premium organic honey from Himalayan region', certs: ['USDA-ORG-2025', 'ISO-22000'] },
    version: 'v1',
    status: 'active',
    createdAt: lastWeek,
    updatedAt: yesterday,
  },
  {
    objectType: 'MegaQR',
    megaID: 'MEGA-2025-0002',
    megaHash: 'b2c3d4e5f678901234567890123456789012cdef1234567890abcdef1234567',
    product: 'Vitamin D3 Supplements',
    batchNo: 'B2025-002',
    mfgDate: '2025-02-01',
    expiryDate: '2026-02-01',
    manufacturerID: 'manufacturer-001',
    manufacturerName: 'Golden Bee Farms',
    childList: ['CHILD-0006', 'CHILD-0007', 'CHILD-0008'],
    committedMessages: [mockCommittedMessages[0], mockCommittedMessages[1]],
    meta: { notes: 'High potency vitamin D3 1000IU' },
    version: 'v1',
    status: 'active',
    createdAt: yesterday,
    updatedAt: yesterday,
  },
];

export const mockChildQRs: ChildQR[] = [
  {
    objectType: 'ChildQR',
    childID: 'CHILD-0001',
    childHash: 'c3d4e5f67890123456789012345678901234def1234567890abcdef12345678',
    megaID: 'MEGA-2025-0001',
    megaHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    productSnapshot: {
      product: 'Organic Honey 500g',
      batchNo: 'B2025-001',
      mfgDate: '2025-01-01',
      expiryDate: '2027-01-01',
      manufacturerID: 'manufacturer-001',
      manufacturerName: 'Golden Bee Farms',
    },
    committedMessages: mockCommittedMessages,
    scanEvents: [
      { actorID: 'consumer-001', ts: now, location: 'Mumbai, India', device: 'iPhone 15' },
    ],
    status: 'active',
    createdAt: lastWeek,
    updatedAt: now,
  },
  {
    objectType: 'ChildQR',
    childID: 'CHILD-0002',
    childHash: 'd4e5f6789012345678901234567890123456ef1234567890abcdef123456789',
    megaID: 'MEGA-2025-0001',
    megaHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    productSnapshot: {
      product: 'Organic Honey 500g',
      batchNo: 'B2025-001',
      mfgDate: '2025-01-01',
      expiryDate: '2027-01-01',
      manufacturerID: 'manufacturer-001',
      manufacturerName: 'Golden Bee Farms',
    },
    committedMessages: mockCommittedMessages.slice(0, 3),
    scanEvents: [],
    status: 'active',
    createdAt: lastWeek,
    updatedAt: yesterday,
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'LOG-001',
    action: 'CREATE_MEGA_QR',
    targetType: 'MegaQR',
    targetID: 'MEGA-2025-0001',
    performedBy: 'manufacturer-001',
    performedByRole: 'manufacturer',
    details: 'Created batch MEGA-2025-0001 with 5 child QRs',
    txID: 'tx-abc123',
    timestamp: lastWeek,
  },
  {
    id: 'LOG-002',
    action: 'COMMIT_MESSAGE',
    targetType: 'MegaQR',
    targetID: 'MEGA-2025-0001',
    performedBy: 'manufacturer-001',
    performedByRole: 'manufacturer',
    details: 'Committed message: Shipped',
    txID: 'tx-def456',
    timestamp: yesterday,
  },
  {
    id: 'LOG-003',
    action: 'COMMIT_MESSAGE',
    targetType: 'ChildQR',
    targetID: 'CHILD-0001',
    performedBy: 'retailer-001',
    performedByRole: 'retailer',
    details: 'Committed message: Received at Retailer',
    txID: 'tx-ghi789',
    timestamp: now,
  },
];

// Functions to get mock data
export function getMockMegaQRs(manufacturerID?: string): MegaQR[] {
  if (manufacturerID) {
    return mockMegaQRs.filter(m => m.manufacturerID === manufacturerID);
  }
  return mockMegaQRs;
}

export function getMockMegaQR(megaID: string): MegaQR | undefined {
  return mockMegaQRs.find(m => m.megaID === megaID);
}

export function getMockChildQR(childID: string): ChildQR | undefined {
  return mockChildQRs.find(c => c.childID === childID);
}

export function getMockChildrenByMegaID(megaID: string): ChildQR[] {
  return mockChildQRs.filter(c => c.megaID === megaID);
}

export function getMockAuditLogs(): AuditLog[] {
  return mockAuditLogs;
}
