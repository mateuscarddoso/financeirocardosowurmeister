import { cn } from '@/lib/utils';

interface AvatarCircleProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'h-6 w-6 text-[10px]', md: 'h-8 w-8 text-xs', lg: 'h-10 w-10 text-sm' };

export function AvatarCircle({ src, name, size = 'md', className }: AvatarCircleProps) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return src ? (
    <img
      src={src}
      alt={name || ''}
      className={cn('rounded-full object-cover', sizeMap[size], className)}
    />
  ) : (
    <div className={cn('flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium', sizeMap[size], className)}>
      {initials}
    </div>
  );
}
