'use server';

import { createClient } from "@/lib/supabase/server";

export async function getTeacherProfileAndCourses() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  // 1. Obtener periodo activo
  const { data: periodoActivo } = await supabase
    .from('periodo_academico')
    .select('id, nombre')
    .eq('activo', true)
    .single();

  if (!periodoActivo) {
    return { error: "No hay periodo activo" };
  }

  // 2. Obtener cursos asignados al docente en este periodo
  const { data: docenteCursos } = await supabase
    .from('docente_curso')
    .select(`
      curso_id,
      curso:curso_id (id, nombre, periodo_id)
    `)
    .eq('docente_id', user.id);

  const cursosDelPeriodo = docenteCursos
    ?.filter((dc: any) => dc.curso?.periodo_id === periodoActivo.id)
    .map((dc: any) => dc.curso) || [];
  const cursoIds = cursosDelPeriodo.map((c: any) => c.id);

  // 3. Obtener sesiones programadas por este docente
  let sesiones: any[] = [];
  if (cursoIds.length > 0) {
    const { data: sesionesData } = await supabase
      .from('sesion_programacion')
      .select('id, curso_id')
      .eq('docente_id', user.id)
      .in('curso_id', cursoIds);
    sesiones = sesionesData || [];
  }
  const sesionIds = sesiones.map((s: any) => s.id);

  return {
    periodo: periodoActivo.nombre,
    cursos: cursosDelPeriodo,
    cursoIds,
    sesionesData: sesiones,
    sesionIds,
    stats: {
      cursosAsignados: cursosDelPeriodo.length,
      sesionesPendientes: sesiones.length
    }
  };
}

export async function getTeacherStudentsAndAttendance(cursoIds: number[], sesionIds: number[]) {
  const supabase = await createClient();

  let estudiantesUnicos = 0;
  let matriculadosRaw: any[] = [];
  if (cursoIds && cursoIds.length > 0) {
    const { data: matriculados } = await supabase
      .from('matriculados')
      .select('estudiante_id, curso_id, usuarios(id, nombres, apellidos)')
      .in('curso_id', cursoIds)
      .eq('activo', true);
    
    matriculadosRaw = matriculados || [];
    const estudiantesSet = new Set(matriculados?.map(m => m.estudiante_id));
    estudiantesUnicos = estudiantesSet.size;
  }

  let asistenciasRaw: any[] = [];
  if (sesionIds && sesionIds.length > 0) {
    const { data: asis } = await supabase
      .from('asistencia')
      .select('sesion_id, presente')
      .in('sesion_id', sesionIds);
    asistenciasRaw = asis || [];
  }

  return {
    estudiantesData: matriculadosRaw,
    asistenciasData: asistenciasRaw,
    totalEstudiantes: estudiantesUnicos
  };
}

export async function saveAttendance(sesionId: number, asistencias: { estudiante_id: string, presente: string }[]) {
  const supabase = await createClient();
  
  const payload = asistencias.map(a => ({
    sesion_id: sesionId,
    estudiante_id: a.estudiante_id,
    presente: a.presente
  }));

  const { error } = await supabase
    .from('asistencia')
    .upsert(payload, { onConflict: 'sesion_id, estudiante_id' });

  if (error) {
    console.error("Error guardando asistencia:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
