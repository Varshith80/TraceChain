import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2, PackageCheck, Store, ShoppingCart, RotateCcw, AlertTriangle, Edit3 } from 'lucide-react';
import type { ChildQR, RetailerMessage } from '@/types/fabric';
import { RETAILER_MESSAGE_TEMPLATES } from '@/types/fabric';
import { commitMessageToChild } from '@/services/api/fabric-api';

const PREDEFINED_MESSAGES = [
  { value: 'Received at Retailer', label: 'Received at Retailer', icon: PackageCheck, description: 'Product received at your store' },
  { value: 'Stocked', label: 'Stocked', icon: Store, description: 'Product added to inventory' },
  { value: 'On Shelf', label: 'On Shelf', icon: Store, description: 'Product placed on display shelf' },
  { value: 'Sold', label: 'Sold', icon: ShoppingCart, description: 'Product sold to customer' },
  { value: 'Returned', label: 'Returned', icon: RotateCcw, description: 'Product returned by customer' },
  { value: 'Damaged - Returned to Manufacturer', label: 'Damaged', icon: AlertTriangle, description: 'Product damaged, returning to manufacturer' },
  { value: 'custom', label: 'Custom Message', icon: Edit3, description: 'Enter a custom message' },
] as const;

const commitMessageSchema = z.object({
  messageType: z.string().min(1, 'Please select a message type'),
  customMessage: z.string().optional(),
}).refine((data) => {
  if (data.messageType === 'custom') {
    return data.customMessage && data.customMessage.trim().length >= 3;
  }
  return true;
}, {
  message: 'Custom message must be at least 3 characters',
  path: ['customMessage'],
});

type CommitMessageFormData = z.infer<typeof commitMessageSchema>;

interface CommitRetailerMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childQR: ChildQR | null;
  onSuccess?: () => void;
}

export function CommitRetailerMessageDialog({ open, onOpenChange, childQR, onSuccess }: CommitRetailerMessageDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CommitMessageFormData>({
    resolver: zodResolver(commitMessageSchema),
    defaultValues: {
      messageType: '',
      customMessage: '',
    },
  });

  const selectedType = form.watch('messageType');

  async function onSubmit(data: CommitMessageFormData) {
    if (!childQR) return;

    setIsSubmitting(true);
    try {
      const message = data.messageType === 'custom' ? data.customMessage! : data.messageType;
      
      const result = await commitMessageToChild(childQR.childID, { message });
      
      toast.success('Message committed successfully', {
        description: `"${message}" recorded for ${childQR.childID}${result.txID ? ` (tx: ${result.txID})` : ''}`,
      });
      
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to commit message', {
        description: 'Please try again or contact support',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!childQR) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Commit Message</DialogTitle>
          <DialogDescription>
            Record a status update for {childQR.productSnapshot.product} ({childQR.childID})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="messageType"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid gap-2"
                    >
                      {PREDEFINED_MESSAGES.map((msg) => {
                        const Icon = msg.icon;
                        return (
                          <Label
                            key={msg.value}
                            htmlFor={msg.value}
                            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                              field.value === msg.value ? 'border-primary bg-primary/5' : ''
                            }`}
                          >
                            <RadioGroupItem value={msg.value} id={msg.value} />
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{msg.label}</p>
                              <p className="text-xs text-muted-foreground">{msg.description}</p>
                            </div>
                          </Label>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedType === 'custom' && (
              <FormField
                control={form.control}
                name="customMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your custom message..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Commit to Blockchain
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
