import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, Clock, CheckCircle, XCircle, RefreshCw, AlertCircle, Shield } from 'lucide-react';
import { PendingUserCard, type PendingUser } from '@/components/admin/PendingUserCard';
import { UserDetailsSheet } from '@/components/admin/UserDetailsSheet';
import { AllUsersTable, type UserRow } from '@/components/admin/AllUsersTable';
import { CreateAdminDialog } from '@/components/admin/CreateAdminDialog';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const { 
    users, 
    pendingUsers, 
    approvedUsers, 
    rejectedUsers,
    isLoading, 
    error,
    refetch,
    approveUser, 
    rejectUser,
    revokeApproval 
  } = useAdminUsers();

  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);

  const handleViewDetails = (user: PendingUser | UserRow) => {
    setSelectedUser(user as PendingUser);
    setDetailsSheetOpen(true);
  };

  const stats = [
    { 
      title: 'Pending Approvals', 
      value: pendingUsers.length, 
      icon: Clock, 
      color: 'text-warning' 
    },
    { 
      title: 'Approved Users', 
      value: approvedUsers.length, 
      icon: CheckCircle, 
      color: 'text-success' 
    },
    { 
      title: 'Total Users', 
      value: users.length, 
      icon: Users, 
      color: 'text-primary' 
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Console</h1>
          <p className="text-muted-foreground">Manage users, approvals, and system settings</p>
        </div>
        <div className="flex gap-2">
          <CreateAdminDialog onSuccess={refetch} />
          <Button variant="outline" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch} className="ml-auto">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingUsers.length > 0 && (
              <span className="ml-2 rounded-full bg-warning px-2 py-0.5 text-xs text-warning-foreground">
                {pendingUsers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                Users awaiting account approval. Manufacturers and retailers require approval to access the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
                  <p className="text-muted-foreground">No pending approvals</p>
                  <p className="text-sm text-muted-foreground">All users have been reviewed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <PendingUserCard
                      key={user.id}
                      user={user}
                      onApprove={approveUser}
                      onReject={rejectUser}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Complete list of registered users with filtering and search capabilities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AllUsersTable
                users={users}
                onViewDetails={handleViewDetails}
                onRevokeApproval={revokeApproval}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Users</CardTitle>
              <CardDescription>
                Users whose applications were rejected.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : rejectedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No rejected users</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rejectedUsers.map((user) => (
                    <PendingUserCard
                      key={user.id}
                      user={user}
                      onApprove={approveUser}
                      onReject={rejectUser}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Sheet */}
      <UserDetailsSheet
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
        user={selectedUser}
        onApprove={approveUser}
        onReject={rejectUser}
        showActions={selectedUser?.approval_status === 'pending'}
      />
    </div>
  );
}