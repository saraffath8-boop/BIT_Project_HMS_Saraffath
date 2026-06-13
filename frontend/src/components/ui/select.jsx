// This file contains the select shared interface.

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

// Handle select.
export const Select = SelectPrimitive.Root;
// Handle select value.
export const SelectValue = SelectPrimitive.Value;
// Handle select trigger.
export function SelectTrigger({ className, children, ...props }) {
    return (
        <SelectPrimitive.Trigger
            className={cn(
                'flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm',
                className,
            )}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon>
                <ChevronDown className="size-4" />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
}
// Handle select content.
export function SelectContent({ className, children, ...props }) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                className={cn(
                    'z-50 min-w-40 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-lg',
                    className,
                )}
                {...props}
            >
                <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    );
}
// Handle select item.
export function SelectItem({ className, children, ...props }) {
    return (
        <SelectPrimitive.Item
            className={cn(
                'relative flex cursor-default select-none items-center rounded-md py-2 pl-8 pr-3 text-sm outline-none focus:bg-slate-100',
                className,
            )}
            {...props}
        >
            <span className="absolute left-2">
                <SelectPrimitive.ItemIndicator>
                    <Check className="size-4" />
                </SelectPrimitive.ItemIndicator>
            </span>
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
    );
}
