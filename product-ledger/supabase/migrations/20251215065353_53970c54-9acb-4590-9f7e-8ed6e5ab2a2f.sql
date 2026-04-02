-- Create tables for data persistence (interim until Fabric integration)

-- Mega QR table for batch/product data
CREATE TABLE public.mega_qrs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mega_id TEXT NOT NULL UNIQUE,
  mega_hash TEXT NOT NULL,
  product TEXT NOT NULL,
  batch_no TEXT NOT NULL,
  mfg_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  manufacturer_id UUID NOT NULL,
  manufacturer_name TEXT,
  meta JSONB DEFAULT '{}',
  version TEXT DEFAULT 'v1',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'recalled', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Child QR table for individual product units
CREATE TABLE public.child_qrs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id TEXT NOT NULL UNIQUE,
  child_hash TEXT NOT NULL,
  mega_id TEXT NOT NULL REFERENCES public.mega_qrs(mega_id) ON DELETE CASCADE,
  product_snapshot JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'recalled', 'returned')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Committed messages table (immutable - no delete policy)
CREATE TABLE public.committed_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mega_id TEXT REFERENCES public.mega_qrs(mega_id) ON DELETE SET NULL,
  child_id TEXT REFERENCES public.child_qrs(child_id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  committed_by UUID NOT NULL,
  committed_by_role TEXT NOT NULL,
  location TEXT,
  device TEXT,
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scan logs table for tracking scans
CREATE TABLE public.scan_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mega_id TEXT REFERENCES public.mega_qrs(mega_id) ON DELETE SET NULL,
  child_id TEXT REFERENCES public.child_qrs(child_id) ON DELETE SET NULL,
  scanned_by UUID NOT NULL,
  scanned_by_role TEXT NOT NULL,
  location TEXT,
  device TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.mega_qrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_qrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committed_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

-- Mega QRs policies
CREATE POLICY "Manufacturers can view their own mega QRs"
ON public.mega_qrs FOR SELECT TO authenticated
USING (manufacturer_id = auth.uid());

CREATE POLICY "Manufacturers can create mega QRs"
ON public.mega_qrs FOR INSERT TO authenticated
WITH CHECK (manufacturer_id = auth.uid() AND public.has_role(auth.uid(), 'manufacturer'));

CREATE POLICY "Manufacturers can update their own mega QRs"
ON public.mega_qrs FOR UPDATE TO authenticated
USING (manufacturer_id = auth.uid() AND public.has_role(auth.uid(), 'manufacturer'));

CREATE POLICY "Retailers can view all mega QRs"
ON public.mega_qrs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'retailer'));

CREATE POLICY "Consumers can view all mega QRs"
ON public.mega_qrs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'consumer'));

CREATE POLICY "Admins can view all mega QRs"
ON public.mega_qrs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Child QRs policies
CREATE POLICY "Manufacturers can manage child QRs for their mega QRs"
ON public.child_qrs FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mega_qrs 
    WHERE mega_qrs.mega_id = child_qrs.mega_id 
    AND mega_qrs.manufacturer_id = auth.uid()
  )
);

CREATE POLICY "Retailers can view all child QRs"
ON public.child_qrs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'retailer'));

CREATE POLICY "Consumers can view all child QRs"
ON public.child_qrs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'consumer'));

CREATE POLICY "Admins can view all child QRs"
ON public.child_qrs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Committed messages policies (NO DELETE - blockchain immutability)
CREATE POLICY "Users can view committed messages"
ON public.committed_messages FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Manufacturers can commit messages"
ON public.committed_messages FOR INSERT TO authenticated
WITH CHECK (committed_by = auth.uid() AND public.has_role(auth.uid(), 'manufacturer'));

CREATE POLICY "Retailers can commit messages"
ON public.committed_messages FOR INSERT TO authenticated
WITH CHECK (committed_by = auth.uid() AND public.has_role(auth.uid(), 'retailer'));

-- NO UPDATE or DELETE policies for committed_messages - immutable like blockchain

-- Scan logs policies (NO DELETE - immutable audit trail)
CREATE POLICY "Users can view scan logs"
ON public.scan_logs FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Retailers can create scan logs"
ON public.scan_logs FOR INSERT TO authenticated
WITH CHECK (scanned_by = auth.uid() AND public.has_role(auth.uid(), 'retailer'));

CREATE POLICY "Consumers can create scan logs"
ON public.scan_logs FOR INSERT TO authenticated
WITH CHECK (scanned_by = auth.uid() AND public.has_role(auth.uid(), 'consumer'));

-- NO UPDATE or DELETE policies for scan_logs - immutable audit trail

-- Create indexes for performance
CREATE INDEX idx_mega_qrs_manufacturer ON public.mega_qrs(manufacturer_id);
CREATE INDEX idx_mega_qrs_mega_id ON public.mega_qrs(mega_id);
CREATE INDEX idx_child_qrs_mega_id ON public.child_qrs(mega_id);
CREATE INDEX idx_child_qrs_child_id ON public.child_qrs(child_id);
CREATE INDEX idx_committed_messages_mega_id ON public.committed_messages(mega_id);
CREATE INDEX idx_committed_messages_child_id ON public.committed_messages(child_id);
CREATE INDEX idx_committed_messages_committed_by ON public.committed_messages(committed_by);
CREATE INDEX idx_scan_logs_scanned_by ON public.scan_logs(scanned_by);
CREATE INDEX idx_scan_logs_created_at ON public.scan_logs(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_mega_qrs_updated_at
BEFORE UPDATE ON public.mega_qrs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_child_qrs_updated_at
BEFORE UPDATE ON public.child_qrs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();