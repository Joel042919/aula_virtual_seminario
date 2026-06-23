'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getEnrolledCourses, getCourseContent } from './actions';
import { StudentSessionBlock } from './StudentSessionBlock';
import { withCache, invalidateCache } from '@/lib/clientCache';

function CursosSelector({ cursos, selectedCourseId, setSelectedCourseId }: any) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const cursoIdParam = searchParams.get('cursoId');
    if (cursoIdParam) {
      const id = Number(cursoIdParam);
      // Solo seleccionar si el curso existe en su lista de matriculados
      if (cursos.some((c: any) => c.id === id)) {
        setSelectedCourseId(id);
      }
    }
  }, [searchParams, cursos, setSelectedCourseId]);

  return (
    <select 
      className="w-full px-4 py-3 bg-background text-foreground border border-brand-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition-all cursor-pointer"
      value={selectedCourseId}
      onChange={(e) => setSelectedCourseId(Number(e.target.value))}
    >
      {cursos.length === 0 && <option value="">No estás matriculado en ningún curso</option>}
      {cursos.map((c: any) => (
        <option key={c.id} value={c.id}>{c.nombre}</option>
      ))}
    </select>
  );
}

export default function EstudianteCursosClient() {
  const [cursos, setCursos] = useState<any[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(true);

  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
  const [sesiones, setSesiones] = useState<any[]>([]);
  const [loadingSesiones, setLoadingSesiones] = useState(false);

  useEffect(() => {
    let mounted = true;
    withCache('cursos_enrolled', () => getEnrolledCourses()).then(res => {
      if (!mounted) return;
      if (!res.error && res.cursos) {
        setCursos(res.cursos);
        if (res.cursos.length > 0) setSelectedCourseId(res.cursos[0].id);
      }
      setLoadingCursos(false);
    });
    return () => { mounted = false; };
  }, []);

  const fetchSesiones = useCallback(async (forceRefresh = false) => {
    if (!selectedCourseId) return;
    setLoadingSesiones(true);
    if (forceRefresh) invalidateCache(`cursos_content_${selectedCourseId}`);
    const { sesiones: data, error } = await withCache(`cursos_content_${selectedCourseId}`, () => getCourseContent(Number(selectedCourseId)));
    if (!error && data) {
      setSesiones(data);
    }
    setLoadingSesiones(false);
  }, [selectedCourseId]);

  useEffect(() => {
    fetchSesiones();
  }, [fetchSesiones]);

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Contenido del Curso</h2>
        <p className="text-slate-500 mt-1">Accede a las clases de tu docente y sube tus evaluaciones.</p>
      </div>

      <div className="bg-brand-surface p-6 rounded-2xl border border-brand-surface-border shadow-sm">
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Seleccionar Curso</label>
        {loadingCursos ? (
          <div className="h-[46px] w-full animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        ) : (
          <Suspense fallback={<div className="h-[46px] w-full animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl"></div>}>
            <CursosSelector 
              cursos={cursos} 
              selectedCourseId={selectedCourseId} 
              setSelectedCourseId={setSelectedCourseId} 
            />
          </Suspense>
        )}
      </div>

      <div className="space-y-0 mt-8 relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-brand-surface-border hidden md:block" />

        {loadingCursos || loadingSesiones ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative md:pl-20 mb-6">
                <div className="absolute left-7 top-6 w-3 h-3 bg-brand-surface-border rounded-full border-4 border-background hidden md:block -translate-x-1/2 z-10" />
                <div className="p-6 border border-brand-surface-border rounded-2xl shadow-sm bg-brand-surface animate-pulse">
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded mb-3"></div>
                  <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                  <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800 rounded mt-4"></div>
                </div>
              </div>
            ))}
          </>
        ) : sesiones.length === 0 ? (
          <div className="text-center py-12 bg-brand-surface rounded-2xl border border-dashed border-brand-surface-border text-slate-500 dark:text-slate-400">
            Aún no hay sesiones programadas por el docente para este curso.
          </div>
        ) : (
          sesiones.map((sesion: any) => (
            <div key={sesion.id} className="relative md:pl-20">
              <div className="absolute left-7 top-6 w-3 h-3 bg-brand-accent rounded-full border-4 border-background hidden md:block -translate-x-1/2 z-10" />
              <StudentSessionBlock sesion={sesion} onUpdate={() => fetchSesiones(true)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

