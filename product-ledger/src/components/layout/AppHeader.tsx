import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  User, 
  Settings, 
  Factory, 
  Store, 
  ShoppingBag, 
  Shield,
  Menu 
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const roleConfig = {
  manufacturer: { icon: Factory, label: 'Manufacturer', color: 'bg-primary' },
  retailer: { icon: Store, label: 'Retailer', color: 'bg-[hsl(262_72%_50%)]' },
  consumer: { icon: ShoppingBag, label: 'Consumer', color: 'bg-[hsl(200_80%_50%)]' },
  admin: { icon: Shield, label: 'Admin', color: 'bg-destructive' },
};

export function AppHeader() {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getRoleConfig = () => {
    if (!user?.role) return null;
    return roleConfig[user.role];
  };

  const config = getRoleConfig();
  const RoleIcon = config?.icon;

  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  const getDashboardLink = () => {
    if (!user?.role) return '/';
    switch (user.role) {
      case 'manufacturer':
        return '/manufacturer';
      case 'retailer':
        return '/retailer';
      case 'consumer':
        return '/consumer';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-app flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to={isAuthenticated ? getDashboardLink() : '/'} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <span className="hidden font-semibold sm:inline-block">TraceChain</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              {/* Admin Link - Desktop */}
              {user.role === 'admin' && (
                <Button variant="ghost" onClick={() => navigate('/admin')} className="hidden sm:flex">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </Button>
              )}

              {/* Role Badge - Desktop */}
              <div className="hidden items-center gap-2 sm:flex">
                {!user.approved && user.role !== 'consumer' && (
                  <Badge variant="outline" className="text-warning border-warning">
                    Pending Approval
                  </Badge>
                )}
                {config && (
                  <Badge className={`${config.color} text-white`}>
                    {RoleIcon && <RoleIcon className="mr-1 h-3 w-3" />}
                    {config.label}
                  </Badge>
                )}
              </div>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.fullName || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth?mode=signup')}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}