import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { commitMessageToChild, getChildrenByMegaID, getMegaQR, getChildQR } from '@/services/api/fabric-api';

interface ScanLogEntry {
  id: string;
  mega_id: string | null;
  child_id: string | null;
  location: string | null;
  device: string | null;
  created_at: string;
}

interface CommitLog {
  id: string;
  mega_id: string | null;
  child_id: string | null;
  message: string;
  location: string | null;
  created_at: string;
}

export function useRetailerData() {
  const { user } = useAuth();
  const [scanLogs, setScanLogs] = useState<ScanLogEntry[]>([]);
  const [commitLogs, setCommitLogs] = useState<CommitLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // For now, retailer history is managed through blockchain
      // Scan logs and commit logs are part of the blockchain data
      // This will be populated when products are scanned/committed
      setScanLogs([]);
      setCommitLogs([]);
    } catch (err: any) {
      console.error('Error fetching retailer data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const recordScan = useCallback(async (megaId: string | null, childId: string | null, location?: string) => {
    if (!user) return;

    try {
      // Scan is logged server-side when fetching a ChildQR.
      if (childId) {
        await getChildQR(childId);
      }
      void fetchHistory();
    } catch (err: any) {
      console.error('Error recording scan:', err);
      throw err;
    }
  }, [user, fetchHistory]);

  const commitMessage = useCallback(async (
    megaId: string | null,
    childId: string | null,
    message: string,
    location?: string
  ) => {
    if (!user) throw new Error('Not authenticated');

    try {
      if (childId) {
        const result = await commitMessageToChild(childId, { message, location });
        // Refresh history
        void fetchHistory();
        return { txHash: result.txID };
      }
      
      throw new Error('ChildID is required');
    } catch (err: any) {
      console.error('Error committing message:', err);
      throw err;
    }
  }, [user, fetchHistory]);

  const getMegaQRWithDetails = useCallback(async (megaId: string) => {
    try {
      // Fetch mega QR from blockchain
      const megaQR = await getMegaQR(megaId);
      if (!megaQR) return null;

      // Fetch child QRs
      const childQRs = await getChildrenByMegaID(megaId);

      // Committed messages are already in megaQR
      const committedMessages = megaQR.committedMessages;

      return { megaQR, childQRs, committedMessages };
    } catch (err: any) {
      console.error('Error fetching mega QR details:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    scanLogs,
    commitLogs,
    isLoading,
    error,
    refetch: fetchHistory,
    recordScan,
    commitMessage,
    getMegaQRWithDetails,
  };
}
