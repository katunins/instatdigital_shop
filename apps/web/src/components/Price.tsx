import { cn } from '@/lib/utils';

export function Price({
  kopecks,
  size = 'md',
  className,
}: {
  kopecks: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const negative = kopecks < 0;
  const abs = Math.abs(kopecks);
  const whole = Math.floor(abs / 100);
  const fraction = abs % 100;
  const sizes = {
    sm: { sign: 'text-[11px]', whole: 'text-lg leading-none', frac: 'text-[11px]' },
    md: { sign: 'text-[13px]', whole: 'text-[28px] leading-none', frac: 'text-[13px]' },
    lg: { sign: 'text-base', whole: 'text-[32px] leading-none', frac: 'text-base' },
  }[size];

  return (
    <span className={cn('inline-flex items-start text-price', className)}>
      {negative ? <span className={sizes.sign}>−</span> : null}
      <span className={cn(sizes.sign, 'mt-0.5 mr-px')}>₽</span>
      <span className={cn(sizes.whole, 'tracking-tight text-price')}>
        {whole.toLocaleString('ru-RU')}
      </span>
      <span className={cn(sizes.frac, 'mt-0.5')}>{String(fraction).padStart(2, '0')}</span>
    </span>
  );
}
