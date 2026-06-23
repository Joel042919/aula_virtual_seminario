'use client';

import React, { useState } from 'react';
import { ChevronRight, Bell, User, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { logoutAction } from '@/app/actions';
import { usePathname } from 'next/navigation';

interface TopBarProps {
  userName: string;
  roleName: string;
}

export const TopBar = ({ userName, roleName }: TopBarProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const pathname = usePathname();

  const breadcrumbs = pathname.split('/').filter(Boolean).map(s => {
    const names: Record<string, string> = {
      docente: 'Docente',
      teacher: 'Docente',
      estudiante: 'Estudiante',
      student: 'Estudiante',
      admin: 'Administrador',
      dashboard: 'Dashboard',
      courses: 'Cursos',
      cursos: 'Cursos',
      attendance: 'Asistencia',
      calificar: 'Calificar',
      configuracion: 'Configuración',
      grades: 'Notas',
      payments: 'Pagos',
      period: 'Periodo Escolar'
    };
    return names[s] || s.charAt(0).toUpperCase() + s.slice(1);
  });

  const displayBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : ['Dashboard'];

  // Formatear rol capitalizando la primera letra
  const formattedRole = roleName.charAt(0).toUpperCase() + roleName.slice(1).replace('_', ' ');

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-8 bg-brand-surface border-b border-brand-surface-border relative z-40">
      <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 truncate mr-4">
        {displayBreadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            <span className={idx === displayBreadcrumbs.length - 1 ? "font-semibold text-foreground truncate" : "truncate"}>
              {crumb}
            </span>
            {idx < displayBreadcrumbs.length - 1 && <ChevronRight size={14} className="shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center gap-3 md:gap-6 shrink-0">
        <div className="flex items-center gap-3 md:pl-6 md:border-l border-brand-surface-border relative">
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-foreground">{userName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{formattedRole}</p>
          </div>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-9 h-9 bg-background border border-brand-surface-border rounded-full flex items-center justify-center text-slate-500 hover:text-foreground hover:border-brand-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          >
            <User size={18} />
          </button>
          
          {/* Mobile Dropdown */}
          {showDropdown && (
            <>
              {/* Overlay for closing dropdown when clicking outside */}
              <div 
                className="fixed inset-0 z-40 md:hidden" 
                onClick={() => setShowDropdown(false)}
              />
              
              <div className="absolute right-0 top-full mt-2 w-48 bg-brand-surface border border-brand-surface-border rounded-xl shadow-xl overflow-hidden z-50 md:hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-brand-surface-border">
                  <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formattedRole}</p>
                </div>
                <button 
                  onClick={async () => await logoutAction()}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-secondary hover:bg-background transition-colors text-left"
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

