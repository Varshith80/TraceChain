import { Badge } from '@/components/ui/badge';
import { Factory, Store, ShoppingBag, Shield } from 'lucide-react';
import type { AppRole } from '@/types/fabric';
import { cn } from '@/lib/utils';

const roleConfig = {
  manufacturer: { 
    icon: Factory, 
    label: 'Manufacturer', 
    className: 'bg-primary text-primary-foreground hover:bg-primary/90' 
  },
  retailer: { 
    icon: Store, 
    label: 'Retailer', 
    className: 'bg-[hsl(262_72%_50%)] text-white hover:bg-[hsl(262_72%_45%)]' 
  },
  consumer: { 
    icon: ShoppingBag, 
    label: 'Consumer', 
    className: 'bg-[hsl(200_80%_50%)] text-white hover:bg-[hsl(200_80%_45%)]' 
  },
  admin: { 
    icon: Shield, 
    label: 'Admin', 
    className: 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
  },
};

interface RoleBadgeProps {
  role: AppRole;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function RoleBadge({ role, showIcon = true, size = 'default', className }: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  return (
    <Badge className={cn(config.className, sizeClasses[size], className)}>
      {showIcon && <Icon className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />}
      {config.label}
    </Badge>
  );
}