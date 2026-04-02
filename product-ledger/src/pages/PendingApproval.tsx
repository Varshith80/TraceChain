import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Mail } from 'lucide-react';
import { RoleBadge } from '@/components/ui/role-badge';

export default function PendingApproval() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <CardTitle>Account Pending Approval</CardTitle>
          <CardDescription>
            Your account is awaiting admin review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-muted-foreground">Registered as:</span>
              <RoleBadge role={user.role} />
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            An administrator will review your account details and KYC documents. You'll receive an email once approved.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            {user?.email}
          </div>
          <Button variant="outline" onClick={signOut} className="mt-4">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}