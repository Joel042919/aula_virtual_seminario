'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { getEnrolledCourses, getGradesData } from './actions';
import { BookOpen, GraduationCap, Clock, AlertCircle, CheckCircle, FileText, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { withCache } from '@/lib/clientCache';

export default function NotasClient() {
  const [cursos, setCursos] = useState<any[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');

  const [gradesData, setGradesData] = useState<any>({ tareas: [], entregas: [], notas: [] });
  const [loadingGrades, setLoadingGrades] = useState(false);

  useEffect(() => {
    let mounted = true;
    withCache('notas_cursos', () => getEnrolledCourses()).then(res => {
      if (!mounted) return;
      if (!res.error && res.cursos) {
        setCursos(res.cursos);
        if (res.cursos.length > 0) setSelectedCourseId((res.cursos[0] as any).id);
      }
      setLoadingCursos(false);
    });
    return () => { mounted = false; };
  }, []);

  const fetchGrades = useCallback(async () => {
    if (!selectedCourseId) return;
    setLoadingGrades(true);
    const res = await withCache(`notas_data_${selectedCourseId}`, () => getGradesData(Number(selectedCourseId)));
    if (!res.error) {
      setGradesData(res);
    }
    setLoadingGrades(false);
  }, [selectedCourseId]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  // Process data for rendering
  const processedTasks = useMemo(() => {
    const { tareas, entregas, notas } = gradesData;
    if (!tareas) return [];

    return tareas.map((tarea: any) => {
      const entrega = entregas.find((e: any) => e.tarea_id === tarea.id);
      const nota = notas.find((n: any) => n.tarea_id === tarea.id);
      
      const isOverdue = new Date() > new Date(tarea.fecha_limite);
      let status = 'pendiente';
      
      if (nota) status = 'calificado';
      else if (entrega) status = 'entregado';
      else if (isOverdue) status = 'falta';

      return {
        ...tarea,
        entrega,
        nota,
        status
      };
    });
  }, [gradesData]);

  const tareasPractica = processedTasks.filter((t: any) => t.tipo_sesion === 'practica');
  const tareasExamen = processedTasks.filter((t: any) => t.tipo_sesion === 'examen');
  const tareasFinal = processedTasks.filter((t: any) => t.tipo_sesion === 'entrega_final');

  const calcAverage = (tasksList: any[]) => {
    const calificadas = tasksList.filter(t => t.status === 'calificado');
    if (calificadas.length === 0) return '-';
    const sum = calificadas.reduce((acc, curr) => acc + Number(curr.nota.nota), 0);
    return (sum / calificadas.length).toFixed(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'calificado':
        return <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded dark:bg-green-900/20 dark:border-green-900 dark:text-green-400"><CheckCircle size={12}/> Calificado</span>;
      case 'entregado':
        return <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded dark:bg-blue-900/20 dark:border-blue-900 dark:text-blue-400"><Clock size={12}/> En Revisión</span>;
      case 'falta':
        return <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded dark:bg-red-900/20 dark:border-red-900 dark:text-red-400"><AlertCircle size={12}/> Falta Entregar</span>;
      default:
        return <span className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500 dark:text-slate-400"><Clock size={12}/> Pendiente</span>;
    }
  };

  const TaskCard = ({ task }: { task: any }) => (
    <div className="bg-brand-surface p-5 rounded-2xl border border-brand-surface-border shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center group hover:border-brand-primary/30 transition-colors">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h5 className="font-bold text-foreground text-lg">{task.titulo}</h5>
          {getStatusBadge(task.status)}
        </div>
        <div className="text-sm text-slate-500 mb-2">
          Vencimiento: {new Date(task.fecha_limite).toLocaleDateString()}
        </div>
        
        {task.status === 'calificado' && task.nota?.comentario_profesor && (
          <div className="mt-3 p-3 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-xl border border-brand-primary/10 relative">
            <span className="absolute -top-2.5 left-4 bg-brand-surface px-2 text-[10px] font-bold text-brand-primary uppercase tracking-wider">Comentario del Docente</span>
            <p className="text-sm text-foreground italic mt-1">&quot;{task.nota.comentario_profesor}&quot;</p>
          </div>
        )}
      </div>

      <div className="shrink-0 text-right sm:border-l border-brand-surface-border sm:pl-6 sm:ml-4 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 flex sm:flex-col justify-between sm:justify-center items-center">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Calificación</span>
        {task.status === 'calificado' ? (
          <div className="text-3xl font-black text-brand-primary dark:text-brand-accent">
            {task.nota.nota} <span className="text-lg text-slate-500 dark:text-slate-400 font-medium">/20</span>
          </div>
        ) : task.status === 'falta' ? (
          <div className="text-3xl font-black text-red-500">
            00 <span className="text-lg text-red-300 font-medium">/20</span>
          </div>
        ) : (
          <div className="text-2xl font-bold text-slate-300 dark:text-slate-700">-</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Mis Calificaciones</h2>
        <p className="text-slate-500 mt-1">Revisa el feedback de tus docentes y tu progreso académico.</p>
      </div>

      <div className="bg-brand-surface p-6 rounded-2xl border border-brand-surface-border shadow-sm">
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Seleccionar Curso</label>
        {loadingCursos ? (
          <div className="h-[46px] w-full animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        ) : (
          <select 
            className="w-full px-4 py-3 bg-background text-foreground border border-brand-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition-all cursor-pointer"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(Number(e.target.value))}
          >
            {cursos.length === 0 && <option value="">No tienes cursos matriculados</option>}
            {cursos.map((c: any) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        )}
      </div>

      {loadingGrades ? (
        <div className="space-y-8">
          {[1, 2].map(section => (
            <div key={section} className="space-y-4">
              <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
              {[1, 2].map(card => (
                <div key={card} className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ))}
        </div>
      ) : selectedCourseId && (
        <div className="space-y-10">
          
          {/* Promedio General del Curso Info */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-6 bg-brand-primary dark:bg-brand-surface text-brand-primary-fg dark:text-foreground rounded-2xl shadow-md border border-transparent dark:border-brand-surface-border">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-white/20 dark:bg-brand-primary/20 rounded-xl">
                 <GraduationCap size={32} />
               </div>
               <div>
                 <h3 className="font-bold text-xl">Resumen del Curso</h3>
                 <p className="text-brand-primary-fg/80 dark:text-slate-500 dark:text-slate-400 text-sm">Rendimiento global calculado en base a las tareas calificadas.</p>
               </div>
             </div>
             <div className="text-center sm:text-right">
                <span className="text-4xl font-black tracking-tight">{calcAverage(processedTasks)}</span>
                <span className="text-xl opacity-70"> /20</span>
             </div>
          </div>

          {/* Prácticas y Tareas */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-foreground border-b border-brand-surface-border pb-2">
              <FileText size={20} className="text-brand-accent" />
              Prácticas y Tareas ({calcAverage(tareasPractica)})
            </h3>
            {tareasPractica.length === 0 ? (
              <p className="text-slate-500 text-sm italic py-4">No hay prácticas o tareas asignadas aún.</p>
            ) : (
              <div className="space-y-3">
                {tareasPractica.map((t: any) => <TaskCard key={t.id} task={t} />)}
              </div>
            )}
          </section>

          {/* Exámenes */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-foreground border-b border-brand-surface-border pb-2">
              <BookOpen size={20} className="text-brand-accent" />
              Exámenes ({calcAverage(tareasExamen)})
            </h3>
            {tareasExamen.length === 0 ? (
              <p className="text-slate-500 text-sm italic py-4">No hay exámenes asignados aún.</p>
            ) : (
              <div className="space-y-3">
                {tareasExamen.map((t: any) => <TaskCard key={t.id} task={t} />)}
              </div>
            )}
          </section>

          {/* Entrega Final */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-foreground border-b border-brand-surface-border pb-2">
              <Star size={20} className="text-brand-accent" />
              Entrega Final ({calcAverage(tareasFinal)})
            </h3>
            {tareasFinal.length === 0 ? (
              <p className="text-slate-500 text-sm italic py-4">No hay entrega final programada aún.</p>
            ) : (
              <div className="space-y-3">
                {tareasFinal.map((t: any) => <TaskCard key={t.id} task={t} />)}
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );
}

