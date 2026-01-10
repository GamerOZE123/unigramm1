import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GraduationCap, Award, UserCheck } from 'lucide-react';

export type AccountStatus = 'student' | 'alumni' | 'verified_alumni';

interface AccountBadgeProps {
  accountStatus: AccountStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const badgeConfig = {
  student: {
    icon: UserCheck,
    label: 'Student',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400',
    iconClassName: 'text-blue-500',
  },
  alumni: {
    icon: GraduationCap,
    label: 'Alumni',
    className: 'bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20 dark:text-green-400',
    iconClassName: 'text-green-500',
  },
  verified_alumni: {
    icon: Award,
    label: 'Verified Alumni',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400',
    iconClassName: 'text-amber-500',
  },
};

const sizeConfig = {
  sm: {
    badge: 'text-xs px-1.5 py-0.5',
    icon: 'h-3 w-3',
  },
  md: {
    badge: 'text-sm px-2 py-1',
    icon: 'h-4 w-4',
  },
  lg: {
    badge: 'text-base px-3 py-1.5',
    icon: 'h-5 w-5',
  },
};

export const AccountBadge = ({
  accountStatus,
  size = 'sm',
  showLabel = true,
  className,
}: AccountBadgeProps) => {
  const config = badgeConfig[accountStatus];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        config.className,
        sizeStyles.badge,
        className
      )}
    >
      <Icon className={cn(sizeStyles.icon, config.iconClassName)} />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
};

// Compact version for inline use (just icon)
export const AccountBadgeIcon = ({
  accountStatus,
  size = 'sm',
  className,
}: Omit<AccountBadgeProps, 'showLabel'>) => {
  const config = badgeConfig[accountStatus];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full p-0.5',
        config.className,
        className
      )}
      title={config.label}
    >
      <Icon className={cn(sizeStyles.icon, config.iconClassName)} />
    </span>
  );
};

export default AccountBadge;
