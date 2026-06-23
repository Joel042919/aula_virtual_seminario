'use server';

import { createClient } from '@/lib/supabase/server';
import { getDownloadPresignedUrl } from '@/lib/r2';
import { getTeacherCourses } from '../cursos/actions';

export { getTeacherCourses }; // Reutilizamos la de cursos

export async function getCourseTasks(cursoId: number) {
  const supabase = await createClient();
  
  // Obtenemos solo las sesiones que tengan tareas (practica, examen, entrega_final)
  const { data: tareas, error } = await supabase
    .from('tareas')
    .select(`
      id,
      titulo,
      fecha_limite,
      sesion:sesion_id (
        id,
        nombre_sesion,
        tipo_sesion,
        curso_id
      )
    `)
    .eq('sesion.curso_id', cursoId)
    .order('fecha_limite', { ascending: false });

  if (error) return { error: error.message };
  
  // Supabase con foreign tables filter devuelve null en la tabla foranea si no coincide, filtramos
  const filteredTareas = (tareas || []).filter(t => t.sesion !== null);

  return { tareas: filteredTareas };
}

export async function getTaskSubmissions(cursoId: number, tareaId: number) {
  const supabase = await createClient();
  
  // 1. Obtener todos los estudiantes matriculados en el curso
  const { data: matriculados, error: matError } = await supabase
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

  if (matError) return { error: matError.message };

  if (!matriculados || matriculados.length === 0) return { estudiantes: [] };

  const estudiantesIds = matriculados.map(m => m.estudiante.id);

  // 2. Obtener entregas para esta tarea de los estudiantes matriculados
  const { data: entregas } = await supabase
    .from('entregas')
    .select(`
      id,
      estudiante_id,
      comentario,
      fecha_entrega,
      entrega_archivos (*)
    `)
    .eq('tarea_id', tareaId)
    .in('estudiante_id', estudiantesIds);

  // 3. Obtener notas para esta tarea
  const { data: notas } = await supabase
    .from('notas')
    .select(`
      id,
      estudiante_id,
      nota,
      comentario_profesor,
      fecha_calificacion
    `)
    .eq('tarea_id', tareaId)
    .in('estudiante_id', estudiantesIds);

  // Mapear y juntar todo
  const list = await Promise.all(matriculados.map(async (m) => {
    const estudiante = m.estudiante;
    const entrega = (entregas || []).find(e => e.estudiante_id === estudiante.id);
    const notaInfo = (notas || []).find(n => n.estudiante_id === estudiante.id);

    // Firmar URLs si existen archivos en la entrega
    let archivosFirmados = [];
    if (entrega && entrega.entrega_archivos) {
      archivosFirmados = await Promise.all(entrega.entrega_archivos.map(async (archivo: any) => ({
        ...archivo,
        fullUrl: await getDownloadPresignedUrl(archivo.url)
      })));
    }

    return {
      estudiante,
      entrega: entrega ? { ...entrega, entrega_archivos: archivosFirmados } : null,
      nota: notaInfo || null
    };
  }));

  // Ordenar por Apellido
  list.sort((a, b) => a.estudiante.apellidos.localeCompare(b.estudiante.apellidos));

  return { estudiantes: list };
}

export async function saveGrade(tareaId: number, estudianteId: string, nota: number | null, comentarioProfesor: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  if (nota === null && !comentarioProfesor) {
    // Si envían ambos vacíos, podríamos querer borrar la nota o simplemente no hacer nada.
    // Asumiremos que si llaman aquí, es un guardado. Si ambos son null/vacío, podemos borrar el registro.
    const { error: delError } = await supabase.from('notas').delete().match({ tarea_id: tareaId, estudiante_id: estudianteId });
    if (delError) return { error: delError.message };
    return { success: true };
  }

  // Verificar si ya existe nota
  const { data: existingNota } = await supabase
    .from('notas')
    .select('id')
    .match({ tarea_id: tareaId, estudiante_id: estudianteId })
    .single();

  if (existingNota) {
    const { error } = await supabase
      .from('notas')
      .update({ nota, comentario_profesor: comentarioProfesor, fecha_calificacion: new Date().toISOString() })
      .eq('id', existingNota.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from('notas')
      .insert([{
        tarea_id: tareaId,
        estudiante_id: estudianteId,
        nota,
        comentario_profesor: comentarioProfesor
      }]);
    if (error) return { error: error.message };
  }

  return { success: true };
}
