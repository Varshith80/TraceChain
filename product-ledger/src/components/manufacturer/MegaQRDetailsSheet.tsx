import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, 
  Calendar, 
  Hash, 
  MessageSquare, 
  Clock,
  User,
  FileText,
  MapPin,
  Scale,
  Shield,
  Leaf,
} from 'lucide-react';
import { format } from 'date-fns';
import type { MegaQR, CommittedMessage } from '@/types/fabric';
import { BATCH_META_KEYS, batchLotSizeDisplay, getBatchMetaMap, isVegFromMeta } from '@/lib/batch-meta';

interface MegaQRDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  megaQR: MegaQR | null;
  lotSize: number;
}

export function MegaQRDetailsSheet({ open, onOpenChange, megaQR, lotSize }: MegaQRDetailsSheetProps) {
  if (!megaQR) return null;

  const metaMap = getBatchMetaMap(megaQR);
  const resolvedLot = batchLotSizeDisplay(megaQR, lotSize);
  const veg = isVegFromMeta(megaQR);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {megaQR.product}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <Hash className="h-3.5 w-3.5" />
            {megaQR.batchNo}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={megaQR.status === 'active' ? 'default' : 'destructive'}>
                {megaQR.status.charAt(0).toUpperCase() + megaQR.status.slice(1)}
              </Badge>
              {veg !== null && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Leaf className="h-3.5 w-3.5" />
                  <span className={`h-2 w-2 rounded-full ${veg ? 'bg-green-600' : 'bg-red-600'}`} />
                  {veg ? 'Vegetarian' : 'Non-vegetarian'}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Batch details</h4>
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Manufacturing Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(megaQR.mfgDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Expiry Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(megaQR.expiryDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Scale className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Lot size (units)</p>
                    <p className="text-sm text-muted-foreground">
                      {resolvedLot.toLocaleString()}
                    </p>
                  </div>
                </div>
                {metaMap[BATCH_META_KEYS.productCategory] && (
                  <div>
                    <p className="text-sm font-medium">Category</p>
                    <p className="text-sm text-muted-foreground">{metaMap[BATCH_META_KEYS.productCategory]}</p>
                  </div>
                )}
                {metaMap[BATCH_META_KEYS.netQuantity] && (
                  <div>
                    <p className="text-sm font-medium">Net weight / quantity</p>
                    <p className="text-sm text-muted-foreground">{metaMap[BATCH_META_KEYS.netQuantity]}</p>
                  </div>
                )}
                {metaMap[BATCH_META_KEYS.fssaiLicense] && (
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">FSSAI license</p>
                      <p className="text-sm text-muted-foreground">{metaMap[BATCH_META_KEYS.fssaiLicense]}</p>
                    </div>
                  </div>
                )}
                {metaMap[BATCH_META_KEYS.manufacturingFacility] && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Manufacturing facility</p>
                      <p className="text-sm text-muted-foreground">{metaMap[BATCH_META_KEYS.manufacturingFacility]}</p>
                    </div>
                  </div>
                )}
                {metaMap[BATCH_META_KEYS.countryOfOrigin] && (
                  <div>
                    <p className="text-sm font-medium">Country of origin</p>
                    <p className="text-sm text-muted-foreground">{metaMap[BATCH_META_KEYS.countryOfOrigin]}</p>
                  </div>
                )}
                {metaMap[BATCH_META_KEYS.storageInstructions] && (
                  <div>
                    <p className="text-sm font-medium">Storage</p>
                    <p className="text-sm text-muted-foreground">{metaMap[BATCH_META_KEYS.storageInstructions]}</p>
                  </div>
                )}
                {metaMap[BATCH_META_KEYS.ingredients] && (
                  <div>
                    <p className="text-sm font-medium">Ingredients</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{metaMap[BATCH_META_KEYS.ingredients]}</p>
                  </div>
                )}
                {metaMap[BATCH_META_KEYS.allergenInfo] && (
                  <div>
                    <p className="text-sm font-medium">Allergens</p>
                    <p className="text-sm text-muted-foreground">{metaMap[BATCH_META_KEYS.allergenInfo]}</p>
                  </div>
                )}
                {metaMap[BATCH_META_KEYS.nutritionalInfo] && (
                  <div>
                    <p className="text-sm font-medium">Nutritional information</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{metaMap[BATCH_META_KEYS.nutritionalInfo]}</p>
                  </div>
                )}
                {metaMap.notes && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Notes</p>
                      <p className="text-sm text-muted-foreground">{metaMap.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Committed Messages ({megaQR.committedMessages.length})
              </h4>
              
              {megaQR.committedMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No messages committed yet
                </p>
              ) : (
                <div className="space-y-3">
                  {megaQR.committedMessages.map((msg, index) => (
                    <div 
                      key={index}
                      className="relative pl-6 pb-4 border-l-2 border-primary/20 last:border-transparent"
                    >
                      <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary" />
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm font-medium">{msg.msg}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{(msg as CommittedMessage & { by?: string }).by ?? msg.actorID}</span>
                          <span>•</span>
                          <span>{format(new Date(msg.ts), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Identifiers</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><span className="font-medium">Mega ID:</span> {megaQR.megaID}</p>
                <p><span className="font-medium">Hash:</span> {megaQR.megaHash}</p>
                <p><span className="font-medium">Created:</span> {format(new Date(megaQR.createdAt), 'PPpp')}</p>
                <p><span className="font-medium">Last Updated:</span> {format(new Date(megaQR.updatedAt), 'PPpp')}</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
