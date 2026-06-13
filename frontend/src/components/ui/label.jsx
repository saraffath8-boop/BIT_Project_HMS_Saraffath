// This file contains the label shared interface.

import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '../../lib/utils';

// Handle label.
export function Label({ className, ...props }) {
    return (
        <LabelPrimitive.Root
            className={cn('text-sm font-medium text-slate-700', className)}
            {...props}
        />
    );
}
