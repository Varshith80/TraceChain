import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Package, QrCode, MessageSquare, LayoutGrid, List } from 'lucide-react';
import { MegaQR } from '@/types/fabric';
import { CreateMegaQRDialog } from '@/components/manufacturer/CreateMegaQRDialog';
import { CommitMessageDialog } from '@/components/manufacturer/CommitMessageDialog';
import { MegaQRCard } from '@/components/manufacturer/MegaQRCard';
import { MegaQRDetailsSheet } from '@/components/manufacturer/MegaQRDetailsSheet';
import { AllQRCodesSection } from '@/components/manufacturer/AllQRCodesSection';
import { ParentQROverview } from '@/components/manufacturer/ParentQROverview';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getManufacturerMegaQRs } from '@/services/api/fabric-api';
import { batchLotSizeDisplay } from '@/lib/batch-meta';

const initialLotSizes: Record<string, number> = {
  'MEGA-2025-0001': 1000,
  'MEGA-2025-0002': 500,
};

export default function ManufacturerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const megaQRsQuery = useQuery({
    queryKey: ['manufacturerMegaQRs', user?.id],
    enabled: !!user?.id,
    queryFn: () => getManufacturerMegaQRs(user!.id),
    staleTime: 15_000,
  });

  const megaQRs = megaQRsQuery.data ?? [];
  const [lotSizes, setLotSizes] = useState<Record<string, number>>(initialLotSizes);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [commitMessageDialog, setCommitMessageDialog] = useState<{ open: boolean; megaQR: MegaQR | null }>({ open: false, megaQR: null });
  const [detailsSheet, setDetailsSheet] = useState<{ open: boolean; megaQR: MegaQR | null }>({ open: false, megaQR: null });
  const [activeTab, setActiveTab] = useState('overview');

  const handleCreateSuccess = async (newMegaQR: MegaQR, lotSize: number) => {
    setLotSizes(prev => ({ ...prev, [newMegaQR.megaID]: lotSize }));
    await queryClient.invalidateQueries({ queryKey: ['manufacturerMegaQRs', user?.id] });
  };

  const handleCommitMessageSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ['manufacturerMegaQRs', user?.id] });
  };

  const totalLotUnits = useMemo(
    () =>
      megaQRs.reduce(
        (acc, m) => acc + batchLotSizeDisplay(m, lotSizes[m.megaID] ?? 1000),
        0
      ),
    [megaQRs, lotSizes]
  );

  const totalMessages = megaQRs.reduce((a, b) => a + b.committedMessages.length, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {megaQRsQuery.isLoading && (
        <div className="text-sm text-muted-foreground">Loading blockchain data...</div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manufacturer Dashboard</h1>
          <p className="text-muted-foreground">Manage batch QRs and supply chain messages</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Batch QR
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{megaQRs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lot Units (sum)</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLotUnits.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Messages Committed</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Batches</span>
          </TabsTrigger>
          <TabsTrigger value="all-qrcodes" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">All Batch QRs</span>
          </TabsTrigger>
          <TabsTrigger value="parent-overview" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Batch QRs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <h2 className="text-lg font-semibold">Your Batches</h2>
          {megaQRs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No batches yet. Click &quot;Create Batch QR&quot; to get started.</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {megaQRs.map(mega => (
                <MegaQRCard
                  key={mega.megaID}
                  megaQR={mega}
                  onViewDetails={(m) => {
                    setDetailsSheet({ open: true, megaQR: m });
                    setCreateDialogOpen(false);
                    setCommitMessageDialog({ open: false, megaQR: null });
                  }}
                  onCommitMessage={(m) => {
                    setCommitMessageDialog({ open: true, megaQR: m });
                    setCreateDialogOpen(false);
                    setDetailsSheet({ open: false, megaQR: null });
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all-qrcodes">
          <AllQRCodesSection megaQRs={megaQRs} lotSizes={lotSizes} />
        </TabsContent>

        <TabsContent value="parent-overview">
          <ParentQROverview megaQRs={megaQRs} lotSizes={lotSizes} />
        </TabsContent>
      </Tabs>

      <CreateMegaQRDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
        onSuccess={handleCreateSuccess} 
      />
      
      <CommitMessageDialog
        open={commitMessageDialog.open}
        onOpenChange={(open) => setCommitMessageDialog({ open, megaQR: open ? commitMessageDialog.megaQR : null })}
        megaQR={commitMessageDialog.megaQR}
        onSuccess={handleCommitMessageSuccess}
      />
      
      <MegaQRDetailsSheet
        open={detailsSheet.open}
        onOpenChange={(open) => setDetailsSheet({ open, megaQR: open ? detailsSheet.megaQR : null })}
        megaQR={detailsSheet.megaQR}
        lotSize={detailsSheet.megaQR ? (lotSizes[detailsSheet.megaQR.megaID] || 1000) : 1000}
      />
    </div>
  );
}
