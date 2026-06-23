import React from 'react';
import CursosClient from './CursosClient';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function CursosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return <CursosClient />;
}
