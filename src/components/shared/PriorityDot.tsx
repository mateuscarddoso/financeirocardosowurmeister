import { PRIORITIES } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface PriorityDotProps {
  priority: 'high' | 'mid' | 'low';
  showLabel?: boolean;
  className?: string;
}

export function PriorityDot({ priority, showLabel = false, className }: PriorityDotProps) {
  const config = PRIORITIES[priority];

  if (showLabel) {
    return (
      <span
        className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold', className)}
        style={{ backgroundColor: `${config.color}18`, color: config.color }}
        title={config.label}
      >
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={cn('inline-block h-2.5 w-2.5 rounded-full', className)}
      style={{ backgroundColor: config.color }}
      title={config.label}
    />
  );
}
