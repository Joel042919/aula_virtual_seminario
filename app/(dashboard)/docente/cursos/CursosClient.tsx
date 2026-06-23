'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { getTeacherCourses, getSessions, createSession } from './actions';
import { SessionBlock } from './SessionBlock';
import { Plus } from 'lucide-react';
import { withCache, invalidateCache } from '@/lib/clientCache';

function CursosSelector({ cursos, selectedCourseId, setSelectedCourseId }: any) {
  return (
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
  );
}

export default function CursosClient() {
  const [cursos, setCursos] = useState<any[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(true);

  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
  const [sesiones, setSesiones] = useState<any[]>([]);
  const [loadingSesiones, setLoadingSesiones] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [tipoSesion, setTipoSesion] = useState('teoria');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [urls, setUrls] = useState<string>(''); // comma separated for simplicity in form
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const fetchSesiones = useCallback(async (forceRefresh = false) => {
    if (!selectedCourseId) return;
    setLoadingSesiones(true);
    if (forceRefresh) invalidateCache(`docente_cursos_sesiones_${selectedCourseId}`);
    const { sesiones: data, error } = await withCache(`docente_cursos_sesiones_${selectedCourseId}`, () => getSessions(Number(selectedCourseId)));
    if (!error && data) {
      setSesiones(data);
    }
    setLoadingSesiones(false);
  }, [selectedCourseId]);

  useEffect(() => {
    fetchSesiones();
  }, [fetchSesiones]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    setIsSubmitting(true);

    const urlsArray = urls.split(',').map(u => u.trim()).filter(Boolean);

    const formData = {
      tipo_sesion: tipoSesion,
      titulo_personalizado: tipoSesion === 'teoria' ? titulo : undefined,
      tarea_titulo: tipoSesion !== 'teoria' ? titulo : undefined,
      tarea_descripcion: tipoSesion !== 'teoria' ? descripcion : undefined,
      tarea_fecha_limite: tipoSesion !== 'teoria' ? fechaLimite : undefined,
      urls: urlsArray
    };

    const result = await createSession(Number(selectedCourseId), formData);
    setIsSubmitting(false);

    if (result.success) {
      setShowForm(false);
      // Reset form
      setTitulo('');
      setDescripcion('');
      setFechaLimite('');
      setUrls('');
      fetchSesiones(true); // force refresh
    } else {
      alert("Error: " + result.error);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Gestión de Curso</h2>
        <p className="text-slate-500 mt-1">Programa sesiones, sube material y asigna tareas a tus estudiantes.</p>
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

      {selectedCourseId && (
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-foreground">Programa de Sesiones</h3>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-brand-primary-fg rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            Crear Sesión
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-brand-surface border border-brand-surface-border rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 space-y-4">
          <h4 className="text-lg font-bold text-foreground mb-4">Nueva Sesión / Tarea</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Tipo</label>
              <select 
                value={tipoSesion} 
                onChange={(e) => setTipoSesion(e.target.value)}
                className="w-full px-4 py-3 bg-background text-foreground border border-brand-surface-border rounded-xl text-sm"
              >
                <option value="teoria">Clase Teórica</option>
                <option value="practica">Tarea (Práctica)</option>
                <option value="examen">Examen</option>
                <option value="entrega_final">Entrega Final</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
                {tipoSesion === 'teoria' ? 'Título del Tema' : 'Título de la Evaluación/Tarea'}
              </label>
              <input 
                type="text" 
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder={tipoSesion === 'teoria' ? 'Ej: Introducción a la Teología' : 'Ej: Ensayo Final'}
                className="w-full px-4 py-3 bg-background text-foreground border border-brand-surface-border rounded-xl text-sm"
              />
            </div>

            {tipoSesion !== 'teoria' && (
              <>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Descripción / Instrucciones</label>
                  <textarea 
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="w-full px-4 py-3 bg-background text-foreground border border-brand-surface-border rounded-xl text-sm min-h-[100px]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Fecha Límite</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    className="w-full px-4 py-3 bg-background text-foreground border border-brand-surface-border rounded-xl text-sm"
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">URLs Adjuntas (Separadas por coma)</label>
              <input 
                type="text" 
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://youtube.com/..., https://wikipedia.org/..."
                className="w-full px-4 py-3 bg-background text-foreground border border-brand-surface-border rounded-xl text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">Los archivos los podrás subir después de crear el bloque arrastrándolos.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 bg-background border border-brand-surface-border text-foreground rounded-xl font-bold text-sm hover:border-brand-accent transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-brand-primary text-brand-primary-fg rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Crear Bloque'}
            </button>
          </div>
        </form>
      )}

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
            Aún no has creado ninguna sesión para este curso.
          </div>
        ) : (
          sesiones.map((sesion: any, index: number) => (
            <div key={sesion.id} className="relative md:pl-20">
              <div className="absolute left-7 top-6 w-3 h-3 bg-brand-accent rounded-full border-4 border-background hidden md:block -translate-x-1/2 z-10" />
              <SessionBlock sesion={sesion} onUpdate={fetchSesiones} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

