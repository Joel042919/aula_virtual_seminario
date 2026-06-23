'use server';

import { createClient } from '@/lib/supabase/server';
import { getUploadPresignedUrl, R2_PUBLIC_CUSTOM_DOMAIN } from '@/lib/r2';

export async function getTeacherCourses() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado' };

  // Obtener periodo activo
  const { data: periodoActivo } = await supabase
    .from('periodo_academico')
    .select('id')
    .eq('activo', true)
    .single();

  if (!periodoActivo) return { error: 'No hay periodo académico activo' };

  // Obtener cursos asignados al docente
  const { data: cursos, error } = await supabase
    .from('docente_curso')
    .select(`
      curso_id,
      curso:curso_id (
        id,
        nombre,
        nivel:nivel_id(nombre)
      )
    `)
    .eq('docente_id', user.id);

  if (error) return { error: error.message };

  // Filtrar y mapear los cursos para que solo queden los del periodo actual. 
  // Nota: Deberíamos cruzar el curso con periodo_id = periodoActivo.id
  // Lo verificamos manualmente si no se hizo join completo.
  const cursosId = cursos.map((c: any) => c.curso_id);

  if (cursosId.length === 0) return { cursos: [] };

  const { data: cursosValidos } = await supabase
    .from('curso')
    .select('id, nombre')
    .in('id', cursosId)
    .eq('periodo_id', periodoActivo.id)
    .eq('activo', true);

  return { cursos: cursosValidos || [] };
}

export async function getSessions(cursoId: number) {
  const supabase = await createClient();
  
  // Obtenemos sesiones
  const { data: sesiones, error } = await supabase
    .from('sesion_programacion')
    .select(`
      *,
      sesion_archivos (*),
      tareas (*)
    `)
    .eq('curso_id', cursoId)
    .order('created_at', { ascending: true });

  if (error) return { error: error.message };
  
  return { sesiones: sesiones || [] };
}

export async function getPresignedDownloadUrl(key: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  try {
    const { getDownloadPresignedUrl } = await import('@/lib/r2');
    const url = await getDownloadPresignedUrl(key);
    return { success: true, url };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getUploadUrl(filename: string, contentType: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  try {
    const data = await getUploadPresignedUrl(filename, contentType);
    return { success: true, ...data };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function saveFileMetadata(sesionId: number, filename: string, key: string, size: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const { data, error } = await supabase
    .from('sesion_archivos')
    .insert([
      {
        sesion_id: sesionId,
        nombre_archivo: filename,
        url: key, // En R2 la URL guardada es el KEY
        tamano_bytes: size,
        subido_por: user.id
      }
    ])
    .select()
    .single();

  if (error) return { error: error.message };

  const { revalidatePath } = await import('next/cache');
  revalidatePath('/docente/cursos');

  return { success: true, archivo: data };
}

export async function createSession(cursoId: number, formData: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const { tipo_sesion, titulo_personalizado, urls, tarea_titulo, tarea_descripcion, tarea_fecha_limite } = formData;

  // Calculamos el nombre de la sesión
  let nombre_sesion = '';
  
  if (tipo_sesion === 'teoria') {
    // Contamos las sesiones teóricas actuales para asignarle un número
    const { count } = await supabase
      .from('sesion_programacion')
      .select('*', { count: 'exact', head: true })
      .eq('curso_id', cursoId)
      .eq('tipo_sesion', 'teoria');
      
    const sesionNumero = (count || 0) + 1;
    nombre_sesion = `Sesión ${sesionNumero} - ${titulo_personalizado}`;
  } else if (tipo_sesion === 'practica') {
    nombre_sesion = 'Tarea';
  } else if (tipo_sesion === 'examen') {
    nombre_sesion = 'Examen';
  } else if (tipo_sesion === 'entrega_final') {
    nombre_sesion = 'Entrega Final';
  }

  // Insertar la Sesión
  const { data: nuevaSesion, error: sesionError } = await supabase
    .from('sesion_programacion')
    .insert([
      {
        curso_id: cursoId,
        docente_id: user.id,
        nombre_sesion,
        tipo_sesion,
        urls: urls || []
      }
    ])
    .select()
    .single();

  if (sesionError) return { error: sesionError.message };

  // Si no es teoría, creamos el registro en la tabla `tareas`
  if (tipo_sesion !== 'teoria' && tarea_titulo && tarea_fecha_limite) {
    const { error: tareaError } = await supabase
      .from('tareas')
      .insert([
        {
          sesion_id: nuevaSesion.id,
          titulo: tarea_titulo,
          descripcion: tarea_descripcion || '',
          fecha_limite: tarea_fecha_limite
        }
      ]);
      
    if (tareaError) {
      // Si falla la tarea, borramos la sesión para evitar inconsistencias
      await supabase.from('sesion_programacion').delete().eq('id', nuevaSesion.id);
      return { error: tareaError.message };
    }
  }

  const { revalidatePath } = await import('next/cache');
  revalidatePath('/docente/cursos');

  return { success: true, sesion: nuevaSesion };
}

export async function deleteSession(sesionId: number) {
  const supabase = await createClient();
  
  // Borrar archivos relacionados primero
  await supabase.from('sesion_archivos').delete().eq('sesion_id', sesionId);
  // Borrar tareas relacionadas
  await supabase.from('tareas').delete().eq('sesion_id', sesionId);
  // Borrar asistencia de esta sesion (si hubiera)
  await supabase.from('asistencia').delete().eq('sesion_id', sesionId);
  
  // Finalmente borrar la sesión
  const { error } = await supabase
    .from('sesion_programacion')
    .delete()
    .eq('id', sesionId);

  if (error) return { error: error.message };

  const { revalidatePath } = await import('next/cache');
  revalidatePath('/docente/cursos');

  return { success: true };
}

export async function deleteFile(fileId: number, fileKey: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  try {
    const { deleteR2File } = await import('@/lib/r2');
    await deleteR2File(fileKey);
  } catch (err: any) {
    console.error("Error borrando de R2:", err);
    // Continuamos para borrar de la BD aunque falle R2 (ej. si ya no existe en R2)
  }

  const { error } = await supabase
    .from('sesion_archivos')
    .delete()
    .eq('id', fileId);

  if (error) return { error: error.message };

  const { revalidatePath } = await import('next/cache');
  revalidatePath('/docente/cursos');

  return { success: true };
}

export async function updateSession(sesionId: number, formData: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const { titulo_personalizado, urls, tarea_titulo, tarea_descripcion, tarea_fecha_limite } = formData;

  // Obtener sesión actual
  const { data: sesion } = await supabase
    .from('sesion_programacion')
    .select('tipo_sesion, nombre_sesion')
    .eq('id', sesionId)
    .single();

  if (!sesion) return { error: 'Sesión no encontrada' };

  let nombre_sesion = sesion.nombre_sesion;
  
  if (sesion.tipo_sesion === 'teoria' && titulo_personalizado) {
    // Preservar el número de sesión "Sesión X - "
    const parts = nombre_sesion.split(' - ');
    if (parts.length > 1) {
      nombre_sesion = `${parts[0]} - ${titulo_personalizado}`;
    } else {
      nombre_sesion = titulo_personalizado;
    }
  }

  const { error: updateError } = await supabase
    .from('sesion_programacion')
    .update({ nombre_sesion, urls: urls || [] })
    .eq('id', sesionId);

  if (updateError) return { error: updateError.message };

  if (sesion.tipo_sesion !== 'teoria' && tarea_titulo) {
    const { error: tareaError } = await supabase
      .from('tareas')
      .update({
        titulo: tarea_titulo,
        descripcion: tarea_descripcion || '',
        fecha_limite: tarea_fecha_limite
      })
      .eq('sesion_id', sesionId);

    if (tareaError) return { error: tareaError.message };
  }

  const { revalidatePath } = await import('next/cache');
  revalidatePath('/docente/cursos');

  return { success: true };
}
