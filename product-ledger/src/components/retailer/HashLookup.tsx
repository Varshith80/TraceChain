import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hash, Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getChildQR, getMegaQR } from '@/services/api/fabric-api';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface LookupResult {
  type: 'mega' | 'child';
  id: string;
  product: string;
  batchNo: string;
  status: string;
  manufacturerName: string;
  mfgDate: string;
  expiryDate: string;
  hash: string;
}

export function HashLookup() {
  const [hash, setHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleLookup = async () => {
    if (!hash.trim()) {
      toast.error('Please enter a hash or ID');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setNotFound(false);

    try {
      // First try to find by child_id
      try {
        const childQR = await getChildQR(hash);
        if (childQR) {
          setResult({
            type: 'child',
            id: childQR.childID,
            product: childQR.productSnapshot.product,
            batchNo: childQR.productSnapshot.batchNo,
            status: childQR.status,
            manufacturerName: childQR.productSnapshot.manufacturerName || 'Unknown',
            mfgDate: childQR.productSnapshot.mfgDate,
            expiryDate: childQR.productSnapshot.expiryDate,
            hash: childQR.childHash,
          });
          setIsLoading(false);
          return;
        }
      } catch (e) {
        // Not a child QR, try mega QR
      }

      // Try to find by mega_id
      try {
        const megaQR = await getMegaQR(hash);
        if (megaQR) {
          setResult({
            type: 'mega',
            id: megaQR.megaID,
            product: megaQR.product,
            batchNo: megaQR.batchNo,
            status: megaQR.status,
            manufacturerName: megaQR.manufacturerName || 'Unknown',
            mfgDate: megaQR.mfgDate,
            expiryDate: megaQR.expiryDate,
            hash: megaQR.megaHash,
          });
          setIsLoading(false);
          return;
        }
      } catch (e) {
        // Not found
      }

      setNotFound(true);
    } catch (error) {
      console.error('Lookup error:', error);
      toast.error('Failed to lookup product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          Product Verification
        </CardTitle>
        <CardDescription>
          Enter a product ID or hash to verify authenticity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter product ID or hash..."
            value={hash}
            onChange={e => setHash(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
            className="font-mono"
          />
          <Button onClick={handleLookup} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {notFound && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <XCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Product Not Found</p>
              <p className="text-sm text-muted-foreground">
                No product found with the provided ID or hash.
              </p>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold">Product Found</span>
              </div>
              <Badge variant={result.status === 'active' ? 'default' : 'destructive'}>
                {result.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">{result.type === 'mega' ? 'Batch (MegaQR)' : 'Unit (ChildQR)'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">ID</p>
                <p className="font-mono text-xs">{result.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Product</p>
                <p className="font-medium">{result.product}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Batch No</p>
                <p className="font-medium">{result.batchNo}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Manufacturer</p>
                <p className="font-medium">{result.manufacturerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Mfg Date</p>
                <p className="font-medium">{format(new Date(result.mfgDate), 'PP')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Expiry Date</p>
                <p className="font-medium">{format(new Date(result.expiryDate), 'PP')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Hash</p>
                <p className="font-mono text-xs break-all">{result.hash.substring(0, 32)}...</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
