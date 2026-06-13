import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function CollapsibleSection({ title, count, children, defaultExpanded = true }) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <section className="space-y-3">
            <button
                type="button"
                className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/40"
                aria-expanded={expanded}
                onClick={() => setExpanded((current) => !current)}
            >
                <span>
                    <span className="text-lg font-semibold text-slate-900">{title}</span>{' '}
                    <span className="text-sm font-normal text-slate-500">({count})</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-cyan-700">
                    {expanded ? 'Collapse' : 'Expand'}
                    <ChevronDown
                        className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                </span>
            </button>
            {expanded && children}
        </section>
    );
}
