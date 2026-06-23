"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  if (!email || !password) {
    redirect("/?error=credentials");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[Login Action] Error al iniciar sesión:", error.message, error);
    if (error.message.includes('Invalid login credentials')) {
      redirect(`/?error=credentials`);
    } else {
      redirect(`/?error=registry`);
    }
  }

  console.log("[Login Action] Usuario autenticado correctamente ID:", data.user?.id);
  
  // Obtener rol para redirigir directamente
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol(nombre)')
    .eq('id', data.user.id)
    .single();

  const rolNombre = (usuario?.rol as any)?.nombre;
  const rolePaths: Record<string, string> = {
      'estudiante': '/estudiante/dashboard',
      'docente': '/docente/dashboard',
      'admin': '/admin/dashboard',
      'super_admin': '/superadmin'
  };

  if (rolNombre && rolePaths[rolNombre]) {
    redirect(rolePaths[rolNombre]);
  } else {
    redirect("/");
  }
}


export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut(); // Esto borra las cookies seguras en el servidor
  redirect('/');
}