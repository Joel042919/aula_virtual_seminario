'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getCourseTasks, getTaskSubmissions, saveGrade } from './actions';
import { CheckCircle, Clock, XCircle, Search, File as FileIcon, X, Save } from 'lucide-react';

export default function CalificarClient({ cursos }: { cursos: any[] }) {
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>(cursos.length > 0 ? cursos[0].id : '');
  const [tareas, setTareas] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | ''>('');
  
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [loadingTareas, setLoadingTareas] = useState(false);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false);

  // Grading Modal State
  const [activeStudent, setActiveStudent] = useState<any>(null);
  const [nota, setNota] = useState<string>('');
  const [comentario, setComentario] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchTareas = useCallback(async () => {
    if (!selectedCourseId) {
      setTareas([]);
      return;
    }
    setLoadingTareas(true);
    const { tareas: data, error } = await getCourseTasks(Number(selectedCourseId));
    if (!error && data) {
      setTareas(data);
      if (data.length > 0) setSelectedTaskId(data[0].id);
      else setSelectedTaskId('');
    }
    setLoadingTareas(false);
  }, [selectedCourseId]);

  const fetchSubmissions = useCallback(async () => {
    if (!selectedCourseId || !selectedTaskId) {
      setEstudiantes([]);
      return;
    }
    setLoadingEstudiantes(true);
    const { estudiantes: data, error } = await getTaskSubmissions(Number(selectedCourseId), Number(selectedTaskId));
    if (!error && data) {
      setEstudiantes(data);
    }
    setLoadingEstudiantes(false);
  }, [selectedCourseId, selectedTaskId]);

  useEffect(() => {
    fetchTareas();
  }, [fetchTareas]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const openGradingModal = (studentData: any) => {
    setActiveStudent(studentData);
    setNota(studentData.nota?.nota != null ? String(studentData.nota.nota) : '');
    setComentario(studentData.nota?.comentario_profesor || '');
  };

  const closeGradingModal = () => {
    setActiveStudent(null);
    setNota('');
    setComentario('');
  };

  const handleSaveGrade = async () => {
    if (!activeStudent || !selectedTaskId) return;
    setIsSaving(true);
    const numNota = nota === '' ? null : parseFloat(nota);
    
    const result = await saveGrade(Number(selectedTaskId), activeStudent.estudiante.id, numNota, comentario);
    setIsSaving(false);

    if (result.success) {
      // Optimistic update locally
      const updatedList = estudiantes.map(e => {
        if (e.estudiante.id === activeStudent.estudiante.id) {
          return {
            ...e,
            nota: {
              ...(e.nota || {}),
              nota: numNota,
              comentario_profesor: comentario,
              fecha_calificacion: new Date().toISOString()
            }
          };
        }
        return e;
      });
      setEstudiantes(updatedList);
      closeGradingModal();
    } else {
      alert("Error al guardar: " + result.error);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Calificar Entregas</h2>
        <p className="text-slate-500 mt-1">Revisa trabajos y asigna notas a tus estudiantes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-brand-surface p-6 rounded-2xl border border-brand-surface-border shadow-sm">
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Curso</label>
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
        </div>
        
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Evaluación / Tarea</label>
          <select 
            className="w-full px-4 py-3 bg-background text-foreground border border-brand-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition-all cursor-pointer"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(Number(e.target.value))}
            disabled={loadingTareas || tareas.length === 0}
          >
            {loadingTareas && <option value="">Cargando...</option>}
            {!loadingTareas && tareas.length === 0 && <option value="">No hay tareas programadas</option>}
            {tareas.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.sesion?.tipo_sesion.toUpperCase()} - {t.titulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingEstudiantes ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">Cargando lista de estudiantes...</div>
      ) : estudiantes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {estudiantes.map((s: any) => {
            const hasEntrega = !!s.entrega;
            const hasNota = !!s.nota;

            let statusColor = "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700";
            let statusText = "Sin Entregar";
            let StatusIcon = XCircle;

            if (hasEntrega && !hasNota) {
              statusColor = "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/30";
              statusText = "Por Evaluar";
              StatusIcon = Clock;
            } else if (hasNota) {
              statusColor = "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-900/30";
              statusText = "Evaluado";
              StatusIcon = CheckCircle;
            }

            return (
              <div 
                key={s.estudiante.id}
                onClick={() => openGradingModal(s)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${hasNota ? 'bg-background hover:border-green-300 dark:hover:border-green-700' : 'bg-brand-surface hover:border-brand-primary'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 text-xs font-bold tracking-wide ${statusColor}`}>
                    <StatusIcon size={14} />
                    {statusText}
                  </div>
                  {hasNota && (
                    <div className="text-xl font-black text-brand-primary dark:text-brand-accent">
                      {s.nota.nota}
                    </div>
                  )}
                </div>
                
                <h4 className="font-bold text-foreground text-lg mb-1">{s.estudiante.apellidos}, {s.estudiante.nombres}</h4>
                {hasEntrega && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <FileIcon size={12} /> {s.entrega.entrega_archivos?.length || 0} archivo(s) adjunto(s)
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : selectedTaskId ? (
        <div className="text-center py-12 bg-brand-surface rounded-2xl border border-dashed border-brand-surface-border text-slate-500 dark:text-slate-400">
          No hay estudiantes matriculados en este curso.
        </div>
      ) : null}

      {/* Split-View Grading Modal */}
      {activeStudent && (
        <div className="fixed inset-0 z-[100] flex bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full h-full md:p-6 flex flex-col md:flex-row gap-4">
            
            {/* Contenedor Principal Split */}
            <div className="w-full h-full bg-brand-surface md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
              
              <button 
                onClick={closeGradingModal}
                className="absolute top-4 right-4 z-10 p-2 bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 rounded-full text-foreground transition-colors"
              >
                <X size={20} />
              </button>

              {/* LEFT SIDE: Document Viewer */}
              <div className="flex-1 bg-slate-100 dark:bg-slate-900 border-b md:border-b-0 md:border-r border-brand-surface-border overflow-y-auto flex flex-col items-center justify-center p-4 min-h-[50vh] md:min-h-0">
                {activeStudent.entrega && activeStudent.entrega.entrega_archivos && activeStudent.entrega.entrega_archivos.length > 0 ? (
                  <div className="w-full max-w-4xl space-y-4">
                    {/* Mensaje/Comentario del alumno */}
                    {activeStudent.entrega.comentario && (
                      <div className="p-4 bg-brand-surface border border-brand-surface-border rounded-xl mb-4">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Comentario del alumno:</span>
                        <p className="text-sm mt-1">{activeStudent.entrega.comentario}</p>
                      </div>
                    )}
                    
                    {/* Archivos renderizados */}
                    {activeStudent.entrega.entrega_archivos.map((file: any, i: number) => {
                      const urlWithoutQuery = file.fullUrl.split('?')[0];
                      const isPdf = urlWithoutQuery.toLowerCase().endsWith('.pdf');
                      
                      return (
                        <div key={i} className="w-full rounded-xl overflow-hidden shadow-lg border border-brand-surface-border bg-white">
                          <div className="px-4 py-2 bg-slate-50 border-b flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500">{file.nombre_archivo}</span>
                            <a href={file.fullUrl} target="_blank" download className="text-xs text-brand-primary hover:underline">Descargar original</a>
                          </div>
                          <div className="w-full overflow-hidden" style={{ height: isPdf ? '75vh' : 'auto' }}>
                            {isPdf ? (
                              <iframe src={file.fullUrl} className="w-full h-full border-0" />
                            ) : (
                              <img src={file.fullUrl} className="w-full h-auto object-contain" alt="Trabajo" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-slate-500 dark:text-slate-400 flex flex-col items-center">
                    <XCircle size={48} className="mb-4 opacity-50" />
                    <p>Este estudiante no ha enviado ningún archivo para esta tarea.</p>
                  </div>
                )}
              </div>

              {/* RIGHT SIDE: Grading Form */}
              <div className="w-full md:w-[400px] shrink-0 bg-brand-surface p-6 overflow-y-auto flex flex-col">
                <div className="mb-6 pt-8 md:pt-0">
                  <h3 className="text-xl font-black text-foreground">{activeStudent.estudiante.apellidos}, {activeStudent.estudiante.nombres}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Calificando entrega</p>
                </div>

                <div className="space-y-6 flex-1">
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Nota Final</label>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      max="20"
                      placeholder="Ej: 18.5"
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      className="w-full px-5 py-4 text-2xl font-black text-center bg-background text-brand-primary border-2 border-brand-surface-border rounded-2xl focus:outline-none focus:border-brand-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Comentario (Retroalimentación)</label>
                    <textarea 
                      placeholder="Escribe un comentario o feedback para el estudiante..."
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      className="w-full px-4 py-3 bg-background text-foreground border border-brand-surface-border rounded-xl text-sm min-h-[150px] focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition-all"
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-3 pt-4 border-t border-brand-surface-border">
                  <button 
                    onClick={closeGradingModal}
                    className="flex-1 py-3 bg-background border border-brand-surface-border rounded-xl font-bold text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cerrar
                  </button>
                  <button 
                    onClick={handleSaveGrade}
                    disabled={isSaving}
                    className="flex-1 py-3 flex justify-center items-center gap-2 bg-brand-primary text-brand-primary-fg rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Nota'}
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

