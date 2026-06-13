import { cn } from '../../lib/utils';

export const Card = ({ className, ...props }) => (
    <div
        className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}
        {...props}
    />
);
export const CardHeader = ({ className, ...props }) => (
    <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
);
export const CardTitle = ({ className, ...props }) => (
    <h3 className={cn('text-lg font-semibold text-slate-950', className)} {...props} />
);
export const CardDescription = ({ className, ...props }) => (
    <p className={cn('text-sm leading-6 text-slate-500', className)} {...props} />
);
export const CardContent = ({ className, ...props }) => (
    <div className={cn('p-6 pt-0', className)} {...props} />
);
export const CardFooter = ({ className, ...props }) => (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
);
