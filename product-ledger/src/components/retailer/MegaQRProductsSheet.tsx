import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Package, Calendar, Factory, Hash, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import type { MegaQR, ChildQR, CommittedMessage } from '@/types/fabric';

interface MegaQRProductsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  megaQR: MegaQR | null;
  childQRs: ChildQR[];
  committedMessages: CommittedMessage[];
}

export function MegaQRProductsSheet({
  open,
  onOpenChange,
  megaQR,
  childQRs,
  committedMessages,
}: MegaQRProductsSheetProps) {
  if (!megaQR) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {megaQR.product}
          </SheetTitle>
          <SheetDescription>
            Batch: {megaQR.batchNo} • {childQRs.length} units
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          <div className="space-y-6">
            {/* Batch Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Batch Information</h3>
              <Card>
                <CardContent className="p-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Mega ID</p>
                      <p className="text-sm font-mono">{megaQR.megaID}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Manufacturer</p>
                      <p className="text-sm">{megaQR.manufacturerName || megaQR.manufacturerID}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Mfg Date</p>
                      <p className="text-sm">{megaQR.mfgDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Expiry Date</p>
                      <p className="text-sm">{megaQR.expiryDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Committed Messages */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Committed Messages ({committedMessages.length})
              </h3>
              {committedMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No messages committed yet
                </p>
              ) : (
                <div className="space-y-2">
                  {committedMessages.map((msg, idx) => (
                    <Card key={idx} className="bg-muted/30">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{msg.msg}</p>
                            <p className="text-xs text-muted-foreground">
                              by {msg.actorID} {msg.location && `• ${msg.location}`}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {format(new Date(msg.ts), 'MMM d, HH:mm')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Child Products */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Child Products ({childQRs.length})
              </h3>
              {childQRs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No child products generated yet
                </p>
              ) : (
                <div className="space-y-2">
                  {childQRs.map(child => (
                    <Card key={child.childID}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm">{child.childID}</p>
                          <p className="text-xs text-muted-foreground">
                            {child.committedMessages?.length || 0} messages • {child.scanEvents?.length || 0} scans
                          </p>
                        </div>
                        <StatusBadge status={child.status} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Hash for verification */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Verification Hash</h3>
              <Card className="bg-muted/30">
                <CardContent className="p-3">
                  <p className="font-mono text-xs break-all">{megaQR.megaHash}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
