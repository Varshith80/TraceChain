/**
 * Public Verification Page
 * Architecture: QR codes resolve to this URL for product verification
 * This page is PUBLIC (no authentication required) for consumer verification
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react';
import { verifyProductPublic } from '@/services/api/public-verify-api';
import { ProductVerificationResult } from '@/components/consumer/ProductVerificationResult';
import { MegaVerificationResult } from '@/components/consumer/MegaVerificationResult';
import type { ChildQR, MegaQR } from '@/types/fabric';

export default function Verify() {
  const { childID } = useParams<{ childID: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    childQR?: ChildQR;
    megaQR?: MegaQR;
    hashMatch: boolean;
    message: string;
    product?: any;
    parent?: any;
    recentScans?: any[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (childID) {
      verifyProduct(childID);
    }
  }, [childID]);

  const verifyProduct = async (id: string) => {
    setLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const result = await verifyProductPublic(id);
      const committedMessages = (result as any).committedMessages || [];
      const megaFromApi = (result as any).mega as MegaQR | undefined;
      
      // Transform public API response to match expected format
      const childQR: ChildQR | undefined = result.product.childID ? {
        objectType: 'ChildQR',
        childID: result.product.childID,
        childHash: result.product.childHash || '',
        megaID: result.product.megaID || '',
        megaHash: '',
        productSnapshot: result.product.productSnapshot || {
          product: '',
          batchNo: '',
          mfgDate: '',
          expiryDate: '',
        },
        committedMessages: committedMessages as any,
        scanEvents: result.recentScans?.map(scan => ({
          childID: result.product.childID,
          actorID: '',
          ts: scan.timestamp,
          location: scan.location,
          device: scan.device,
        })) || [],
        status: result.product.status as any || 'active',
        createdAt: '',
        updatedAt: '',
      } : undefined;

      const megaQR: MegaQR | undefined = megaFromApi
        ? megaFromApi
        : result.parent
          ? {
              objectType: 'MegaQR',
              megaID: result.parent.megaID,
              megaHash: (result.parent as any).megaHash || '',
              product: result.parent.product,
              batchNo: result.parent.batchNo,
              mfgDate: (result.parent as any).mfgDate || result.product?.productSnapshot?.mfgDate || '',
              expiryDate: (result.parent as any).expiryDate || result.product?.productSnapshot?.expiryDate || '',
              manufacturerID: (result.parent as any).manufacturerID || result.product?.productSnapshot?.manufacturerID || '',
              manufacturerName: result.parent.manufacturerName,
              childList: [],
              committedMessages: committedMessages as any,
              meta: (result.parent as any).meta || {},
              version: '1.0',
              status: result.parent.status as any || 'active',
              createdAt: (result.parent as any).createdAt || '',
              updatedAt: (result.parent as any).updatedAt || '',
            }
          : undefined;

      setVerificationResult({
        valid: result.valid,
        hashMatch: result.hashMatch,
        message: result.message,
        childQR,
        megaQR,
        product: result.product,
        parent: result.parent,
        recentScans: result.recentScans,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to verify product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Product Verification</h1>
          </div>
          <p className="text-muted-foreground">
            Verify product authenticity and view complete supply chain history
          </p>
        </div>

        {/* Verification Result */}
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Verifying product...</span>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center gap-3 text-destructive">
                <XCircle className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold">Verification Failed</h3>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {verificationResult && (
          <div className="space-y-4">
            {/* Status Badge */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-3">
                  {verificationResult.valid ? (
                    <>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div className="text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-lg px-4 py-2">
                          ✓ Product is Authentic
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">{verificationResult.message}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-8 w-8 text-destructive" />
                      <div className="text-center">
                        <Badge variant="destructive" className="text-lg px-4 py-2">
                          ✗ Verification Failed
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">{verificationResult.message}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product Details */}
            {verificationResult.childQR && (
              <ProductVerificationResult
                childQR={verificationResult.childQR}
                onReportCounterfeit={() => {}}
              />
            )}

            {!verificationResult.childQR && verificationResult.megaQR && (
              <MegaVerificationResult
                megaQR={verificationResult.megaQR}
                committedMessages={(verificationResult.megaQR.committedMessages as any) || []}
                onReportCounterfeit={() => {}}
              />
            )}
          </div>
        )}

        {/* Manual Entry */}
        {!childID && !loading && !verificationResult && (
          <Card>
            <CardHeader>
              <CardTitle>Enter Product ID</CardTitle>
              <CardDescription>
                Scan a QR code or manually enter the product ID to verify
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter product ID (e.g., MEGA-2025-0001-C00001)"
                  className="w-full px-4 py-2 border rounded-md"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value) {
                        navigate(`/verify/${value}`);
                      }
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const input = document.querySelector('input') as HTMLInputElement;
                    if (input?.value.trim()) {
                      navigate(`/verify/${input.value.trim()}`);
                    }
                  }}
                  className="w-full"
                >
                  Verify Product
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="text-center">
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

