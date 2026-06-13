import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(function Input({ className, type = 'text', ...props }, ref) {
    return (
        <input
            ref={ref}
            type={type}
            className={cn(
                'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-50 disabled:text-slate-500',
                className,
            )}
            {...props}
        />
    );
});
