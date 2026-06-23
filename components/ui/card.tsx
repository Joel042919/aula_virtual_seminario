import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export const Card = ({ title, description, className, children, ...props }: CardProps) => (
  <div className={cn("dashboard-card", className)} {...props}>
    {(title || description) && (
      <div className="px-6 py-4 border-b border-slate-100 dark:border-brand-surface-border">
        {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

export const StatCard = ({label, value, icon: Icon, trend }: {label: string; value: string | number; icon: React.ElementType; trend?: string }) => (
  <div className="dashboard-card p-6 flex items-center justify-between">
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-foreground">{value}</h3>
      {trend && <p className="text-xs text-brand-accent mt-1 font-medium">{trend}</p>}
    </div>
    <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-lg flex items-center justify-center text-brand-accent">
      <Icon size={24} />
    </div>
  </div>
);

