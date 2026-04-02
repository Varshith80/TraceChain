import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/ui/status-badge';
import { Package, Calendar, Hash, Building, MessageSquare, ScanLine } from 'lucide-react';
import type { ChildQR } from '@/types/fabric';
import { format } from 'date-fns';

interface ProductDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childQR: ChildQR | null;
}

export function ProductDetailsSheet({ open, onOpenChange, childQR }: ProductDetailsSheetProps) {
  if (!childQR) return null;

  const { productSnapshot, committedMessages, scanEvents } = childQR;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {productSnapshot.product}
          </SheetTitle>
          <SheetDescription>
            Product ID: {childQR.childID}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          <div className="space-y-6 pr-4">
            {/* Status & Basic Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={childQR.status} />
                <Badge variant="outline">{childQR.objectType}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Batch No</p>
                    <p className="font-medium">{productSnapshot.batchNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Manufacturer</p>
                    <p className="font-medium">{productSnapshot.manufacturerName || productSnapshot.manufacturerID}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Mfg Date</p>
                    <p className="font-medium">{format(new Date(productSnapshot.mfgDate), 'PP')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Expiry Date</p>
                    <p className="font-medium">{format(new Date(productSnapshot.expiryDate), 'PP')}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Message History */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Message History ({committedMessages.length})
              </h4>
              <div className="space-y-2">
                {committedMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                ) : (
                  committedMessages.map((msg, idx) => (
                    <div key={idx} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{msg.msg}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.ts), 'PP p')}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">
                        By: {msg.actorID} {msg.location && `• ${msg.location}`}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Separator />

            {/* Scan Logs */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <ScanLine className="h-4 w-4" />
                Scan History ({scanEvents?.length || 0})
              </h4>
              <div className="space-y-2">
                {(!scanEvents || scanEvents.length === 0) ? (
                  <p className="text-sm text-muted-foreground">No scans recorded</p>
                ) : (
                  scanEvents.map((log, idx) => (
                    <div key={idx} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Actor: {log.actorID}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.ts), 'PP p')}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">
                        {log.location && log.location} {log.device && `• ${log.device}`}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
