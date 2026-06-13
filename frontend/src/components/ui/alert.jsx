import { cn } from '../../lib/utils';

export function Alert({ className, variant = 'default', ...props }) {
    return (
        <div
            role="alert"
            className={cn(
                'rounded-lg border p-4 text-sm',
                variant === 'destructive'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-cyan-200 bg-cyan-50 text-cyan-900',
                className,
            )}
            {...props}
        />
    );
}
