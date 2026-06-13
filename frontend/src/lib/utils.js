// This file contains the utils shared application logic.

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Handle cn.
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
