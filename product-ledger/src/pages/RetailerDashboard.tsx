import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Package, Search, AlertCircle, RefreshCw, Camera, History, Hash } from 'lucide-react';
import { QRScanner } from '@/components/retailer/QRScanner';
import { MegaQRProductsSheet } from '@/components/retailer/MegaQRProductsSheet';
import { RetailerHistoryTable } from '@/components/retailer/RetailerHistoryTable';
import { HashLookup } from '@/components/retailer/HashLookup';
import { CommitRetailerMessageDialog } from '@/components/retailer/CommitRetailerMessageDialog';
import { ProductDetailsSheet } from '@/components/retailer/ProductDetailsSheet';
import { useRetailerData } from '@/hooks/useRetailerData';
import { toast } from 'sonner';
import type { MegaQR, ChildQR, CommittedMessage } from '@/types/fabric';
import { getChildQR } from '@/services/api/fabric-api';

export default function RetailerDashboard() {
  const [scanInput, setScanInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<ChildQR | null>(null);
  const [childDetailsOpen, setChildDetailsOpen] = useState(false);
  
  // Selected mega QR data
  const [selectedMega, setSelectedMega] = useState<{
    megaQR: MegaQR;
    childQRs: ChildQR[];
    committedMessages: CommittedMessage[];
  } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Commit dialog state
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [commitTarget, setCommitTarget] = useState<{ megaId: string; childId?: string } | null>(null);

  const {
    scanLogs,
    commitLogs,
    isLoading,
    refetch,
    recordScan,
    commitMessage,
    getMegaQRWithDetails,
  } = useRetailerData();

  const extractChildID = (raw: string): string | null => {
    const value = raw.trim();
    if (!value) return null;
    // If it's already an ID, keep it.
    if (!value.includes('://')) return value;
    try {
      const url = new URL(value);
      // Expected: /v/:childID OR /verify/:childID
      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex(p => p === 'v' || p === 'verify');
      if (idx >= 0 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);
      return null;
    } catch {
      return null;
    }
  };

  const handleLookup = async (input?: string) => {
    const searchId = input || scanInput.trim();
    if (!searchId) {
      toast.error('Please enter a Mega QR ID');
      return;
    }

    setLookupError(null);
    
    try {
      // If scanned/entered value is a verification URL, extract childID and fetch unit details.
      const childID = extractChildID(searchId);
      if (childID && (childID.includes('CHILD') || childID.includes('-C'))) {
        const child = await getChildQR(childID);
        setSelectedChild(child);
        setChildDetailsOpen(true);
        await recordScan(null, childID);
        toast.success('Product found!', { description: childID });
        return;
      }

      // Otherwise treat as MegaQR ID lookup.
      const result = await getMegaQRWithDetails(searchId);
      if (result) {
        setSelectedMega(result);
        setDetailsOpen(true);
        await recordScan(searchId, null);
        toast.success('Mega QR found!', {
          description: `${result.megaQR.product} - ${result.childQRs.length} units`,
        });
      } else {
        setLookupError(`No Mega QR found with ID: ${searchId}`);
      }
    } catch (error: any) {
      console.error('Lookup error:', error);
      setLookupError(error?.message || 'Failed to lookup product. Please try again.');
    }
  };

  const handleScan = (code: string) => {
    setScanInput(code);
    handleLookup(code);
    setIsScanning(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup();
    }
  };

  const handleCommitToMega = () => {
    if (selectedMega) {
      setCommitTarget({ megaId: selectedMega.megaQR.megaID });
      setCommitDialogOpen(true);
    }
  };

  const handleCommitSuccess = () => {
    toast.success('Message committed!', { 
      description: 'The status has been recorded on the blockchain and cannot be deleted.' 
    });
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Retailer Dashboard</h1>
          <p className="text-muted-foreground">Scan products and manage your inventory</p>
        </div>
        <Button variant="outline" onClick={refetch} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="scan" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scan" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Scan QR
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="verify" className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Verify
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="space-y-4">
          {/* QR Scanner */}
          <QRScanner
            onScan={handleScan}
            isScanning={isScanning}
            onToggleScan={() => setIsScanning(!isScanning)}
          />

          {/* Manual Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Manual Entry
              </CardTitle>
              <CardDescription>
                Enter a Mega QR ID to access batch details and all child products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Mega QR ID (e.g., MEGA-2025-0001)"
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                <Button onClick={() => handleLookup()} disabled={isLoading}>
                  <Search className="mr-2 h-4 w-4" />
                  Lookup
                </Button>
              </div>

              {lookupError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {lookupError}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Scans Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your last {scanLogs.length} scans and {commitLogs.length} commits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-3xl font-bold text-primary">{scanLogs.length}</div>
                  <div className="text-sm text-muted-foreground">Total Scans</div>
                </div>
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <div className="text-3xl font-bold text-success">{commitLogs.length}</div>
                  <div className="text-sm text-muted-foreground">Total Commits</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <RetailerHistoryTable
            scanLogs={scanLogs}
            commitLogs={commitLogs}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="verify">
          <HashLookup />
        </TabsContent>
      </Tabs>

      {/* Mega QR Details Sheet */}
      <MegaQRProductsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        megaQR={selectedMega?.megaQR || null}
        childQRs={selectedMega?.childQRs || []}
        committedMessages={selectedMega?.committedMessages || []}
      />

      <ProductDetailsSheet
        open={childDetailsOpen}
        onOpenChange={setChildDetailsOpen}
        childQR={selectedChild}
      />

      {/* Commit Message Dialog */}
      <CommitRetailerMessageDialog
        open={commitDialogOpen}
        onOpenChange={setCommitDialogOpen}
        childQR={selectedChild}
        onSuccess={handleCommitSuccess}
      />
    </div>
  );
}
