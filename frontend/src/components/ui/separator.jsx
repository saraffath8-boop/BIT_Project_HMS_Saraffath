// This file contains the separator shared interface.

import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '../../lib/utils';

// Handle separator.
export function Separator({ className, orientation = 'horizontal', ...props }) {
    return (
        <SeparatorPrimitive.Root
            orientation={orientation}
            className={cn(
                'shrink-0 bg-slate-200',
                orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
                className,
            )}
            {...props}
        />
    );
}
