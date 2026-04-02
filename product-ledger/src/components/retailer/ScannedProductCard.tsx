import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Package, MessageSquarePlus, Eye } from 'lucide-react';
import type { ChildQR } from '@/types/fabric';

interface ScannedProductCardProps {
  childQR: ChildQR;
  onCommitMessage: (childQR: ChildQR) => void;
  onViewDetails: (childQR: ChildQR) => void;
}

export function ScannedProductCard({ childQR, onCommitMessage, onViewDetails }: ScannedProductCardProps) {
  const lastMessage = childQR.committedMessages[childQR.committedMessages.length - 1];
  
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium truncate">{childQR.productSnapshot.product}</h4>
                <StatusBadge status={childQR.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                ID: {childQR.childID} • Batch: {childQR.productSnapshot.batchNo}
              </p>
              {lastMessage && (
                <p className="text-xs text-muted-foreground">
                  Last: {lastMessage.msg} by {lastMessage.by}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => onViewDetails(childQR)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => onCommitMessage(childQR)}>
              <MessageSquarePlus className="mr-1 h-4 w-4" />
              Commit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
