import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Package, Calendar as CalendarIcon, Hash, FileText, Loader2, Leaf } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import type { MegaQR } from '@/types/fabric';
import { createMegaQR, getMegaQR } from '@/services/api/fabric-api';
import { BATCH_META_KEYS } from '@/lib/batch-meta';

const PRODUCT_CATEGORIES = [
  'Food & Beverage',
  'Pharma',
  'Electronics',
  'Cosmetics',
  'Other',
] as const;

const createMegaQRSchema = z.object({
  product: z.string().min(1, 'Product name is required').max(100, 'Max 100 characters'),
  batchNo: z.string().min(1, 'Batch number is required').max(50, 'Max 50 characters'),
  mfgDate: z.string().min(1, 'Manufacturing date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  lotSize: z.coerce.number().min(1, 'Lot size must be at least 1').max(100000, 'Max 100,000'),
  productCategory: z.enum(PRODUCT_CATEGORIES),
  netQuantity: z.string().min(1, 'Net weight / quantity is required').max(80, 'Max 80 characters'),
  ingredients: z.string().max(4000, 'Max 4000 characters').optional(),
  allergenInfo: z.string().max(1000, 'Max 1000 characters').optional(),
  isVeg: z.boolean(),
  fssaiLicense: z.string().max(120, 'Max 120 characters').optional(),
  manufacturingFacility: z.string().min(1, 'Facility name is required').max(200, 'Max 200 characters'),
  storageInstructions: z.string().min(1, 'Storage instructions are required').max(500, 'Max 500 characters'),
  countryOfOrigin: z.string().min(1, 'Country of origin is required').max(80, 'Max 80 characters'),
  nutritionalInfo: z.string().max(4000, 'Max 4000 characters').optional(),
  notes: z.string().max(500, 'Max 500 characters').optional(),
}).refine(data => new Date(data.expiryDate) > new Date(data.mfgDate), {
  message: 'Expiry date must be after manufacturing date',
  path: ['expiryDate'],
});

type CreateMegaQRFormData = z.infer<typeof createMegaQRSchema>;

interface CreateMegaQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (megaQR: MegaQR, lotSize: number) => void;
}

export function CreateMegaQRDialog({ open, onOpenChange, onSuccess }: CreateMegaQRDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateMegaQRFormData>({
    resolver: zodResolver(createMegaQRSchema),
    defaultValues: {
      product: '',
      batchNo: '',
      mfgDate: '',
      expiryDate: '',
      lotSize: 100,
      productCategory: 'Food & Beverage',
      netQuantity: '',
      ingredients: '',
      allergenInfo: '',
      isVeg: true,
      fssaiLicense: '',
      manufacturingFacility: '',
      storageInstructions: '',
      countryOfOrigin: 'India',
      nutritionalInfo: '',
      notes: '',
    },
  });

  const onSubmit = async (data: CreateMegaQRFormData) => {
    setIsSubmitting(true);
    try {
      const customFields: Record<string, string> = {
        [BATCH_META_KEYS.productCategory]: data.productCategory,
        [BATCH_META_KEYS.netQuantity]: data.netQuantity,
        [BATCH_META_KEYS.vegIndicator]: data.isVeg ? 'veg' : 'nonveg',
        [BATCH_META_KEYS.manufacturingFacility]: data.manufacturingFacility,
        [BATCH_META_KEYS.storageInstructions]: data.storageInstructions,
        [BATCH_META_KEYS.countryOfOrigin]: data.countryOfOrigin,
        [BATCH_META_KEYS.lotSize]: String(data.lotSize),
      };
      if (data.ingredients?.trim()) customFields[BATCH_META_KEYS.ingredients] = data.ingredients.trim();
      if (data.allergenInfo?.trim()) customFields[BATCH_META_KEYS.allergenInfo] = data.allergenInfo.trim();
      if (data.fssaiLicense?.trim()) customFields[BATCH_META_KEYS.fssaiLicense] = data.fssaiLicense.trim();
      if (data.nutritionalInfo?.trim()) customFields[BATCH_META_KEYS.nutritionalInfo] = data.nutritionalInfo.trim();

      const created = await createMegaQR({
        product: data.product,
        batchNo: data.batchNo,
        mfgDate: data.mfgDate,
        expiryDate: data.expiryDate,
        lotSize: data.lotSize,
        meta: {
          notes: data.notes?.trim() || undefined,
          customFields,
        },
      });

      const newMegaQR: MegaQR = await getMegaQR(created.megaID);

      onSuccess(newMegaQR, data.lotSize);
      toast.success('Batch QR created successfully');
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to create batch QR');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Create Batch QR
          </DialogTitle>
          <DialogDescription>
            Register a batch on the ledger with product and compliance-style metadata (FSSAI-oriented fields).
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] px-6">
          <Form {...form}>
            <form id="create-mega-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-4 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Basic info</p>
              </div>

              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Multigrain Biscuits" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="batchNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch / Lot Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="e.g., LOT-2026-03-A" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="mfgDate"
                  render={({ field }) => {
                    const selected =
                      field.value && isValid(parseISO(field.value)) ? parseISO(field.value) : undefined;
                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel>Manufacturing Date</FormLabel>
                        <Popover modal={false}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                                {selected ? format(selected, 'MMM d, yyyy') : 'Pick date'}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selected}
                              onSelect={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => {
                    const selected =
                      field.value && isValid(parseISO(field.value)) ? parseISO(field.value) : undefined;
                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel>Expiry Date</FormLabel>
                        <Popover modal={false}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                                {selected ? format(selected, 'MMM d, yyyy') : 'Pick date'}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selected}
                              onSelect={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <FormField
                control={form.control}
                name="lotSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lot Size (units in this batch)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={100000} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-1 pt-2 border-t">
                <p className="text-sm font-medium text-muted-foreground">Compliance &amp; packaging</p>
              </div>

              <FormField
                control={form.control}
                name="productCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="netQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Net Weight / Quantity</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 200g, 500ml, 1L" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ingredients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ingredients</FormLabel>
                    <FormControl>
                      <Textarea placeholder="List ingredients as on label…" className="min-h-[72px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allergenInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allergen Info</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Contains: Milk, Wheat, Nuts" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isVeg"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2 text-base">
                        <Leaf className="h-4 w-4" />
                        Veg / Non-Veg
                      </FormLabel>
                      <FormDescription>
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-600" /> Veg
                          <span className="inline-block h-2 w-2 rounded-full bg-red-600 ml-2" /> Non-Veg
                        </span>
                      </FormDescription>
                    </div>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${field.value ? 'text-green-700 font-medium' : 'text-muted-foreground'}`}>Veg</span>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                        <span className={`text-xs ${!field.value ? 'text-red-700 font-medium' : 'text-muted-foreground'}`}>Non-Veg</span>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fssaiLicense"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FSSAI License Number</FormLabel>
                    <FormControl>
                      <Input placeholder="License no. (if applicable)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manufacturingFacility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturing Plant / Facility</FormLabel>
                    <FormControl>
                      <Input placeholder="Plant or facility name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storageInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Instructions</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Store in a cool, dry place" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="countryOfOrigin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country of Origin</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nutritionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nutritional Information (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Per 100g / serving…" className="min-h-[64px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Notes (optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea 
                          placeholder="Not shown on consumer scan unless you mirror to a public field…" 
                          className="pl-9 min-h-[72px]" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>

        <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0 bg-background">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-mega-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Batch QR'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
