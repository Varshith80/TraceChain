import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  FileText, 
  Calendar,
  Shield,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { RoleBadge } from '@/components/ui/role-badge';
import { StatusBadge } from '@/components/ui/status-badge';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const getApprovalIcon = () => {
    switch (user.approvalStatus) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getApprovalBadge = () => {
    switch (user.approvalStatus) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending Approval</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">View and manage your account information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">{user.fullName || 'Not set'}</p>
                <RoleBadge role={user.role} />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                </div>
              )}

              {user.createdAt && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">{format(new Date(user.createdAt), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Account Status
            </CardTitle>
            <CardDescription>Your account verification status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {getApprovalIcon()}
                <div>
                  <p className="font-medium">Approval Status</p>
                  <p className="text-sm text-muted-foreground">
                    {user.approvalStatus === 'approved' 
                      ? 'Your account has been verified' 
                      : user.approvalStatus === 'pending'
                      ? 'Waiting for admin approval'
                      : 'Your application was rejected'}
                  </p>
                </div>
              </div>
              {getApprovalBadge()}
            </div>

            {user.rejectionReason && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
                <p className="text-sm text-destructive/80 mt-1">{user.rejectionReason}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Role:</p>
              <RoleBadge role={user.role} />
            </div>
          </CardContent>
        </Card>

        {/* Business Information - Only for Manufacturer/Retailer */}
        {(user.role === 'manufacturer' || user.role === 'retailer') && (
          <Card className="card-elevated md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Business Information
              </CardTitle>
              <CardDescription>Your company and business details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {user.companyName && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Company Name</p>
                      <p className="font-medium">{user.companyName}</p>
                    </div>
                  </div>
                )}

                {user.gstNumber && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">GST Number</p>
                      <p className="font-medium">{user.gstNumber}</p>
                    </div>
                  </div>
                )}

                {user.address && (
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Business Address</p>
                      <p className="font-medium">{user.address}</p>
                    </div>
                  </div>
                )}

                {user.kycDocuments && user.kycDocuments.length > 0 && (
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">KYC Documents</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {user.kycDocuments.map((doc, index) => (
                          <Badge key={index} variant="secondary">{doc}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
