import React from 'react';
import NotasClient from './NotasClient';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function StudentNotasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return <NotasClient />;
}
