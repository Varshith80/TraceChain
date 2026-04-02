import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Eye, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import type { ChildQR } from '@/types/fabric';

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

interface QRCodeGridProps {
  children: ChildQR[];
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onViewDetails?: (child: ChildQR) => void;
}

export function QRCodeGrid({ 
  children, 
  selectable = false, 
  selectedIds = [],
  onSelectionChange,
  onViewDetails 
}: QRCodeGridProps) {
  const downloadQRCode = (childId: string, childHash: string) => {
    const svgElement = document.getElementById(`qr-${childId}`)?.querySelector('svg');
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
      downloadLink.download = `${childId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success(`Downloaded ${childId}`);
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleSelectToggle = (childId: string) => {
    if (!onSelectionChange) return;
    
    if (selectedIds.includes(childId)) {
      onSelectionChange(selectedIds.filter(id => id !== childId));
    } else {
      onSelectionChange([...selectedIds, childId]);
    }
  };

  const getStatusBadge = (status: ChildQR['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="border-primary text-primary text-xs">Active</Badge>;
      case 'sold':
        return <Badge variant="secondary" className="text-xs">Sold</Badge>;
      case 'recalled':
        return <Badge variant="destructive" className="text-xs">Recalled</Badge>;
      case 'returned':
        return <Badge variant="outline" className="border-warning text-warning text-xs">Returned</Badge>;
      default:
        return null;
    }
  };

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <QrCode className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No QR codes generated yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {children.map(child => (
        <Card 
          key={child.childID} 
          className={`card-elevated transition-all ${
            selectedIds.includes(child.childID) ? 'ring-2 ring-primary' : ''
          }`}
        >
          <CardContent className="p-3 space-y-3">
            {selectable && (
              <div className="flex justify-end">
                <Checkbox
                  checked={selectedIds.includes(child.childID)}
                  onCheckedChange={() => handleSelectToggle(child.childID)}
                />
              </div>
            )}
            
            <div 
              id={`qr-${child.childID}`} 
              className="flex justify-center bg-background p-2 rounded"
            >
              <QRCodeSVG 
                value={getVerificationURL(child.childID)}
                size={100}
                level="M"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-xs font-mono text-center truncate">{child.childID}</p>
              {getStatusBadge(child.status)}
            </div>
            
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1 h-8"
                onClick={() => onViewDetails?.(child)}
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1 h-8"
                onClick={() => downloadQRCode(child.childID, child.childHash)}
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
