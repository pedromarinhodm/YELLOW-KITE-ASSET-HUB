import { EquipmentStatus, STATUS_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: EquipmentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        status === 'available' && 'status-badge-available',
        status === 'allocated' && 'status-badge-allocated',
        status === 'maintenance' && 'status-badge-maintenance',
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
