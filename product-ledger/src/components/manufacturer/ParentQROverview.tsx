import { useState } from 'react';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Package, 
  Calendar as CalendarIcon, 
  Hash, 
  Download,
  X,
  Filter,
  MapPin,
  Scale,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { MegaQR } from '@/types/fabric';
import { getBatchVerificationURL } from '@/lib/verification-urls';
import { BATCH_META_KEYS, batchLotSizeDisplay, batchMetaGet, isVegFromMeta } from '@/lib/batch-meta';

interface ParentQROverviewProps {
  megaQRs: MegaQR[];
  lotSizes: Record<string, number>;
}

export function ParentQROverview({
  megaQRs,
  lotSizes,
}: ParentQROverviewProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const filteredMegaQRs = megaQRs.filter(mega => {
    const createdDate = new Date(mega.createdAt);
    
    if (startDate && isBefore(createdDate, startOfDay(startDate))) {
      return false;
    }
    if (endDate && isAfter(createdDate, endOfDay(endDate))) {
      return false;
    }
    return true;
  });

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const downloadMegaQR = (megaId: string) => {
    const svgElement = document.getElementById(`mega-qr-${megaId}`)?.querySelector('svg');
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
      downloadLink.download = `${megaId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success(`Downloaded ${megaId}`);
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const getStatusBadge = (mega: MegaQR) => {
    const isExpired = new Date(mega.expiryDate) < new Date();
    if (mega.status === 'recalled') {
      return <Badge variant="destructive">Recalled</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return <Badge variant="outline" className="border-primary text-primary">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card className="card-elevated">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by created date</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[150px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-muted-foreground">to</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[150px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {(startDate || endDate) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Batch QR Codes ({filteredMegaQRs.length})
          </h3>
        </div>

        {filteredMegaQRs.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No batch QR codes found for the selected filters.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMegaQRs.map(mega => {
              const lot = batchLotSizeDisplay(mega, lotSizes[mega.megaID] || 1000);
              const cat = batchMetaGet(mega, BATCH_META_KEYS.productCategory);
              const net = batchMetaGet(mega, BATCH_META_KEYS.netQuantity);
              const fssai = batchMetaGet(mega, BATCH_META_KEYS.fssaiLicense);
              const facility = batchMetaGet(mega, BATCH_META_KEYS.manufacturingFacility);
              const storage = batchMetaGet(mega, BATCH_META_KEYS.storageInstructions);
              const origin = batchMetaGet(mega, BATCH_META_KEYS.countryOfOrigin);
              const ingredients = batchMetaGet(mega, BATCH_META_KEYS.ingredients);
              const allergens = batchMetaGet(mega, BATCH_META_KEYS.allergenInfo);
              const nutrition = batchMetaGet(mega, BATCH_META_KEYS.nutritionalInfo);
              const veg = isVegFromMeta(mega);

              return (
                <Card key={mega.megaID} className="card-elevated">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-4">
                        <div 
                          id={`mega-qr-${mega.megaID}`}
                          className="bg-background p-2 rounded-lg border shrink-0"
                        >
                          <QRCodeSVG 
                            value={getBatchVerificationURL(mega.megaID)}
                            size={80}
                            level="M"
                          />
                        </div>

                        <div className="space-y-1 min-w-0">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary shrink-0" />
                            <span className="break-words">{mega.product}</span>
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Hash className="h-3.5 w-3.5 shrink-0" />
                            {mega.batchNo}
                          </div>
                          {cat && (
                            <p className="text-sm text-muted-foreground">{cat}</p>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            Created: {format(new Date(mega.createdAt), 'MMM d, yyyy')}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {getStatusBadge(mega)}
                            {veg !== null && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className={`h-2 w-2 rounded-full ${veg ? 'bg-green-600' : 'bg-red-600'}`} />
                                {veg ? 'Veg' : 'Non-Veg'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => downloadMegaQR(mega.megaID)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download QR
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-3 text-sm border-t pt-4 sm:grid-cols-2">
                      <div className="flex gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Manufactured / Expires</p>
                          <p className="font-medium">
                            {format(new Date(mega.mfgDate), 'MMM d, yyyy')} — {format(new Date(mega.expiryDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Scale className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Lot size / Net qty</p>
                          <p className="font-medium">
                            {lot.toLocaleString()} units
                            {net ? ` · ${net}` : ''}
                          </p>
                        </div>
                      </div>
                      {fssai && (
                        <div className="flex gap-2 sm:col-span-2">
                          <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">FSSAI license</p>
                            <p className="font-medium">{fssai}</p>
                          </div>
                        </div>
                      )}
                      {facility && (
                        <div className="flex gap-2 sm:col-span-2">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Manufacturing facility</p>
                            <p className="font-medium">{facility}</p>
                          </div>
                        </div>
                      )}
                      {origin && (
                        <p className="text-muted-foreground sm:col-span-2">
                          <span className="font-medium text-foreground">Country of sale / origin: </span>
                          {origin}
                        </p>
                      )}
                      {storage && (
                        <p className="text-muted-foreground sm:col-span-2">
                          <span className="font-medium text-foreground">Storage: </span>
                          {storage}
                        </p>
                      )}
                      {ingredients && (
                        <p className="text-muted-foreground sm:col-span-2 text-xs">
                          <span className="font-medium text-foreground">Ingredients: </span>
                          {ingredients}
                        </p>
                      )}
                      {allergens && (
                        <p className="text-muted-foreground sm:col-span-2 text-xs">
                          <span className="font-medium text-foreground">Allergens: </span>
                          {allergens}
                        </p>
                      )}
                      {nutrition && (
                        <p className="text-muted-foreground sm:col-span-2 text-xs whitespace-pre-wrap">
                          <span className="font-medium text-foreground">Nutrition: </span>
                          {nutrition}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
