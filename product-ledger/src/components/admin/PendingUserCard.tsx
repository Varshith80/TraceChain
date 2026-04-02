import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RoleBadge } from '@/components/ui/role-badge';
import { RejectUserDialog } from './RejectUserDialog';
import { CheckCircle, XCircle, Eye, Loader2, Building2, Mail, Phone, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { AppRole } from '@/types/fabric';

export interface PendingUser {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  company_name: string | null;
  gst_number: string | null;
  phone: string | null;
  address: string | null;
  approved: boolean | null;
  approval_status: string | null;
  created_at: string | null;
  kyc_documents: string[] | null;
}

interface PendingUserCardProps {
  user: PendingUser;
  onApprove: (userId: string) => Promise<void>;
  onReject: (userId: string, reason: string) => Promise<void>;
  onViewDetails: (user: PendingUser) => void;
}

export function PendingUserCard({ user, onApprove, onReject, onViewDetails }: PendingUserCardProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(user.id);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (reason: string) => {
    setIsRejecting(true);
    try {
      await onReject(user.id, reason);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-lg">{user.full_name || 'No Name'}</span>
                <RoleBadge role={user.role} size="sm" />
              </div>
              
              <div className="grid gap-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{user.email}</span>
                </div>
                
                {user.company_name && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{user.company_name}</span>
                  </div>
                )}
                
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{user.phone}</span>
                  </div>
                )}
                
                {user.gst_number && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    <span>GST: {user.gst_number}</span>
                  </div>
                )}
              </div>
              
              {user.created_at && (
                <p className="text-xs text-muted-foreground">
                  Registered: {format(new Date(user.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              )}
            </div>
            
            <div className="flex flex-row md:flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewDetails(user)}
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                View
              </Button>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
                className="bg-success hover:bg-success/90 text-success-foreground"
              >
                {isApproving ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                )}
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setRejectDialogOpen(true)}
                disabled={isApproving || isRejecting}
              >
                {isRejecting ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                )}
                Reject
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <RejectUserDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleReject}
        userName={user.full_name || undefined}
      />
    </>
  );
}
