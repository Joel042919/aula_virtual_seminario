'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, File, Trash2, Link as LinkIcon, Edit2, Eye, Download, X, Save } from 'lucide-react';
import { getUploadUrl, saveFileMetadata, deleteSession, deleteFile, updateSession, getPresignedDownloadUrl } from './actions';

export const SessionBlock = ({ sesion, onUpdate }: { sesion: any, onUpdate: () => void }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Parse the title safely (removing "Sesion X - " for Teoria)
  const extractTitle = (fullTitle: string, type: string) => {
    if (type !== 'teoria') return fullTitle;
    const parts = fullTitle.split(' - ');
    return parts.length > 1 ? parts[1] : fullTitle;
  };

  const [editForm, setEditForm] = useState({
    titulo_personalizado: extractTitle(sesion.nombre_sesion, sesion.tipo_sesion),
    urls: sesion.urls ? sesion.urls.join(', ') : '',
    tarea_titulo: sesion.tareas?.[0]?.titulo || '',
    tarea_descripcion: sesion.tareas?.[0]?.descripcion || '',
    tarea_fecha_limite: sesion.tareas?.[0]?.fecha_limite ? new Date(sesion.tareas[0].fecha_limite).toISOString().slice(0, 16) : ''
  });

  // File Deletion State
  const [fileToDelete, setFileToDelete] = useState<{id: number, key: string, name: string} | null>(null);
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

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteSession(sesion.id);
    setIsDeleting(false);
    setShowConfirm(false);
    onUpdate();
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    const urlsArray = editForm.urls.split(',').map((u: string) => u.trim()).filter(Boolean);
    
    await updateSession(sesion.id, {
      ...editForm,
      urls: urlsArray
    });
    
    setIsUpdating(false);
    setIsEditing(false);
    onUpdate();
  };

  const handleDeleteFileConfirm = async () => {
    if (!fileToDelete) return;
    setIsDeletingFile(true);
    await deleteFile(fileToDelete.id, fileToDelete.key);
    setIsDeletingFile(false);
    setFileToDelete(null);
    onUpdate();
  };

  const handleFileUpload = async (files: FileList | null) => {
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

        // Guardar Metadata
        await saveFileMetadata(sesion.id, file.name, key, file.size);
      } catch (err) {
        console.error("Error subiendo archivo:", err);
        alert(`Error al subir ${file.name}`);
      }
    }

    setIsUploading(false);
    onUpdate(); // Refrescar para ver los nuevos archivos
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  };

  const isViewable = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(ext || '');
  };

  if (isEditing) {
    return (
      <div className={`p-6 border rounded-2xl shadow-sm relative ${bgClass} mb-6 transition-all`}>
        <div className="flex justify-between items-center mb-4 border-b border-brand-surface-border pb-4">
          <h4 className="text-lg font-bold text-foreground">Editar Bloque</h4>
          <button onClick={() => setIsEditing(false)} className="p-1 text-slate-500 dark:text-slate-400 hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          {sesion.tipo_sesion === 'teoria' && (
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Título del Tema</label>
              <input 
                type="text" 
                value={editForm.titulo_personalizado}
                onChange={e => setEditForm({...editForm, titulo_personalizado: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-brand-surface-border rounded-xl text-sm"
              />
            </div>
          )}

          {sesion.tipo_sesion !== 'teoria' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Título de Evaluación</label>
                <input 
                  type="text" 
                  value={editForm.tarea_titulo}
                  onChange={e => setEditForm({...editForm, tarea_titulo: e.target.value})}
                  className="w-full px-4 py-2 bg-background border border-brand-surface-border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Descripción</label>
                <textarea 
                  value={editForm.tarea_descripcion}
                  onChange={e => setEditForm({...editForm, tarea_descripcion: e.target.value})}
                  className="w-full px-4 py-2 bg-background border border-brand-surface-border rounded-xl text-sm min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Fecha Límite</label>
                <input 
                  type="datetime-local" 
                  value={editForm.tarea_fecha_limite}
                  onChange={e => setEditForm({...editForm, tarea_fecha_limite: e.target.value})}
                  className="w-full px-4 py-2 bg-background border border-brand-surface-border rounded-xl text-sm"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">URLs Adjuntas (Separadas por coma)</label>
            <input 
              type="text" 
              value={editForm.urls}
              onChange={e => setEditForm({...editForm, urls: e.target.value})}
              className="w-full px-4 py-2 bg-background border border-brand-surface-border rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-brand-primary-fg rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Save size={16} /> {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`p-6 border rounded-2xl shadow-sm relative ${bgClass} mb-6 transition-all`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded mb-2 inline-block ${isRed ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500 dark:text-slate-400'}`}>
              {isPractica ? 'Tarea' : sesion.tipo_sesion.replace('_', ' ')}
            </span>
            <h4 className={`text-xl font-bold ${titleClass}`}>{sesion.nombre_sesion}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Creado: {new Date(sesion.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit2 size={18} />
            </button>
            <button 
              onClick={() => setShowConfirm(true)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Eliminar Bloque"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Tarea details if applicable */}
        {sesion.tareas && sesion.tareas.length > 0 && (
          <div className="mb-4 p-4 bg-background dark:bg-black/20 rounded-xl border border-brand-surface-border">
            <h5 className="font-semibold text-foreground">{sesion.tareas[0].titulo}</h5>
            <p className="text-sm text-slate-500 mt-1">{sesion.tareas[0].descripcion}</p>
            <div className="mt-3 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg inline-block">
              Fecha límite: {new Date(sesion.tareas[0].fecha_limite).toLocaleString()}
            </div>
          </div>
        )}

        {/* URL list */}
        {sesion.urls && sesion.urls.length > 0 && (
          <div className="mb-4 space-y-2">
            <h5 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Enlaces Adjuntos</h5>
            {sesion.urls.map((url: string, i: number) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand-primary dark:text-brand-accent hover:underline">
                <LinkIcon size={14} /> {url}
              </a>
            ))}
          </div>
        )}

        {/* Files list */}
        {sesion.sesion_archivos && sesion.sesion_archivos.length > 0 && (
          <div className="mb-4 space-y-2">
            <h5 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Archivos</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sesion.sesion_archivos.map((file: any) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-background border border-brand-surface-border rounded-xl group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <File size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
                    <span className="text-sm text-foreground truncate">{file.nombre_archivo}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {isViewable(file.nombre_archivo) && (
                      <button onClick={async () => {
                        const { url } = await getPresignedDownloadUrl(file.url);
                        if (url) setViewerUrl(url);
                      }} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-accent hover:bg-brand-accent/10 rounded transition-colors" title="Ver">
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
                    }} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded transition-colors" title="Descargar">
                      <Download size={16} />
                    </button>
                    <button onClick={() => setFileToDelete({ id: file.id, key: file.url, name: file.nombre_archivo })} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Eliminar archivo">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dropzone for this session */}
        <div 
          className={`mt-4 border-2 border-dashed rounded-xl p-6 text-center transition-all ${isUploading ? 'bg-slate-50 dark:bg-slate-900 border-brand-accent/50' : 'border-slate-300 dark:border-slate-700 hover:border-brand-primary hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <UploadCloud size={24} className="mx-auto text-slate-500 dark:text-slate-400 mb-2" />
          <p className="text-sm text-slate-500 font-medium">
            {isUploading ? 'Subiendo archivos...' : 'Arrastra archivos aquí o'}
          </p>
          {!isUploading && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-brand-primary dark:text-brand-accent font-bold text-sm hover:underline"
            >
              Selecciona archivos
            </button>
          )}
          <input 
            type="file" 
            multiple 
            className="hidden" 
            ref={fileInputRef} 
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Delete Block Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-brand-surface w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-foreground mb-2">¿Eliminar bloque completo?</h3>
            <p className="text-slate-500 mb-6">Esta acción es irreversible. Se eliminarán los archivos y datos asociados a este bloque.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete File Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-brand-surface w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-foreground mb-2">¿Eliminar archivo?</h3>
            <p className="text-slate-500 mb-6">El archivo <strong className="text-foreground">{fileToDelete.name}</strong> será borrado permanentemente.</p>
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
                {isDeletingFile ? 'Borrando...' : 'Sí, eliminar archivo'}
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

