import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RoleBadge } from '@/components/ui/role-badge';
import { RejectUserDialog } from './RejectUserDialog';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import type { PendingUser } from './PendingUserCard';

interface UserDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: PendingUser | null;
  onApprove?: (userId: string) => Promise<void>;
  onReject?: (userId: string, reason: string) => Promise<void>;
  showActions?: boolean;
}

export function UserDetailsSheet({ 
  open, 
  onOpenChange, 
  user, 
  onApprove, 
  onReject,
  showActions = true 
}: UserDetailsSheetProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  if (!user) return null;

  const handleReject = async (reason: string) => {
    if (!onReject) return;
    await onReject(user.id, reason);
    onOpenChange(false);
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    await onApprove(user.id);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              User Details
            </SheetTitle>
            <SheetDescription>
              Review user information before approval
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-180px)] mt-6 pr-4">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user.full_name || 'No Name'}</h3>
                    <RoleBadge role={user.role} size="sm" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  
                  {user.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {user.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">{user.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Business Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Business Information</h4>
                <div className="grid gap-3">
                  {user.company_name && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Company Name</p>
                        <p className="text-sm text-muted-foreground">{user.company_name}</p>
                      </div>
                    </div>
                  )}
                  
                  {user.gst_number && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">GST Number</p>
                        <p className="text-sm text-muted-foreground font-mono">{user.gst_number}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* KYC Documents */}
              {user.kyc_documents && user.kyc_documents.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">KYC Documents</h4>
                    <div className="space-y-2">
                      {user.kyc_documents.map((doc, index) => (
                        <a
                          key={index}
                          href={doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors text-sm"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1 truncate">Document {index + 1}</span>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Metadata */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Registration Details</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {user.created_at 
                    ? format(new Date(user.created_at), 'MMMM d, yyyy h:mm a')
                    : 'Unknown'}
                </div>
              </div>

              {/* Actions */}
              {showActions && onApprove && onReject && (
                <>
                  <Separator />
                  <div className="flex gap-3 pt-2">
                    <Button
                      className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                      onClick={handleApprove}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve User
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setRejectDialogOpen(true)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <RejectUserDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleReject}
        userName={user.full_name || undefined}
      />
    </>
  );
}
