import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search, QrCode, Package, Hash, Calendar as CalendarIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import type { MegaQR } from '@/types/fabric';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { BATCH_META_KEYS, batchLotSizeDisplay, batchMetaGet } from '@/lib/batch-meta';
import { getBatchVerificationURL } from '@/lib/verification-urls';

interface AllQRCodesSectionProps {
  megaQRs: MegaQR[];
  lotSizes: Record<string, number>;
}

function downloadMegaPng(megaID: string) {
  const svgElement = document.getElementById(`all-qr-${megaID}`)?.querySelector('svg');
  if (!svgElement) {
    toast.error('QR not found');
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
    const a = document.createElement('a');
    a.download = `${megaID}.png`;
    a.href = pngFile;
    a.click();
    toast.success(`Downloaded ${megaID}.png`);
  };
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

function statusBadge(mega: MegaQR) {
  const isExpired = new Date(mega.expiryDate) < new Date();
  if (mega.status === 'recalled') {
    return <Badge variant="destructive">Recalled</Badge>;
  }
  if (isExpired) {
    return <Badge variant="destructive">Expired</Badge>;
  }
  return <Badge variant="outline" className="border-primary text-primary">Active</Badge>;
}

export function AllQRCodesSection({ megaQRs, lotSizes }: AllQRCodesSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const filtered = useMemo(() => {
    return megaQRs.filter((mega) => {
      if (searchTerm && !mega.product.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (statusFilter !== 'all') {
        const isExpired = new Date(mega.expiryDate) < new Date();
        if (statusFilter === 'active' && (mega.status === 'recalled' || isExpired)) return false;
        if (statusFilter === 'recalled' && mega.status !== 'recalled') return false;
        if (statusFilter === 'expired' && (!isExpired || mega.status === 'recalled')) return false;
      }
      const created = new Date(mega.createdAt);
      if (startDate && isBefore(created, startOfDay(startDate))) return false;
      if (endDate && isAfter(created, endOfDay(endDate))) return false;
      return true;
    });
  }, [megaQRs, searchTerm, statusFilter, startDate, endDate]);

  return (
    <div className="space-y-6">
      <Card className="card-elevated">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product name…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-[150px] justify-start text-left font-normal', !startDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'MMM d, yyyy') : 'From date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-[150px] justify-start text-left font-normal', !endDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'MMM d, yyyy') : 'To date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="recalled">Recalled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3 p-8 text-center text-muted-foreground">
            No batch QRs match your filters.
          </Card>
        ) : (
          filtered.map((mega) => {
            const lot = batchLotSizeDisplay(mega, lotSizes[mega.megaID] ?? 1000);
            const cat = batchMetaGet(mega, BATCH_META_KEYS.productCategory);
            return (
              <Card key={mega.megaID} className="card-elevated overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex gap-3">
                    <div
                      id={`all-qr-${mega.megaID}`}
                      className="shrink-0 rounded-lg border bg-background p-2"
                    >
                      <QRCodeSVG value={getBatchVerificationURL(mega.megaID)} size={96} level="M" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 leading-tight">
                        <Package className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">{mega.product}</span>
                      </CardTitle>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Hash className="h-3 w-3 shrink-0" />
                        <span className="truncate">{mega.batchNo}</span>
                      </div>
                      {cat && (
                        <p className="text-xs text-muted-foreground truncate">{cat}</p>
                      )}
                      <div className="pt-1">{statusBadge(mega)}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">{format(new Date(mega.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lot size</p>
                      <p className="font-medium">{lot.toLocaleString()} units</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Expires</p>
                      <p className="font-medium">{format(new Date(mega.expiryDate), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => downloadMegaPng(mega.megaID)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download QR
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <QrCode className="h-4 w-4" />
        Showing {filtered.length} of {megaQRs.length} batch QR codes
      </div>
    </div>
  );
}
