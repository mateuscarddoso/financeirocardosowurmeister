import { cn } from '@/lib/utils';

interface StatusPillProps {
  label: string;
  color: string;
  className?: string;
}

export function StatusPill({ label, color, className }: StatusPillProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-xs font-medium', className)}
      style={{ backgroundColor: `${color}18`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
