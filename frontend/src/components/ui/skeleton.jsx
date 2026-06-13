// This file contains the skeleton shared interface.

import { cn } from '../../lib/utils';

// Show the skeleton interface.
export const Skeleton = ({ className, ...props }) => (
    <div className={cn('animate-pulse rounded-md bg-slate-200', className)} {...props} />
);
