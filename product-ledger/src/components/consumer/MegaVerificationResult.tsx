import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Building,
  Calendar,
  Hash,
  MessageSquare,
  Flag,
  ShieldCheck,
  MapPin,
  Scale,
  Leaf,
  Warehouse,
  Globe,
} from 'lucide-react';
import { format } from 'date-fns';
import type { MegaQR, CommittedMessage } from '@/types/fabric';
import { BATCH_META_KEYS, getBatchMetaMap, isVegFromMeta } from '@/lib/batch-meta';

interface MegaVerificationResultProps {
  megaQR: MegaQR;
  committedMessages?: CommittedMessage[];
  onReportCounterfeit: () => void;
}

export function MegaVerificationResult({
  megaQR,
  committedMessages = megaQR.committedMessages || [],
  onReportCounterfeit,
}: MegaVerificationResultProps) {
  const isRecalled = megaQR.status === 'recalled';
  const meta = getBatchMetaMap(megaQR);
  const veg = isVegFromMeta(megaQR);

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className={isRecalled ? 'border-destructive bg-destructive/5' : 'border-success bg-success/5'}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">{isRecalled ? 'Batch Recalled' : 'Batch Verified Authentic'}</h2>
              <p className="text-sm text-muted-foreground">
                {isRecalled
                  ? 'This batch has been recalled by the manufacturer.'
                  : 'This batch is recorded on the distributed ledger and matches live chain data.'}
              </p>
            </div>
            <Badge variant={isRecalled ? 'destructive' : 'outline'}>{isRecalled ? 'Recalled' : 'Active'}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <ShieldCheck className="h-8 w-8 text-primary shrink-0" />
          <div>
            <p className="font-semibold">Verified on blockchain</p>
            <p className="text-sm text-muted-foreground">
              Batch ID {megaQR.megaID} was read from the ledger for this check.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product &amp; batch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 text-sm">
            <div>
              <p className="text-lg font-semibold">{megaQR.product}</p>
              {meta[BATCH_META_KEYS.productCategory] && (
                <p className="text-muted-foreground">{meta[BATCH_META_KEYS.productCategory]}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Batch:</span>
              <span className="font-medium">{megaQR.batchNo}</span>
            </div>
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Manufacturer:</span>
              <span className="font-medium">{megaQR.manufacturerName || megaQR.manufacturerID}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Manufactured:</span>
              <span className="font-medium">{format(new Date(megaQR.mfgDate), 'PPP')}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Expires:</span>
              <span className="font-medium">{format(new Date(megaQR.expiryDate), 'PPP')}</span>
            </div>
            {meta[BATCH_META_KEYS.netQuantity] && (
              <div className="flex items-start gap-3">
                <Scale className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground">Net weight / quantity: </span>
                  <span className="font-medium">{meta[BATCH_META_KEYS.netQuantity]}</span>
                </div>
              </div>
            )}
            {veg !== null && (
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-muted-foreground" />
                <span className={`h-2.5 w-2.5 rounded-full ${veg ? 'bg-green-600' : 'bg-red-600'}`} />
                <span className="font-medium">{veg ? 'Vegetarian' : 'Non-vegetarian'}</span>
              </div>
            )}
            {meta[BATCH_META_KEYS.fssaiLicense] && (
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground">FSSAI license: </span>
                  <span className="font-medium">{meta[BATCH_META_KEYS.fssaiLicense]}</span>
                </div>
              </div>
            )}
            {meta[BATCH_META_KEYS.manufacturingFacility] && (
              <div className="flex items-start gap-3">
                <Warehouse className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground">Facility: </span>
                  <span className="font-medium">{meta[BATCH_META_KEYS.manufacturingFacility]}</span>
                </div>
              </div>
            )}
            {meta[BATCH_META_KEYS.storageInstructions] && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground">Storage: </span>
                  <span className="font-medium">{meta[BATCH_META_KEYS.storageInstructions]}</span>
                </div>
              </div>
            )}
            {meta[BATCH_META_KEYS.countryOfOrigin] && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Country of origin: </span>
                <span className="font-medium">{meta[BATCH_META_KEYS.countryOfOrigin]}</span>
              </div>
            )}
            {meta[BATCH_META_KEYS.ingredients] && (
              <div className="pt-2">
                <p className="text-sm font-medium text-muted-foreground mb-1">Ingredients</p>
                <p className="text-sm whitespace-pre-wrap">{meta[BATCH_META_KEYS.ingredients]}</p>
              </div>
            )}
            {meta[BATCH_META_KEYS.allergenInfo] && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Allergens</p>
                <p className="text-sm">{meta[BATCH_META_KEYS.allergenInfo]}</p>
              </div>
            )}
            {meta[BATCH_META_KEYS.nutritionalInfo] && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Nutritional information</p>
                <p className="text-sm whitespace-pre-wrap">{meta[BATCH_META_KEYS.nutritionalInfo]}</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              Supply chain updates
            </div>
            {committedMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No committed messages on this batch yet.</p>
            ) : (
              <div className="space-y-2">
                {committedMessages.slice(0, 12).map((msg: CommittedMessage & { by?: string }, idx) => (
                  <div key={idx} className="bg-muted/50 p-3 rounded-lg border-l-2 border-primary/40">
                    <p className="text-sm font-medium">{msg.msg ?? (msg as { message?: string }).message ?? ''}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(msg.by ?? msg.actorID) ? `By: ${msg.by ?? msg.actorID}` : ''}
                      {msg.ts ? ` • ${format(new Date(msg.ts), 'PPp')}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex items-center justify-between gap-4 pt-6">
          <div>
            <h4 className="font-medium">Something wrong?</h4>
            <p className="text-sm text-muted-foreground">Report if you suspect this batch is counterfeit</p>
          </div>
          <Button variant="outline" onClick={onReportCounterfeit}>
            <Flag className="mr-2 h-4 w-4" />
            Report Issue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
