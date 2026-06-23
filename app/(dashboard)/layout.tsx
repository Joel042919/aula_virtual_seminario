import React from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { TopBar } from '@/components/ui/topbar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch user profile and role
  const { data: userData } = await supabase
    .from('usuarios')
    .select(`
      nombres, 
      apellidos, 
      rol:rol_id (nombre)
    `)
    .eq('id', user.id)
    .single();

  const userName = userData ? `${userData.nombres} ${userData.apellidos}` : 'Usuario';
  // En supabase usualmente relaciones retornan un array u objeto, aquí forzamos casting si es un objeto
  const roleData = userData?.rol as any;
  const roleName = roleData?.nombre || 'usuario';

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden print:h-auto print:overflow-visible transition-colors duration-300">
      <Sidebar role={roleName} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <TopBar userName={userName} roleName={roleName} />
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 print:p-0 print:overflow-visible scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <div className="max-w-7xl mx-auto print:max-w-none print:w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
