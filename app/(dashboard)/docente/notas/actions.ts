'use server';

import { createClient } from '@/lib/supabase/server';

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

  // Obtener cursos asignados al docente en este periodo
  const { data: docenteCursos, error } = await supabase
    .from('docente_curso')
    .select(`
      curso_id,
      curso!inner (
        id,
        nombre,
        nivel:nivel_id(nombre)
      )
    `)
    .eq('docente_id', user.id)
    .eq('curso.periodo_id', periodoActivo.id)
    .eq('curso.activo', true);

  if (error) return { error: error.message };

  const cursos = docenteCursos?.map((dc: any) => dc.curso) || [];
  return { cursos };
}

export async function getCourseRegistry(cursoId: number) {
  const supabase = await createClient();
  
  // 1. Obtener datos del curso
  const { data: curso } = await supabase
    .from('curso')
    .select('id, nombre, nivel:nivel_id(nombre)')
    .eq('id', cursoId)
    .single();

  if (!curso) return { error: 'Curso no encontrado' };

  // 2. Obtener Estudiantes matriculados
  const { data: matriculados } = await supabase
    .from('matriculados')
    .select(`
      estudiante:estudiante_id (
        id,
        nombres,
        apellidos
      )
    `)
    .eq('curso_id', cursoId)
    .eq('activo', true);

  const estudiantes = (matriculados || [])
    .map((m: any) => m.estudiante)
    .sort((a: any, b: any) => a.apellidos.localeCompare(b.apellidos)); // Orden alfabético

  // 3. Obtener Sesiones (para asistencia)
  const { data: sesiones } = await supabase
    .from('sesion_programacion')
    .select('id, nombre_sesion, created_at')
    .eq('curso_id', cursoId)
    .order('created_at', { ascending: true });

  const sesionIds = (sesiones || []).map((s: any) => s.id);

  // 4. Obtener Asistencias
  let asistencias: any[] = [];
  if (sesionIds.length > 0) {
    const { data: asis } = await supabase
      .from('asistencia')
      .select('estudiante_id, sesion_id, presente')
      .in('sesion_id', sesionIds);
    asistencias = asis || [];
  }

  // 5. Obtener Tareas (para notas)
  let tareas: any[] = [];
  if (sesionIds.length > 0) {
    const { data: ts } = await supabase
      .from('tareas')
      .select('id, sesion_id, titulo, fecha_limite')
      .in('sesion_id', sesionIds)
      .order('created_at', { ascending: true });
    tareas = ts || [];
  }

  const tareaIds = tareas.map((t: any) => t.id);

  // 6. Obtener Notas
  let notas: any[] = [];
  if (tareaIds.length > 0) {
    const { data: nts } = await supabase
      .from('notas')
      .select('estudiante_id, tarea_id, nota')
      .in('tarea_id', tareaIds);
    notas = nts || [];
  }

  return {
    curso: {
      nombre: curso.nombre,
      nivel: curso.nivel?.nombre
    },
    estudiantes,
    sesiones: sesiones || [],
    asistencias,
    tareas,
    notas
  };
}
