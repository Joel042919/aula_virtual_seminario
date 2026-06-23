'use server';

import { createClient } from '@/lib/supabase/server';

export async function getEnrolledCourses() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado' };

  const { data: periodoActivo } = await supabase
    .from('periodo_academico')
    .select('id')
    .eq('activo', true)
    .single();

  if (!periodoActivo) return { error: 'No hay periodo activo' };

  const { data: matriculados, error } = await supabase
    .from('matriculados')
    .select(`
      curso_id,
      curso!inner (
        id,
        nombre,
        periodo_id
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

export async function getGradesData(cursoId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado' };

  // 1. Obtener todas las sesiones del curso para clasificar el tipo de tarea
  const { data: sesiones, error: sesionError } = await supabase
    .from('sesion_programacion')
    .select('id, tipo_sesion')
    .eq('curso_id', cursoId);

  if (sesionError) return { error: sesionError.message };
  
  const sesionIds = sesiones?.map(s => s.id) || [];

  if (sesionIds.length === 0) {
    return { tareas: [], entregas: [], notas: [] };
  }

  // 2. Obtener todas las tareas de esas sesiones
  const { data: tareas } = await supabase
    .from('tareas')
    .select('id, sesion_id, titulo, fecha_limite')
    .in('sesion_id', sesionIds);

  const tareasMap = (tareas || []).map(t => {
    const s = sesiones.find(ses => ses.id === t.sesion_id);
    return { ...t, tipo_sesion: s?.tipo_sesion };
  });

  const tareaIds = tareasMap.map(t => t.id);

  if (tareaIds.length === 0) {
    return { tareas: [], entregas: [], notas: [] };
  }

  // 3. Obtener las entregas del estudiante para estas tareas
  const { data: entregas } = await supabase
    .from('entregas')
    .select('id, tarea_id, fecha_entrega')
    .eq('estudiante_id', user.id)
    .in('tarea_id', tareaIds);

  // 4. Obtener las notas del estudiante para estas tareas
  const { data: notas } = await supabase
    .from('notas')
    .select('id, tarea_id, nota, comentario_profesor, fecha_calificacion')
    .eq('estudiante_id', user.id)
    .in('tarea_id', tareaIds);

  return {
    tareas: tareasMap,
    entregas: entregas || [],
    notas: notas || []
  };
}
