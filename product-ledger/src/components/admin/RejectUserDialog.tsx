import { useState } from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, XCircle } from 'lucide-react';

// Validation schema for rejection reason
const rejectionReasonSchema = z
  .string()
  .trim()
  .min(10, 'Reason must be at least 10 characters')
  .max(500, 'Reason must not exceed 500 characters');

interface RejectUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
  userName?: string;
}

export function RejectUserDialog({
  open,
  onOpenChange,
  onConfirm,
  userName,
}: RejectUserDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validate input
    const result = rejectionReasonSchema.safeParse(reason);
    
    if (!result.success) {
      setError(result.error.errors[0]?.message || 'Invalid input');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    
    try {
      // Sanitize: trim and normalize whitespace
      const sanitizedReason = result.data.replace(/\s+/g, ' ');
      await onConfirm(sanitizedReason);
      setReason('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Reject User
          </DialogTitle>
          <DialogDescription>
            {userName
              ? `Please provide a reason for rejecting ${userName}'s application.`
              : 'Please provide a reason for rejection.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">
              Rejection Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rejection-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Provide a detailed reason for rejection (10-500 characters)..."
              maxLength={500}
              rows={4}
              className={error ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{error && <span className="text-destructive">{error}</span>}</span>
              <span>{reason.length}/500</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || reason.trim().length < 10}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              'Confirm Rejection'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
