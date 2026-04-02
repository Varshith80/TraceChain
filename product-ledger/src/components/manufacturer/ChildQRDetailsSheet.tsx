import { QRCodeSVG } from 'qrcode.react';

/**
 * Generate verification URL for QR code
 * Architecture: QR codes must resolve to verification URL
 * Format: https://verify.<domain>/v/{childID}
 * No sensitive data embedded - only childID
 */
function getVerificationURL(childID: string): string {
  const verifyDomain = import.meta.env.VITE_VERIFY_DOMAIN;
  const protocol = import.meta.env.VITE_VERIFY_PROTOCOL || 'https';
  const domain = verifyDomain || window.location.host;
  return `${protocol}://${domain}/v/${childID}`;
}
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, 
  Calendar, 
  Hash, 
  MessageSquare, 
  Clock,
  User,
  Download,
  MapPin,
  Smartphone
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { ChildQR } from '@/types/fabric';

interface ChildQRDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childQR: ChildQR | null;
}

export function ChildQRDetailsSheet({ open, onOpenChange, childQR }: ChildQRDetailsSheetProps) {
  if (!childQR) return null;

  const downloadQRCode = () => {
    const svgElement = document.getElementById('child-qr-detail')?.querySelector('svg');
    if (!svgElement) {
      toast.error('QR Code not found');
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
      downloadLink.download = `${childQR.childID}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success(`Downloaded ${childQR.childID}`);
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const getStatusBadge = () => {
    switch (childQR.status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'sold':
        return <Badge variant="secondary">Sold</Badge>;
      case 'recalled':
        return <Badge variant="destructive">Recalled</Badge>;
      case 'returned':
        return <Badge variant="outline" className="border-warning text-warning">Returned</Badge>;
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            {childQR.childID}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            {childQR.productSnapshot.product}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          <div className="space-y-6">
            {/* QR Code */}
            <div className="flex flex-col items-center gap-4">
              <div id="child-qr-detail" className="bg-background p-4 rounded-lg border">
                <QRCodeSVG 
                  value={getVerificationURL(childQR.childID)}
                  size={180}
                  level="H"
                />
              </div>
              <Button variant="outline" onClick={downloadQRCode}>
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              {getStatusBadge()}
            </div>

            <Separator />

            {/* Product Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Product Details</h4>
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Product</p>
                    <p className="text-sm text-muted-foreground">{childQR.productSnapshot.product}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Batch Number</p>
                    <p className="text-sm text-muted-foreground">{childQR.productSnapshot.batchNo}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Manufacturing Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(childQR.productSnapshot.mfgDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Expiry Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(childQR.productSnapshot.expiryDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Scan Logs */}
            {childQR.scanEvents && childQR.scanEvents.length > 0 && (
              <>
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Scan History ({childQR.scanEvents.length})
                  </h4>
                  <div className="space-y-3">
                    {childQR.scanEvents.map((log, index) => (
                      <div 
                        key={index}
                        className="bg-muted/50 p-3 rounded-lg space-y-2"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Actor: {log.actorID}</span>
                        </div>
                        {log.location && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{log.location}</span>
                          </div>
                        )}
                        {log.device && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Smartphone className="h-3 w-3" />
                            <span>{log.device}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.ts), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Committed Messages */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages ({childQR.committedMessages.length})
              </h4>
              
              {childQR.committedMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No messages committed yet
                </p>
              ) : (
                <div className="space-y-3">
                  {childQR.committedMessages.map((msg, index) => (
                    <div 
                      key={index}
                      className="relative pl-6 pb-4 border-l-2 border-primary/20 last:border-transparent"
                    >
                      <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary" />
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm font-medium">{msg.msg}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{msg.actorID}</span>
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

            {/* Metadata */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Metadata</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><span className="font-medium">Child ID:</span> {childQR.childID}</p>
                <p><span className="font-medium">Hash:</span> {childQR.childHash}</p>
                <p><span className="font-medium">Mega ID:</span> {childQR.megaID}</p>
                <p><span className="font-medium">Created:</span> {format(new Date(childQR.createdAt), 'PPpp')}</p>
                <p><span className="font-medium">Last Updated:</span> {format(new Date(childQR.updatedAt), 'PPpp')}</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
