/**
 * Public Verification API
 * 
 * No authentication required - public endpoint for product verification
 */

const getPublicVerifyURL = (): string => {
  // Public verify endpoint is served by the backend (NOT the frontend).
  // Backend mounts it at: GET http://<backend-host>:3001/v/:id
  const envApiUrl = import.meta.env.VITE_API_URL as string | undefined; // e.g. http://host:3001/api
  if (envApiUrl) {
    return envApiUrl.replace(/\/api\/?$/, '');
  }

  // If accessing UI via IP, use same IP for backend.
  const currentHost = window.location.hostname;
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    return `http://${currentHost}:3001`;
  }

  return 'http://localhost:3001';
};

export interface PublicVerificationResponse {
  valid: boolean;
  hashMatch: boolean;
  message: string;
  childID: string;
  timestamp: string;
  responseTime: number;
  product: {
    childID?: string;
    childHash?: string;
    megaID?: string;
    status?: string;
    productSnapshot?: {
      product: string;
      batchNo: string;
      mfgDate: string;
      expiryDate: string;
      manufacturerName?: string;
    };
    scanCount: number;
    lastScanned: string | null;
    committedMessagesCount: number;
  };
  parent: {
    megaID: string;
    product: string;
    batchNo: string;
    manufacturerName?: string;
    status: string;
  } | null;
  recentScans: Array<{
    timestamp: string;
    location?: string;
    device?: string;
  }>;
}

/**
 * Verify product using public endpoint (no authentication)
 */
export async function verifyProductPublic(childID: string): Promise<PublicVerificationResponse> {
  const baseURL = getPublicVerifyURL();
  const url = `${baseURL}/v/${childID}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    // If we accidentally hit the frontend (HTML), surface a clear error.
    if (text.trim().toLowerCase().startsWith('<!doctype') || text.trim().startsWith('<html')) {
      throw new Error('Verification endpoint misconfigured: received HTML instead of JSON. Check VITE_API_URL / backend host.');
    }
    const error = (() => {
      try {
        return JSON.parse(text);
      } catch {
        return { message: 'Verification failed' };
      }
    })();
    throw new Error(error.message || `HTTP ${response.status}: Verification failed`);
  }

  return response.json();
}

