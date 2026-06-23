'use server';

import { createClient } from '@/lib/supabase/server';

export async function getProfileAndCourses() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado' };

  // 1. Obtener perfil del estudiante
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('nombres, apellidos')
    .eq('id', user.id)
    .single();

  // 2. Obtener periodo activo
  const { data: periodoActivo } = await supabase
    .from('periodo_academico')
    .select('id, nombre')
    .eq('activo', true)
    .single();

  if (!periodoActivo) return { error: 'No hay periodo académico activo' };

  // 3. Cursos Matriculados (solo del periodo activo)
  const { data: matriculados, error } = await supabase
    .from('matriculados')
    .select(`
      curso_id,
      curso!inner (
        id,
        nombre,
        nivel:nivel_id(nombre)
      )
    `)
    .eq('estudiante_id', user.id)
    .eq('activo', true)
    .eq('curso.periodo_id', periodoActivo.id)
    .eq('curso.activo', true);

  if (error) return { error: error.message };

  const cursos = matriculados?.map(m => m.curso) || [];
  const cursosIds = cursos.map((c: any) => c?.id).filter(Boolean);

  return {
    perfil,
    periodo: periodoActivo,
    cursos,
    cursosIds
  };
}

export async function getTasksAndGrades(cursosIds: number[]) {
  if (!cursosIds || cursosIds.length === 0) {
    return { tareas: [], entregas: [], notas: [] };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  // 1. Obtener las sesiones de estos cursos
  const { data: sesiones } = await supabase
    .from('sesion_programacion')
    .select('id, curso_id')
    .in('curso_id', cursosIds);
    
  const sesionesIds = (sesiones || []).map(s => s.id);

  if (sesionesIds.length === 0) {
    return { tareas: [], entregas: [], notas: [] };
  }

  // 2. Obtener solo las Tareas de esas sesiones (¡No de toda la tabla!)
  const { data: tareas } = await supabase
    .from('tareas')
    .select('id, titulo, fecha_limite, sesion_id')
    .in('sesion_id', sesionesIds);
    
  const tareasDeMisCursos = (tareas || []).map(t => {
    const sesion = (sesiones || []).find(s => s.id === t.sesion_id);
    return { ...t, sesion: { curso_id: sesion?.curso_id } };
  });

  const tareasIds = tareasDeMisCursos.map(t => t.id);

  if (tareasIds.length === 0) {
    return { tareas: tareasDeMisCursos, entregas: [], notas: [] };
  }

  // 3. Entregas hechas por el estudiante (solo para estas tareas)
  const { data: entregas } = await supabase
    .from('entregas')
    .select('tarea_id')
    .eq('estudiante_id', user.id)
    .in('tarea_id', tareasIds);

  // 4. Notas del estudiante (solo para estas tareas)
  const { data: notas } = await supabase
    .from('notas')
    .select('nota')
    .eq('estudiante_id', user.id)
    .in('tarea_id', tareasIds);

  return {
    tareas: tareasDeMisCursos,
    entregas: entregas || [],
    notas: notas || []
  };
}

export async function getAsistencia(cursosIds: number[]) {
  if (!cursosIds || cursosIds.length === 0) {
    return { asistencias: [] };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  // Asistencia del estudiante
  const { data: sesiones } = await supabase
    .from('sesion_programacion')
    .select('id')
    .in('curso_id', cursosIds);
    
  const sesionesIds = (sesiones || []).map(s => s.id);

  if (sesionesIds.length === 0) return { asistencias: [] };

  const { data: asistenciaData } = await supabase
    .from('asistencia')
    .select('presente')
    .eq('estudiante_id', user.id)
    .in('sesion_id', sesionesIds);

  return {
    asistencias: asistenciaData || []
  };
}
