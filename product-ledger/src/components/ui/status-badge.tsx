import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertTriangle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusType = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'active' 
  | 'sold' 
  | 'recalled' 
  | 'returned'
  | 'expired';

const statusConfig: Record<StatusType, { 
  icon: typeof CheckCircle; 
  label: string; 
  className: string;
}> = {
  pending: { 
    icon: Clock, 
    label: 'Pending', 
    className: 'bg-warning/10 text-warning border-warning/20' 
  },
  approved: { 
    icon: CheckCircle, 
    label: 'Approved', 
    className: 'bg-success/10 text-success border-success/20' 
  },
  rejected: { 
    icon: XCircle, 
    label: 'Rejected', 
    className: 'bg-destructive/10 text-destructive border-destructive/20' 
  },
  active: { 
    icon: CheckCircle, 
    label: 'Active', 
    className: 'bg-success/10 text-success border-success/20' 
  },
  sold: { 
    icon: Package, 
    label: 'Sold', 
    className: 'bg-primary/10 text-primary border-primary/20' 
  },
  recalled: { 
    icon: AlertTriangle, 
    label: 'Recalled', 
    className: 'bg-destructive/10 text-destructive border-destructive/20' 
  },
  returned: { 
    icon: XCircle, 
    label: 'Returned', 
    className: 'bg-muted text-muted-foreground border-border' 
  },
  expired: { 
    icon: Clock, 
    label: 'Expired', 
    className: 'bg-muted text-muted-foreground border-border' 
  },
};

interface StatusBadgeProps {
  status: StatusType;
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.label}
    </Badge>
  );
}