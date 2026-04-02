import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { QrCode, Shield, Search, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ProductVerificationResult } from '@/components/consumer/ProductVerificationResult';
import { ReportCounterfeitDialog } from '@/components/consumer/ReportCounterfeitDialog';
import { toast } from 'sonner';
import type { ChildQR } from '@/types/fabric';

export default function ConsumerDashboard() {
  const navigate = useNavigate();
  const [scanInput, setScanInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedProduct, setVerifiedProduct] = useState<ChildQR | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const handleVerify = async () => {
    if (!scanInput.trim()) {
      toast.error('Please enter a product ID');
      return;
    }

    // Consumer verification should always use the public verification flow.
    // Redirecting keeps Verify.tsx as the single source of truth.
    setVerifyError(null);
    setVerifiedProduct(null);
    navigate(`/verify/${encodeURIComponent(scanInput.trim())}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isVerifying) {
      handleVerify();
    }
  };

  const handleNewScan = () => {
    setScanInput('');
    setVerifiedProduct(null);
    setVerifyError(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Verify Products</h1>
        <p className="text-muted-foreground">Scan or enter a product QR code to verify authenticity</p>
      </div>

      {/* Scan Card - Always visible */}
      <Card className="mx-auto max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <QrCode className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Scan QR Code</CardTitle>
          <CardDescription>Enter the product ID to verify its authenticity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Product ID (e.g., CHILD-0001)"
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="text-center"
              disabled={isVerifying}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              size="lg" 
              onClick={handleVerify}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Search className="mr-2 h-5 w-5" />
              )}
              {isVerifying ? 'Verifying...' : 'Verify Product'}
            </Button>
            {verifiedProduct && (
              <Button variant="outline" size="lg" onClick={handleNewScan}>
                New Scan
              </Button>
            )}
          </div>

          {/* Verification Error */}
          {verifyError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{verifyError}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Result */}
      {verifiedProduct && (
        <div className="mx-auto max-w-lg">
          <ProductVerificationResult
            childQR={verifiedProduct}
            onReportCounterfeit={() => setReportDialogOpen(true)}
          />
        </div>
      )}

      {/* Info Cards - Only show when no product verified */}
      {!verifiedProduct && !verifyError && (
        <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <Shield className="h-8 w-8 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold">Blockchain Verified</h3>
                <p className="text-sm text-muted-foreground">
                  Every product is tracked on an immutable blockchain ledger
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <CheckCircle className="h-8 w-8 text-success shrink-0" />
              <div>
                <h3 className="font-semibold">Complete History</h3>
                <p className="text-sm text-muted-foreground">
                  View the full journey from manufacturer to your hands
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Counterfeit Dialog */}
      <ReportCounterfeitDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        childQR={verifiedProduct}
      />
    </div>
  );
}