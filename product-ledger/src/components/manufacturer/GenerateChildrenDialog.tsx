import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { QrCode, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { MegaQR, ChildQR } from '@/types/fabric';
import { generateChildQRs, getChildrenByMegaID } from '@/services/api/fabric-api';

const generateChildrenSchema = z.object({
  count: z.coerce.number()
    .min(1, 'Must generate at least 1')
    .max(10000, 'Maximum 10,000 per batch'),
});

type GenerateChildrenFormData = z.infer<typeof generateChildrenSchema>;

interface GenerateChildrenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  megaQR: MegaQR | null;
  lotSize: number;
  onSuccess: () => void;
}

export function GenerateChildrenDialog({ open, onOpenChange, megaQR, lotSize, onSuccess }: GenerateChildrenDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedChildren, setGeneratedChildren] = useState<ChildQR[]>([]);
  const [createdCount, setCreatedCount] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const childrenGenerated = megaQR?.childList.length ?? 0;
  const remainingCapacity = lotSize - childrenGenerated;

  const form = useForm<GenerateChildrenFormData>({
    resolver: zodResolver(generateChildrenSchema),
    defaultValues: {
      count: Math.min(100, remainingCapacity),
    },
  });

  const onSubmit = async (data: GenerateChildrenFormData) => {
    if (!megaQR) return;
    
    if (data.count > remainingCapacity) {
      toast.error(`Cannot exceed lot size. Maximum: ${remainingCapacity}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Capture snapshot before generation so we can compute newly created children reliably
      const beforeChildIDs = new Set(megaQR.childList);

      const result = await generateChildQRs({
        megaID: megaQR.megaID,
        count: data.count,
      });

      const ids = Array.isArray(result.childIDs) ? result.childIDs : [];
      // Always compute "newly created children" from ledger state, not only from chaincode return.
      const allChildren = await getChildrenByMegaID(megaQR.megaID);
      const newChildren = allChildren.filter(c => !beforeChildIDs.has(c.childID));

      setGeneratedChildren(newChildren);
      setCreatedCount(newChildren.length || ids.length || 0);
      setShowResults(true);
      onSuccess();
      toast.success(`Generated ${newChildren.length || ids.length || 0} Child QR codes`);
    } catch (error) {
      toast.error('Failed to generate Child QRs');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setShowResults(false);
    setGeneratedChildren([]);
    setCreatedCount(0);
    form.reset();
    onOpenChange(false);
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetAndClose();
    }
  };

  const requestedCount = form.watch('count');
  const isLargeBatch = requestedCount > 500;

  if (!megaQR) return null;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Generate Child QR Codes
          </DialogTitle>
          <DialogDescription>
            Generate individual QR codes for <span className="font-medium">{megaQR.product}</span>
          </DialogDescription>
        </DialogHeader>

        {showResults ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Successfully Generated</p>
                <p className="text-sm text-muted-foreground">
                  {createdCount} Child QR codes created
                </p>
              </div>
            </div>

            <div className="max-h-[200px] overflow-y-auto space-y-1 p-3 bg-muted/50 rounded-lg">
              {generatedChildren.slice(0, 10).map((child) => (
                <div key={child.childID} className="text-xs font-mono px-2 py-1 bg-background rounded">
                  {child.childID}
                </div>
              ))}
              {generatedChildren.length > 10 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  ... and {generatedChildren.length - 10} more
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={resetAndClose}>
                Close
              </Button>
              <Button
                onClick={() => {
                  if (generatedChildren.length === 0) return;
                  const header = 'childID,megaID,product,batchNo';
                  const rows = generatedChildren.map((c) =>
                    [
                      c.childID,
                      c.megaID,
                      c.productSnapshot?.product ?? '',
                      c.productSnapshot?.batchNo ?? '',
                    ]
                      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                      .join(',')
                  );
                  const csv = [header, ...rows].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${megaQR.megaID}-child-qrs.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('CSV downloaded');
                }}
              >
                Export CSV
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Batch:</span>
                  <span className="font-medium">{megaQR.batchNo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lot Size:</span>
                  <span className="font-medium">{lotSize.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Already Generated:</span>
                  <span className="font-medium">{childrenGenerated.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-primary">
                  <span>Remaining Capacity:</span>
                  <span>{remainingCapacity.toLocaleString()}</span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of QR Codes to Generate</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        max={Math.min(10000, remainingCapacity)} 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum {Math.min(10000, remainingCapacity).toLocaleString()} per batch
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isLargeBatch && (
                <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700">
                    Large batch detected. This may take a moment to process.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetAndClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || remainingCapacity === 0}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    `Generate ${requestedCount || 0} QR Codes`
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
