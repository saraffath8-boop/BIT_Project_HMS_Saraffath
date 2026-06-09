import { cn } from '../../lib/utils';

export const Table = ({ className, ...props }) => <div className="w-full overflow-auto"><table className={cn('w-full caption-bottom text-sm', className)} {...props} /></div>;
export const TableHeader = ({ className, ...props }) => <thead className={cn('[&_tr]:border-b', className)} {...props} />;
export const TableBody = ({ className, ...props }) => <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
export const TableRow = ({ className, ...props }) => <tr className={cn('border-b border-slate-100 transition-colors hover:bg-slate-50', className)} {...props} />;
export const TableHead = ({ className, ...props }) => <th className={cn('h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-slate-500', className)} {...props} />;
export const TableCell = ({ className, ...props }) => <td className={cn('p-4 align-middle text-slate-700', className)} {...props} />;
