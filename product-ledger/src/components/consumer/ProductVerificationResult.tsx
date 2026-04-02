import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  ShieldAlert,
  Package,
  Building,
  Calendar,
  Hash,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flag,
} from 'lucide-react';
import type { ChildQR } from '@/types/fabric';
import { format } from 'date-fns';

interface ProductVerificationResultProps {
  childQR: ChildQR;
  onReportCounterfeit: () => void;
}

export function ProductVerificationResult({ childQR, onReportCounterfeit }: ProductVerificationResultProps) {
  const { productSnapshot, committedMessages, status } = childQR;
  
  const isAuthentic = status === 'active' || status === 'sold';
  const isRecalled = status === 'recalled';

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Verification Status Banner */}
      <Card className={isRecalled ? 'border-destructive bg-destructive/5' : isAuthentic ? 'border-success bg-success/5' : 'border-warning bg-warning/5'}>
        <CardContent className="flex items-center gap-4 pt-6">
          {isRecalled ? (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-destructive/20">
              <ShieldAlert className="h-7 w-7 text-destructive" />
            </div>
          ) : isAuthentic ? (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-success/20">
              <ShieldCheck className="h-7 w-7 text-success" />
            </div>
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-warning/20">
              <AlertTriangle className="h-7 w-7 text-warning" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">
              {isRecalled ? 'Product Recalled' : isAuthentic ? 'Verified Authentic' : 'Verification Warning'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isRecalled
                ? 'This product has been recalled by the manufacturer'
                : isAuthentic
                ? 'This product is genuine and verified on blockchain'
                : 'This product may have issues - check details below'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Product Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{productSnapshot.product}</h3>
            <StatusBadge status={status} />
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Product ID:</span>
              <span className="font-mono font-medium">{childQR.childID}</span>
            </div>
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Batch:</span>
              <span className="font-medium">{productSnapshot.batchNo}</span>
            </div>
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Manufacturer:</span>
              <span className="font-medium">{productSnapshot.manufacturerName || productSnapshot.manufacturerID}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Manufactured:</span>
              <span className="font-medium">{format(new Date(productSnapshot.mfgDate), 'PPP')}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Expires:</span>
              <span className="font-medium">{format(new Date(productSnapshot.expiryDate), 'PPP')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Journey */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Product Journey
          </CardTitle>
          <CardDescription>
            Complete history from manufacturing to your hands
          </CardDescription>
        </CardHeader>
        <CardContent>
          {committedMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No journey data available</p>
          ) : (
            <div className="relative pl-6">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-0.5 bg-border" />
              
              <div className="space-y-4">
                {committedMessages.map((msg, idx) => (
                  <div key={idx} className="relative flex gap-3">
                    {/* Timeline dot */}
                    <div className={`absolute -left-6 flex h-4 w-4 items-center justify-center rounded-full ${
                      idx === committedMessages.length - 1 ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}>
                      <CheckCircle2 className={`h-3 w-3 ${
                        idx === committedMessages.length - 1 ? 'text-primary-foreground' : 'text-muted-foreground'
                      }`} />
                    </div>
                    
                    <div className="flex-1 rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{msg.msg}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(msg.ts), 'PP')}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>By: {msg.by}</span>
                        {msg.location && (
                          <>
                            <span>•</span>
                            <MapPin className="h-3 w-3" />
                            <span>{msg.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Button */}
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-between gap-4 pt-6">
          <div>
            <h4 className="font-medium">Something wrong?</h4>
            <p className="text-sm text-muted-foreground">Report if you suspect this product is counterfeit</p>
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
