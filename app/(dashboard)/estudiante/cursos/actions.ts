'use server';

import { createClient } from '@/lib/supabase/server';
import { getDownloadPresignedUrl, getUploadPresignedUrl, deleteR2File } from '@/lib/r2';

export async function getEnrolledCourses() {
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

  // Cursos Matriculados con Inner Join para filtrar por periodo
  const { data: matriculados, error } = await supabase
    .from('matriculados')
    .select(`
      curso_id,
      curso!inner (
        id,
        nombre
      )
    `)
    .eq('estudiante_id', user.id)
    .eq('activo', true)
    .eq('curso.periodo_id', periodoActivo.id)
    .eq('curso.activo', true);

  if (error) return { error: error.message };

  const cursos = matriculados?.map(m => m.curso) || [];

  return { cursos };
}

export async function getCourseContent(cursoId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  // Obtenemos sesiones programadas (materiales del profesor)
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

  if (!sesiones || sesiones.length === 0) return { sesiones: [] };

  // Extraer Tarea IDs para buscar las entregas del estudiante
  const tareasIds = sesiones.flatMap(s => s.tareas ? s.tareas.map((t: any) => t.id) : []);

  let entregasMap: Record<number, any> = {};

  if (tareasIds.length > 0) {
    const { data: entregas } = await supabase
      .from('entregas')
      .select(`
        id,
        tarea_id,
        comentario,
        fecha_entrega,
        entrega_archivos (*)
      `)
      .in('tarea_id', tareasIds)
      .eq('estudiante_id', user.id);

    if (entregas) {
      for (const entrega of entregas) {
        // No firmamos archivos aquí, lo haremos On-Demand
        entregasMap[entrega.tarea_id] = entrega;
      }
    }
  }

  // No firmar URLs de archivos del profesor tampoco
  const processedSesiones = sesiones.map(s => {
    if (s.tareas && s.tareas.length > 0) {
      // Inyectar la entrega del estudiante si existe
      s.tareas = s.tareas.map((t: any) => ({
        ...t,
        mi_entrega: entregasMap[t.id] || null
      }));
    }

    return s;
  });

  return { sesiones: processedSesiones };
}

export async function getPresignedDownloadUrl(key: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  try {
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

export async function saveSubmissionFile(tareaId: number, filename: string, key: string, size: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  // 1. Verificar si ya existe una entrega
  let { data: entrega } = await supabase
    .from('entregas')
    .select('id')
    .match({ tarea_id: tareaId, estudiante_id: user.id })
    .single();

  // 2. Si no existe, crear la entrega base
  if (!entrega) {
    const { data: newEntrega, error: insertError } = await supabase
      .from('entregas')
      .insert([{
        tarea_id: tareaId,
        estudiante_id: user.id,
      }])
      .select('id')
      .single();
      
    if (insertError) return { error: insertError.message };
    entrega = newEntrega;
  }

  // 3. Insertar metadata en entrega_archivos
  const { data, error } = await supabase
    .from('entrega_archivos')
    .insert([
      {
        entrega_id: entrega.id,
        nombre_archivo: filename,
        url: key,
        tamano_bytes: size
      }
    ])
    .select()
    .single();

  if (error) return { error: error.message };

  const { revalidatePath } = await import('next/cache');
  revalidatePath('/estudiante/cursos');

  return { success: true, archivo: data };
}

export async function deleteSubmissionFile(archivoId: number, fileKey: string, entregaId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  try {
    await deleteR2File(fileKey);
  } catch (err: any) {
    console.error("Error borrando de R2:", err);
  }

  // 1. Borrar archivo
  const { error: delError } = await supabase
    .from('entrega_archivos')
    .delete()
    .eq('id', archivoId);

  if (delError) return { error: delError.message };

  // 2. Verificar cuantos archivos le quedan a esta entrega
  const { count } = await supabase
    .from('entrega_archivos')
    .select('*', { count: 'exact', head: true })
    .eq('entrega_id', entregaId);

  // 3. Si no le quedan archivos, borrar la entrega para mantener la BD limpia (al menos que tenga comentarios, pero como el flow es solo de subida de archivos de momento lo borramos)
  if (count === 0) {
    await supabase.from('entregas').delete().eq('id', entregaId);
  }

  const { revalidatePath } = await import('next/cache');
  revalidatePath('/estudiante/cursos');

  return { success: true };
}
