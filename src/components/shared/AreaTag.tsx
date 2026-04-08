interface AreaTagProps {
  name: string;
  color: string;
}

export function AreaTag({ name, color }: AreaTagProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}18`, color }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}
