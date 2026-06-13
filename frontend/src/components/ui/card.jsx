// This file contains the card shared interface.

import { cn } from '../../lib/utils';

// Show the card interface.
export const Card = ({ className, ...props }) => (
    <div
        className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}
        {...props}
    />
);
// Show the card header interface.
export const CardHeader = ({ className, ...props }) => (
    <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
);
// Show the card title interface.
export const CardTitle = ({ className, ...props }) => (
    <h3 className={cn('text-lg font-semibold text-slate-950', className)} {...props} />
);
// Show the card description interface.
export const CardDescription = ({ className, ...props }) => (
    <p className={cn('text-sm leading-6 text-slate-500', className)} {...props} />
);
// Show the card content interface.
export const CardContent = ({ className, ...props }) => (
    <div className={cn('p-6 pt-0', className)} {...props} />
);
// Show the card footer interface.
export const CardFooter = ({ className, ...props }) => (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
);
