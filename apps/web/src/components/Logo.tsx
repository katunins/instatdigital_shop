import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        'inline-flex shrink-0 items-center rounded-sm px-1 py-1 text-lg font-bold leading-none tracking-tight hover:outline hover:outline-1 hover:outline-white',
        className,
      )}
    >
      Учебный магазин
    </Link>
  );
}
