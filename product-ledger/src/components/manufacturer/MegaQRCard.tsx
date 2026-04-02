import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Package, 
  Calendar, 
  Hash, 
  QrCode, 
  MessageSquare, 
  MoreVertical,
  Eye,
  Download,
  Clock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import type { MegaQR } from '@/types/fabric';
import { BATCH_META_KEYS, batchMetaGet, isVegFromMeta } from '@/lib/batch-meta';
import { getBatchVerificationURL } from '@/lib/verification-urls';
import { toast } from 'sonner';

interface MegaQRCardProps {
  megaQR: MegaQR;
  onCommitMessage: (megaQR: MegaQR) => void;
  onViewDetails: (megaQR: MegaQR) => void;
}

function downloadQrFromDom(elementId: string, filename: string) {
  const svgElement = document.getElementById(elementId)?.querySelector('svg');
  if (!svgElement) {
    toast.error('QR preview not ready');
    return;
  }
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
    const pngFile = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.download = filename;
    downloadLink.href = pngFile;
    downloadLink.click();
    toast.success(`Downloaded ${filename}`);
  };
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

export function MegaQRCard({ megaQR, onCommitMessage, onViewDetails }: MegaQRCardProps) {
  const [qrOpen, setQrOpen] = useState(false);
  const isExpired = new Date(megaQR.expiryDate) < new Date();
  const isNearExpiry = !isExpired && new Date(megaQR.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const fixedNetQty = batchMetaGet(megaQR, BATCH_META_KEYS.netQuantity);
  const fssai =
    batchMetaGet(megaQR, BATCH_META_KEYS.fssaiLicense);
  const vegState = isVegFromMeta(megaQR);
  const qrId = `mega-qr-card-${megaQR.megaID}`;
  const verifyUrl = getBatchVerificationURL(megaQR.megaID);

  const getStatusBadge = () => {
    if (megaQR.status === 'recalled') {
      return <Badge variant="destructive">Recalled</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (isNearExpiry) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Near Expiry</Badge>;
    }
    return <Badge variant="outline" className="border-primary text-primary">Active</Badge>;
  };

  return (
    <>
      <Card className="card-elevated hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {megaQR.product}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-3.5 w-3.5" />
                {megaQR.batchNo}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {fixedNetQty && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    Net: {fixedNetQty}
                  </Badge>
                )}
                {fssai && (
                  <Badge variant="outline" className="text-xs font-normal">
                    FSSAI: {fssai}
                  </Badge>
                )}
                {vegState !== null && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${vegState ? 'bg-green-600' : 'bg-red-600'}`}
                      title={vegState ? 'Vegetarian' : 'Non-vegetarian'}
                    />
                    {vegState ? 'Veg' : 'Non-Veg'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onViewDetails(megaQR)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setQrOpen(true)}>
                    <QrCode className="mr-2 h-4 w-4" />
                    View QR
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCommitMessage(megaQR)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Commit Message
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => downloadQrFromDom(qrId, `${megaQR.megaID}.png`)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download QR
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Manufactured</p>
                <p className="font-medium">{format(new Date(megaQR.mfgDate), 'MMM d, yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Expires</p>
                <p className={`font-medium ${isExpired ? 'text-destructive' : isNearExpiry ? 'text-yellow-600' : ''}`}>
                  {format(new Date(megaQR.expiryDate), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              Committed Messages
            </span>
            <span className="font-medium">{megaQR.committedMessages.length}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={() => setQrOpen(true)}
            >
              <QrCode className="mr-1.5 h-3.5 w-3.5" />
              View QR
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onCommitMessage(megaQR)}
              disabled={megaQR.status === 'recalled'}
            >
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              Commit
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Batch QR — {megaQR.product}</DialogTitle>
            <DialogDescription>
              Scan to verify this batch. Batch ID: {megaQR.batchNo}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div id={qrId} className="rounded-lg border bg-background p-4">
              <QRCodeSVG value={verifyUrl} size={200} level="M" />
            </div>
            <p className="text-xs text-muted-foreground break-all text-center max-w-full">{verifyUrl}</p>
            <Button
              type="button"
              onClick={() => downloadQrFromDom(qrId, `${megaQR.megaID}.png`)}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
