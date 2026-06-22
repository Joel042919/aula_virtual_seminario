'use client';

import React from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { TopBar } from '@/components/ui/topbar';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Determine role based on path for preview purposes
  const role = pathname.includes('/teacher') ? 'teacher' : 
               pathname.includes('/student') ? 'student' : 'admin';

  const breadcrumbs = pathname.split('/').filter(Boolean).map(s => {
    // Map internal paths to readable names
    const names: Record<string, string> = {
      teacher: 'Docente',
      student: 'Estudiante',
      admin: 'Administrador',
      courses: 'Cursos',
      attendance: 'Asistencia',
      grades: 'Notas',
      payments: 'Pagos',
      period: 'Periodo Escolar'
    };
    return names[s] || s.charAt(0).toUpperCase() + s.slice(1);
  });

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden transition-colors duration-300">
      <Sidebar role={role} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar breadcrumbs={breadcrumbs.length > 0 ? breadcrumbs : ['Dashboard']} userName="Ismael Rajman" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
