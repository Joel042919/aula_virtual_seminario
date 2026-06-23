'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, File, Trash2, Link as LinkIcon, Eye, Download, X, AlertCircle } from 'lucide-react';
import { getUploadUrl, saveSubmissionFile, deleteSubmissionFile, getPresignedDownloadUrl } from './actions';

export const StudentSessionBlock = ({ sesion, onUpdate }: { sesion: any, onUpdate: () => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Deletion State
  const [fileToDelete, setFileToDelete] = useState<{id: number, key: string, name: string, entregaId: number} | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // Viewer State
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const isRed = ['examen', 'entrega_final'].includes(sesion.tipo_sesion);
  const isPractica = sesion.tipo_sesion === 'practica'; // "Tarea"

  const bgClass = isRed 
    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' 
    : 'bg-white dark:bg-brand-surface border-brand-surface-border';

  const titleClass = isRed 
    ? 'text-red-700 dark:text-red-400' 
    : 'text-foreground';

  const isViewable = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(ext || '');
  };

  const handleFileUpload = async (files: FileList | null, tareaId: number) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const uploadRes = await getUploadUrl(file.name, file.type) as any;
        const { url, key, error } = uploadRes;
        if (error || !url) throw new Error(error || 'Error getting upload url');

        // Subir directamente a R2
        await fetch(url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        // Guardar metadata del alumno en entrega_archivos
        await saveSubmissionFile(tareaId, file.name, key, file.size);
      } catch (err) {
        console.error("Error subiendo archivo:", err);
        alert(`Error al subir ${file.name}`);
      }
    }

    setIsUploading(false);
    onUpdate(); // Refrescar para ver los nuevos archivos
  };

  const handleDrop = (e: React.DragEvent, tareaId: number) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files, tareaId);
  };

  const handleDeleteFileConfirm = async () => {
    if (!fileToDelete) return;
    setIsDeletingFile(true);
    await deleteSubmissionFile(fileToDelete.id, fileToDelete.key, fileToDelete.entregaId);
    setIsDeletingFile(false);
    setFileToDelete(null);
    onUpdate();
  };

  return (
    <>
      <div className={`p-6 border rounded-2xl shadow-sm relative ${bgClass} mb-6 transition-all`}>
        {/* Cabecera Sesión */}
        <div className="mb-4">
          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded mb-2 inline-block ${isRed ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500 dark:text-slate-400'}`}>
            {isPractica ? 'Tarea' : sesion.tipo_sesion.replace('_', ' ')}
          </span>
          <h4 className={`text-xl font-bold ${titleClass}`}>{sesion.nombre_sesion}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Publicado: {new Date(sesion.created_at).toLocaleDateString()}</p>
        </div>

        {/* URLs del Profesor */}
        {sesion.urls && sesion.urls.length > 0 && (
          <div className="mb-4 space-y-2">
            <h5 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Enlaces de la clase</h5>
            {sesion.urls.map((url: string, i: number) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand-primary dark:text-brand-accent hover:underline">
                <LinkIcon size={14} /> {url}
              </a>
            ))}
          </div>
        )}

        {/* Archivos del Profesor (Sólo lectura) */}
        {sesion.sesion_archivos && sesion.sesion_archivos.length > 0 && (
          <div className="mb-6 space-y-2">
            <h5 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Materiales del Docente</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sesion.sesion_archivos.map((file: any) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-background border border-brand-surface-border rounded-xl">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <File size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
                    <span className="text-sm text-foreground truncate">{file.nombre_archivo}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isViewable(file.nombre_archivo) && (
                      <button onClick={async () => {
                        const { url } = await getPresignedDownloadUrl(file.url);
                        if (url) setViewerUrl(url);
                      }} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-accent hover:bg-brand-accent/10 rounded transition-colors" title="Ver documento">
                        <Eye size={16} />
                      </button>
                    )}
                    <button onClick={async () => {
                      const { url } = await getPresignedDownloadUrl(file.url);
                      if (url) {
                        const a = document.createElement('a');
                        a.href = url;
                        a.target = '_blank';
                        a.download = file.nombre_archivo;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }
                    }} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded transition-colors" title="Descargar original">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tarea a presentar (Módulo de Entrega) */}
        {sesion.tareas && sesion.tareas.length > 0 && (() => {
          const tarea = sesion.tareas[0];
          const mi_entrega = tarea.mi_entrega;
          const deadline = new Date(tarea.fecha_limite);
          const isOverdue = new Date() > deadline;

          return (
            <div className="mt-6 p-5 bg-background dark:bg-black/20 rounded-2xl border border-brand-surface-border">
              <h5 className="font-bold text-foreground text-lg mb-2">{tarea.titulo}</h5>
              {tarea.descripcion && (
                <p className="text-sm text-slate-500 mb-4 whitespace-pre-wrap">{tarea.descripcion}</p>
              )}
              
              <div className="flex items-center gap-2 mb-6">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-lg inline-block ${isOverdue ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900/30' : 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20'}`}>
                  Vence: {deadline.toLocaleString()}
                </span>
                {isOverdue && (
                  <span className="text-xs text-red-500 flex items-center gap-1 font-bold">
                    <AlertCircle size={14} /> Fecha límite superada
                  </span>
                )}
              </div>

              {/* Zona de Subida del Alumno */}
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${isUploading ? 'bg-slate-50 dark:bg-slate-900 border-brand-accent/50' : 'border-slate-300 dark:border-slate-700 hover:border-brand-primary hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, tarea.id)}
              >
                <UploadCloud size={24} className="mx-auto text-slate-500 dark:text-slate-400 mb-2" />
                <p className="text-sm text-slate-500 font-medium">
                  {isUploading ? 'Subiendo tu entrega...' : 'Arrastra tu trabajo aquí o'}
                </p>
                {!isUploading && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-brand-primary dark:text-brand-accent font-bold text-sm hover:underline"
                  >
                    Selecciona tus archivos
                  </button>
                )}
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={(e) => handleFileUpload(e.target.files, tarea.id)}
                />
              </div>

              {/* Archivos Enviados por el Alumno */}
              {mi_entrega && mi_entrega.entrega_archivos && mi_entrega.entrega_archivos.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h6 className="text-xs font-bold text-brand-primary dark:text-brand-accent uppercase tracking-wider mb-3">Archivos Enviados</h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mi_entrega.entrega_archivos.map((file: any) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-brand-surface border border-brand-primary/20 dark:border-brand-accent/20 rounded-xl group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <File size={16} className="text-brand-primary dark:text-brand-accent shrink-0" />
                          <span className="text-sm text-foreground truncate">{file.nombre_archivo}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {isViewable(file.nombre_archivo) && (
                            <button onClick={async () => {
                              const { url } = await getPresignedDownloadUrl(file.url);
                              if (url) setViewerUrl(url);
                            }} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-accent hover:bg-brand-accent/10 rounded transition-colors" title="Ver envío">
                              <Eye size={16} />
                            </button>
                          )}
                          <button onClick={() => setFileToDelete({ id: file.id, key: file.url, name: file.nombre_archivo, entregaId: mi_entrega.id })} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Eliminar envío">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      </div>

      {/* Delete File Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-brand-surface w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-foreground mb-2">¿Eliminar tu archivo?</h3>
            <p className="text-slate-500 mb-6">El archivo <strong className="text-foreground">{fileToDelete.name}</strong> será retirado de tu entrega.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setFileToDelete(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                disabled={isDeletingFile}
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteFileConfirm}
                className="px-5 py-2.5 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                disabled={isDeletingFile}
              >
                {isDeletingFile ? 'Borrando...' : 'Sí, eliminar envío'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Viewer Modal */}
      {viewerUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-8 animate-in fade-in duration-200">
          <button 
            onClick={() => setViewerUrl(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          >
            <X size={24} />
          </button>
          <div className="relative w-full h-full flex items-center justify-center">
            {viewerUrl.split('?')[0].toLowerCase().endsWith('.pdf') ? (
              <iframe src={viewerUrl} className="w-full h-full max-w-5xl bg-white rounded-xl shadow-2xl" />
            ) : (
              <img src={viewerUrl} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" alt="Preview" />
            )}
          </div>
        </div>
      )}
    </>
  );
}

