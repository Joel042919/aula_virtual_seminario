import React from 'react';
import { BookOpen, FileText, GraduationCap, Presentation } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  teoria: BookOpen,
  practica: FileText,
  examen: GraduationCap,
  entrega_final: Presentation,
};

const colorMap = {
  teoria: 'bg-blue-100 text-blue-600',
  practica: 'bg-green-100 text-green-600',
  examen: 'bg-red-100 text-red-600',
  entrega_final: 'bg-brand-gold/10 text-brand-gold',
};

interface TimelineItem {
  id: number;
  title: string;
  type: keyof typeof iconMap;
  date: string;
  time: string;
}

export const Timeline = ({ items }: { items: TimelineItem[] }) => (
  <div className="relative pl-8 border-l border-slate-200 dark:border-slate-800 ml-4 space-y-8 py-4">
    {items.map((item, idx) => {
      const Icon = iconMap[item.type];
      return (
        <div key={item.id} className="relative group">
          <div className={cn(
            "absolute -left-[41px] w-5 h-5 rounded-full border-4 border-white dark:border-slate-900",
            idx === 0 ? "bg-brand-gold ring-4 ring-brand-gold/20" : "bg-slate-300 dark:bg-slate-700"
          )} />
          
          <div className="dashboard-card p-4 transition-all group-hover:border-brand-gold/30">
            <div className="flex items-start gap-4">
              <div className={cn("p-2 rounded-lg", colorMap[item.type])}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-brand-navy dark:text-white">{item.title}</h4>
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-white/5 rounded uppercase tracking-wider text-slate-500">
                    {item.type.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{item.date} • {item.time}</p>
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);
