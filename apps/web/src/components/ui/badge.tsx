import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-bold',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#232f3e] text-white',
        secondary: 'border-transparent bg-[#ffd814] text-[#0f1111]',
        destructive: 'border-transparent bg-[#c40000] text-white',
        outline: 'border-[#d5d9d9] text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
