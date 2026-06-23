import React from 'react';
import StudentDashboardClient from './StudentDashboardClient';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function EstudianteDashboardPage() {
  // Solo bloqueamos mínimamente para autenticación
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Devolvemos el cliente instantáneamente sin datos precargados
  return <StudentDashboardClient />;
}
