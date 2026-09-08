import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground border border-[#fcd200] hover:bg-[#f7ca00] shadow-[0_2px_5px_rgba(213,217,217,.5)]',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-[#a40000]',
        outline:
          'border border-[#d5d9d9] bg-white hover:bg-[#f7fafa] shadow-[0_2px_5px_rgba(213,217,217,.5)]',
        secondary:
          'bg-secondary text-secondary-foreground border border-[#ff8f00] hover:bg-[#fa8900] shadow-[0_2px_5px_rgba(213,217,217,.5)]',
        ghost: 'hover:bg-white/10',
        link: 'text-link underline-offset-4 hover:text-[#c7511f] hover:underline',
      },
      size: {
        default: 'h-8 px-4 py-1',
        sm: 'h-7 rounded-lg px-3 text-xs',
        lg: 'h-10 rounded-xl px-5 text-sm',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
