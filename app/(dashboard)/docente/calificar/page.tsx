import React from 'react';
import { getTeacherCourses } from './actions';
import CalificarClient from './CalificarClient';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function CalificarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { cursos, error } = await getTeacherCourses();

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">Error al cargar datos</h2>
        <p>{error}</p>
      </div>
    );
  }

  return <CalificarClient cursos={cursos || []} />;
}
