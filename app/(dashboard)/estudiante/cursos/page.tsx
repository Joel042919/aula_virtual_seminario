import React from 'react';
import EstudianteCursosClient from './EstudianteCursosClient';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function EstudianteCursosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Devolvemos directamente el componente cliente para carga instántanea (CSR)
  return <EstudianteCursosClient />;
}
