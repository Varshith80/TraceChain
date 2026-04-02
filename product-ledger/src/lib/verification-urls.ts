/**
 * Batch / unit verification URLs embedded in QR codes
 */
export function getBatchVerificationURL(megaID: string): string {
  const verifyDomain = import.meta.env.VITE_VERIFY_DOMAIN;
  const protocol =
    import.meta.env.VITE_VERIFY_PROTOCOL ||
    (typeof window !== 'undefined' ? window.location.protocol.replace(/:$/, '') : 'https');
  const domain = verifyDomain || (typeof window !== 'undefined' ? window.location.host : '');
  return `${protocol}://${domain}/v/${megaID}`;
}
