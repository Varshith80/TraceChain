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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2, Flag } from 'lucide-react';
import type { ChildQR } from '@/types/fabric';
import { submitCounterfeitReport } from '@/services/api/fabric-api';

const reportSchema = z.object({
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  description: z.string().min(10, 'Please provide more details (at least 10 characters)'),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportCounterfeitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childQR: ChildQR | null;
}

export function ReportCounterfeitDialog({ open, onOpenChange, childQR }: ReportCounterfeitDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      email: '',
      phone: '',
      description: '',
    },
  });

  async function onSubmit(data: ReportFormData) {
    if (!childQR) return;

    setIsSubmitting(true);
    try {
      await submitCounterfeitReport({
        childID: childQR.childID,
        megaID: childQR.megaID,
        description: data.description,
        evidence: [],
      });
      
      toast.success('Report submitted', {
        description: 'Thank you for reporting. We will investigate this issue.',
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to submit report', {
        description: 'Please try again later',
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
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Report Counterfeit
          </DialogTitle>
          <DialogDescription>
            Report a suspected counterfeit product: {childQR.childID}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+91 98765 43210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe why you believe this product is counterfeit..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Report
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
