import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { MessageSquare, Loader2, AlertCircle, Package, CheckCircle, Truck, ClipboardCheck } from 'lucide-react';
import type { MegaQR, CommittedMessage } from '@/types/fabric';
import { commitMessageToMega } from '@/services/api/fabric-api';

const PREDEFINED_MESSAGES = [
  { id: 'packed', label: 'Packed', icon: Package, description: 'Products have been packed' },
  { id: 'quality_checked', label: 'Quality Checked', icon: CheckCircle, description: 'Quality inspection completed' },
  { id: 'shipped', label: 'Shipped', icon: Truck, description: 'Products have been dispatched' },
  { id: 'ready_distribution', label: 'Ready for Distribution', icon: ClipboardCheck, description: 'Ready for retail distribution' },
  { id: 'custom', label: 'Custom Message', icon: MessageSquare, description: 'Enter your own message' },
];

const commitMessageSchema = z.object({
  messageType: z.string().min(1, 'Please select a message type'),
  customMessage: z.string().max(500, 'Max 500 characters').optional(),
}).refine(data => {
  if (data.messageType === 'custom') {
    return data.customMessage && data.customMessage.trim().length > 0;
  }
  return true;
}, {
  message: 'Custom message is required',
  path: ['customMessage'],
});

type CommitMessageFormData = z.infer<typeof commitMessageSchema>;

interface CommitMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  megaQR: MegaQR | null;
  onSuccess: () => void;
}

export function CommitMessageDialog({ open, onOpenChange, megaQR, onSuccess }: CommitMessageDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CommitMessageFormData>({
    resolver: zodResolver(commitMessageSchema),
    defaultValues: {
      messageType: '',
      customMessage: '',
    },
  });

  const selectedType = form.watch('messageType');

  const onSubmit = async (data: CommitMessageFormData) => {
    if (!megaQR) return;

    setIsSubmitting(true);
    try {
      const messageText = data.messageType === 'custom' 
        ? data.customMessage!
        : PREDEFINED_MESSAGES.find(m => m.id === data.messageType)?.label || data.messageType;

      await commitMessageToMega(megaQR.megaID, { message: messageText });

      onSuccess();
      toast.success('Message committed successfully', {
        description: `This message will propagate to all ${megaQR.childList.length} child QRs`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to commit message');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!megaQR) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Commit Message to Batch
          </DialogTitle>
          <DialogDescription>
            Add a status update to <span className="font-medium">{megaQR.product}</span>
          </DialogDescription>
        </DialogHeader>

        <Alert variant="default" className="border-primary/30 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription>
            This message will be permanently recorded on the blockchain and propagated to all{' '}
            <span className="font-medium">{megaQR.childList.length.toLocaleString()}</span> child QR codes.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="messageType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Message</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="space-y-2"
                    >
                      {PREDEFINED_MESSAGES.map((msg) => {
                        const Icon = msg.icon;
                        return (
                          <label
                            key={msg.id}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                              field.value === msg.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <RadioGroupItem value={msg.id} />
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{msg.label}</p>
                              <p className="text-xs text-muted-foreground">{msg.description}</p>
                            </div>
                          </label>
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
                    <FormLabel>Custom Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your custom status message..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Committing...
                  </>
                ) : (
                  'Commit Message'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
