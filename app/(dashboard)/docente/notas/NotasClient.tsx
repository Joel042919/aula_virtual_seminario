'use client';

import React, { useState, useEffect } from 'react';
import { getTeacherCourses, getCourseRegistry } from './actions';
import { Loader2 } from 'lucide-react';
import { withCache } from '@/lib/clientCache';

export default function NotasClient() {
  const [cursos, setCursos] = useState<any[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');

  const [registryData, setRegistryData] = useState<any>(null);
  const [loadingRegistry, setLoadingRegistry] = useState(false);

  useEffect(() => {
    let mounted = true;
    withCache('docente_cursos_enrolled', () => getTeacherCourses()).then(res => {
      if (!mounted) return;
      if (!res.error && res.cursos) {
        setCursos(res.cursos);
        if (res.cursos.length > 0) setSelectedCourseId(res.cursos[0].id);
      }
      setLoadingCursos(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!selectedCourseId) return;

    const fetchRegistry = async () => {
      setLoadingRegistry(true);
      const res = await withCache(`docente_registry_${selectedCourseId}`, () => getCourseRegistry(Number(selectedCourseId)));
      if (mounted && !res.error) {
        setRegistryData(res);
      }
      if (mounted) setLoadingRegistry(false);
    };

    fetchRegistry();

    return () => { mounted = false; };
  }, [selectedCourseId]);

  // Helper to format date "DD.MM"
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}`;
  };

  const getAsistenciaMark = (estudianteId: string, sesionId: number) => {
    const a = registryData?.asistencias.find((a: any) => a.estudiante_id === estudianteId && a.sesion_id === sesionId);
    if (!a) return '-';
    return a.presente === 'presente' ? '✓' : a.presente === 'falta' ? 'F' : 'T';
  };

  const getNota = (estudianteId: string, tareaId: number) => {
    const n = registryData?.notas.find((n: any) => n.estudiante_id === estudianteId && n.tarea_id === tareaId);
    return n ? n.nota : '-';
  };

  const getNotaFinal = (estudianteId: string) => {
    if (!registryData) return '-';
    const notasAlumno = registryData.tareas.map((t: any) => getNota(estudianteId, t.id)).filter((n: any) => n !== '-');
    if (notasAlumno.length === 0) return '-';
    const sum = notasAlumno.reduce((acc: number, curr: any) => acc + Number(curr), 0);
    return (sum / notasAlumno.length).toFixed(1);
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Registro de Notas</h2>
        <p className="text-slate-500 mt-1 text-sm md:text-base">Consulta detallada de asistencia y calificaciones por estudiante.</p>
      </div>

      <div className="bg-brand-surface p-4 md:p-6 rounded-2xl border border-brand-surface-border shadow-sm">
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Curso Activo</label>
        {loadingCursos ? (
          <div className="h-[46px] w-full animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        ) : (
          <select 
            className="w-full px-4 py-3 bg-background text-foreground border border-brand-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition-all cursor-pointer"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(Number(e.target.value))}
          >
            {cursos.length === 0 && <option value="">No tienes cursos asignados</option>}
            {cursos.map((c: any) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        )}
      </div>

      {loadingRegistry ? (
        <div className="p-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-brand-surface border border-brand-surface-border rounded-2xl shadow-sm">
          <Loader2 className="animate-spin mb-4 text-brand-accent" size={32} />
          <p>Cargando información del registro...</p>
        </div>
      ) : registryData ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-surface-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 md:p-6 border-b border-brand-surface-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-foreground">{registryData.curso.nombre}</h3>
              <p className="text-sm text-slate-500">Nivel: {registryData.curso.nivel}</p>
            </div>
            <div className="flex gap-4 text-xs font-medium">
              <span className="flex items-center gap-1 text-emerald-500"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> ✓ Presente</span>
              <span className="flex items-center gap-1 text-red-500"><span className="w-2 h-2 rounded-full bg-red-500"></span> F Falta</span>
              <span className="flex items-center gap-1 text-amber-500"><span className="w-2 h-2 rounded-full bg-amber-500"></span> T Tarde</span>
            </div>
          </div>
          
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 whitespace-nowrap">
                <tr>
                  <th className="p-4 border-b border-brand-surface-border font-bold sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/90 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)]">
                    Estudiante
                  </th>
                  
                  {registryData.sesiones.length > 0 && (
                    <th colSpan={registryData.sesiones.length} className="p-4 border-b border-brand-surface-border font-bold text-center border-l">
                      Asistencia
                    </th>
                  )}
                  
                  {registryData.tareas.length > 0 && (
                    <th colSpan={registryData.tareas.length} className="p-4 border-b border-brand-surface-border font-bold text-center border-l">
                      Asignaciones
                    </th>
                  )}
                  
                  <th className="p-4 border-b border-brand-surface-border font-bold text-center border-l text-brand-primary dark:text-brand-accent">
                    Final
                  </th>
                </tr>
                <tr>
                  <th className="p-3 border-b border-brand-surface-border font-medium sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/90 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)] text-xs">
                    Apellidos y Nombres
                  </th>
                  
                  {registryData.sesiones.map((s: any) => (
                    <th key={s.id} className="p-3 border-b border-l border-brand-surface-border font-medium text-center text-xs">
                      {formatDate(s.created_at)}
                    </th>
                  ))}
                  
                  {registryData.tareas.map((t: any) => (
                    <th key={t.id} className="p-3 border-b border-l border-brand-surface-border font-medium text-center text-xs px-4" title={t.titulo}>
                      {t.titulo.length > 15 ? t.titulo.substring(0, 15) + '...' : t.titulo}
                    </th>
                  ))}
                  
                  <th className="p-3 border-b border-l border-brand-surface-border font-medium text-center text-xs">
                    Promedio
                  </th>
                </tr>
              </thead>
              <tbody>
                {registryData.estudiantes.map((est: any) => (
                  <tr key={est.id} className="border-b border-brand-surface-border/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-medium text-foreground whitespace-nowrap sticky left-0 z-10 bg-brand-surface dark:bg-[#111111] group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/30 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)] uppercase text-xs">
                      {est.apellidos} {est.nombres}
                    </td>
                    
                    {/* Asistencias */}
                    {registryData.sesiones.map((s: any) => {
                      const mark = getAsistenciaMark(est.id, s.id);
                      const color = mark === '✓' ? 'text-emerald-500' : mark === 'F' ? 'text-red-500' : mark === 'T' ? 'text-amber-500' : 'text-slate-300';
                      return (
                        <td key={s.id} className={`p-3 border-l border-brand-surface-border text-center font-bold ${color}`}>
                          {mark}
                        </td>
                      );
                    })}

                    {/* Notas */}
                    {registryData.tareas.map((t: any) => (
                      <td key={t.id} className="p-3 border-l border-brand-surface-border text-center text-slate-600 dark:text-slate-300">
                        {getNota(est.id, t.id)}
                      </td>
                    ))}
                    
                    {/* Nota Final */}
                    <td className="p-3 border-l border-brand-surface-border text-center font-bold text-brand-primary dark:text-brand-accent bg-brand-primary/5 dark:bg-brand-accent/5">
                      {getNotaFinal(est.id)}
                    </td>
                  </tr>
                ))}
                
                {registryData.estudiantes.length === 0 && (
                  <tr>
                    <td colSpan={2 + registryData.sesiones.length + registryData.tareas.length} className="p-8 text-center text-slate-500">
                      No hay estudiantes matriculados en este curso.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-brand-surface border border-brand-surface-border rounded-2xl shadow-sm">
          Selecciona un curso para empezar.
        </div>
      )}
    </div>
  );
}

