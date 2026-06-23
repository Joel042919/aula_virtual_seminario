import React from 'react';
import { cn } from '@/lib/utils';

export const Table = ({ headers, children, className }: { headers: string[]; children: React.ReactNode; className?: string }) => (
  <div className={cn("overflow-x-auto", className)}>
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-slate-100 dark:border-slate-800">
          {headers.map((header, idx) => (
            <th key={idx} className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
        {children}
      </tbody>
    </table>
  </div>
);

export const TableRow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <tr className={cn("hover:bg-slate-50 dark:hover:bg-white/5 transition-colors", className)}>
    {children}
  </tr>
);

export const TableCell = ({ children, className,colSpan=1 }: { children?: React.ReactNode; className?: string,colSpan?:number }) => (
  <td colSpan={colSpan} className={cn("px-6 py-4 text-sm text-slate-600 dark:text-slate-300", className)}>
    {children}
  </td>
);

