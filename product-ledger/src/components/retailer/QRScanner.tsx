import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CameraOff, FlipHorizontal, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (code: string) => void;
  isScanning: boolean;
  onToggleScan: () => void;
}

export function QRScanner({ onScan, isScanning, onToggleScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastScanRef = useRef<{ value: string; ts: number } | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setHasCamera(true);
    } catch (error) {
      console.error('Camera error:', error);
      setHasCamera(false);
      toast.error('Camera access denied', {
        description: 'Please allow camera access or use manual entry.',
      });
    }
  }, [facingMode]);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (code?.data) {
      // Debounce identical scans
      const now = Date.now();
      const last = lastScanRef.current;
      if (!last || last.value !== code.data || now - last.ts > 2000) {
        lastScanRef.current = { value: code.data, ts: now };
        onScan(code.data);
        toast.success('QR Code detected!', { description: code.data });
      }
    }
    
    animationRef.current = requestAnimationFrame(scanFrame);
  }, [isScanning]);

  useEffect(() => {
    if (isScanning) {
      startCamera();
      animationRef.current = requestAnimationFrame(scanFrame);
    } else {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [isScanning, startCamera, stopCamera, scanFrame]);

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    if (isScanning) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          QR Scanner
        </CardTitle>
        <CardDescription>
          Scan a Mega QR code to view batch details and all child products
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isScanning && hasCamera ? (
          <div className="relative overflow-hidden rounded-lg bg-black aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-primary rounded-lg relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br" />
                {/* Scanning line animation */}
                <div className="absolute left-0 right-0 h-0.5 bg-primary animate-pulse top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            {/* Controls overlay */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              <Button size="sm" variant="secondary" onClick={toggleFacingMode}>
                <FlipHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
            <QrCode className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              {hasCamera ? 'Camera is ready to scan' : 'Camera not available'}
            </p>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            onClick={onToggleScan}
            variant={isScanning ? 'destructive' : 'default'}
            className="flex-1"
          >
            {isScanning ? (
              <>
                <CameraOff className="mr-2 h-4 w-4" />
                Stop Scanning
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
