// This file contains the badge shared interface.

import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Handle variants.
const variants = cva(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
    {
        variants: {
            variant: {
                default: 'bg-cyan-50 text-cyan-800',
                secondary: 'bg-slate-100 text-slate-700',
                success: 'bg-emerald-50 text-emerald-700',
                warning: 'bg-amber-50 text-amber-800',
                destructive: 'bg-red-50 text-red-700',
            },
        },
        defaultVariants: { variant: 'default' },
    },
);

// Show the badge interface.
export const Badge = ({ className, variant, ...props }) => (
    <span className={cn(variants({ variant }), className)} {...props} />
);
