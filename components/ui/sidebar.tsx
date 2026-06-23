'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, BookOpen, GraduationCap, Settings, CreditCard, LogOut, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/app/actions';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
}

const SidebarItem = ({ icon: Icon, label, href, active }: SidebarItemProps) => (
  <Link 
    href={href}
    className={cn(
      "flex items-center gap-3 px-6 py-4 transition-all border-l-4 border-transparent hover:bg-white/5",
      active ? "text-brand-accent border-brand-accent bg-white/5" : "text-brand-primary-fg/70 dark:text-slate-500 hover:text-brand-primary-fg dark:hover:text-foreground"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Sidebar = ({ role }: { role: string }) => {
  const pathname = usePathname();
  const menuItems: Record<string, any[]> = {
    docente: [
      { icon: LayoutDashboard, label: 'General', href: '/docente/dashboard' },
      { icon: BookOpen, label: 'Curso', href: '/docente/cursos' },
      { icon: CheckCircle, label: 'Calificar', href: '/docente/calificar' },
      { icon: GraduationCap, label: 'Notas', href: '/docente/notas' },
    ],
    estudiante: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/estudiante/dashboard' },
      { icon: BookOpen, label: 'Cursos', href: '/estudiante/cursos' },
      { icon: GraduationCap, label: 'Mis Notas', href: '/estudiante/notas' },
    ],
    admin: [
      { icon: LayoutDashboard, label: 'Analíticas', href: '/admin/dashboard' },
      { icon: CreditCard, label: 'Pagos', href: '/admin/pagos' },
      { icon: Calendar, label: 'Periodo Escolar', href: '/admin/periodo' },
      { icon: Settings, label: 'Tarifas', href: '/admin/tarifas' },
    ],
    super_admin: [
      { icon: LayoutDashboard, label: 'Admin Global', href: '/superadmin' }
    ]
  };

  const currentMenu = menuItems[role] || menuItems['estudiante']; // Fallback seguro

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-full bg-brand-primary dark:bg-brand-surface dark:border-r dark:border-brand-surface-border text-brand-primary-fg dark:text-foreground shrink-0 z-30 print:hidden">
        <div className="p-8">
          <h1 className="text-xl font-bold tracking-tight text-brand-accent">
            GAMALIEL<span className="text-brand-primary-fg dark:text-foreground block text-sm font-normal">AULA VIRTUAL</span>
          </h1>
        </div>
        
        <nav className="flex-1 mt-4">
          {currentMenu.map((item, idx) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return <SidebarItem key={idx} {...item} active={active} />;
          })}
        </nav>

        <div className="p-4 border-t border-brand-primary-fg/10 dark:border-brand-surface-border">
          <button 
            onClick={async () => await logoutAction()}
            className="flex items-center gap-3 px-4 py-2 text-brand-primary-fg/70 dark:text-slate-500 hover:text-brand-primary-fg dark:hover:text-foreground transition-colors w-full"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-surface border-t border-brand-surface-border z-50 flex justify-around items-center px-2 pb-safe print:hidden">
        {currentMenu.map((item, idx) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link 
              key={idx} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full py-3 transition-colors",
                active ? "text-brand-accent" : "text-slate-500 dark:text-slate-400 hover:text-foreground"
              )}
            >
              <Icon size={20} className={cn("mb-1", active && "scale-110 transition-transform")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

