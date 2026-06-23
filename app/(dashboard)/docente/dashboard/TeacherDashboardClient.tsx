'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { StatCard, Card } from '@/components/ui/card';
import { Table, TableRow, TableCell } from '@/components/ui/table';
import { Users, BookOpen, Clock, CheckCircle, Search, Filter, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTeacherProfileAndCourses, getTeacherStudentsAndAttendance, saveAttendance } from './actions';
import { withCache } from '@/lib/clientCache';

export default function TeacherDashboardClient() {
  const [profileData, setProfileData] = useState<any>(null);
  const [errorProfile, setErrorProfile] = useState<string | null>(null);
  
  const [attendanceData, setAttendanceData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    
    withCache('docente_profile', () => getTeacherProfileAndCourses()).then(res => {
      if (!mounted) return;
      if (res.error) {
        setErrorProfile(res.error);
        return;
      }
      setProfileData(res);
      
      const cursoIds = res.cursoIds || [];
      const sesionIds = res.sesionIds || [];
      
      withCache(`docente_attendance_${cursoIds.join(',')}`, () => getTeacherStudentsAndAttendance(cursoIds, sesionIds)).then(attRes => {
        if (mounted) setAttendanceData(attRes);
      });
    });

    return () => { mounted = false; };
  }, []);

  const isLoadingProfile = !profileData && !errorProfile;
  const isLoadingAttendance = !attendanceData;

  const { periodo, stats, cursos, sesionesData } = profileData || { stats: {}, cursos: [], sesionesData: [] };
  const { totalEstudiantes, estudiantesData, asistenciasData } = attendanceData || { totalEstudiantes: 0, estudiantesData: [], asistenciasData: [] };

  const userName = "Docente"; // Simplified or we can fetch true name

  // Promedio Asistencia Calculation (Memoized as requested)
  const promAsistencia = useMemo(() => {
    if (totalEstudiantes === 0 || sesionesData.length === 0 || !asistenciasData) return 0;
    
    const asistenciaPorSesion: Record<number, number> = {};
    asistenciasData.forEach((a: any) => {
      if (a.presente === 'presente' || a.presente === 'tarde') {
        asistenciaPorSesion[a.sesion_id] = (asistenciaPorSesion[a.sesion_id] || 0) + 1;
      }
    });

    const totalAsistencias = Object.values(asistenciaPorSesion).reduce((acc, curr) => acc + curr, 0);
    const promedioAsistentesPorSesion = totalAsistencias / sesionesData.length;
    
    const porcentaje = (promedioAsistentesPorSesion / totalEstudiantes) * 100;
    return Math.ceil(porcentaje);
  }, [totalEstudiantes, sesionesData, asistenciasData]);

  // Selección de curso para control de asistencia
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
  
  useEffect(() => {
    if (cursos && cursos.length > 0 && selectedCourseId === '') {
      setSelectedCourseId(cursos[0].id);
    }
  }, [cursos, selectedCourseId]);

  // Estudiantes del curso seleccionado
  const estudiantesDelCurso = useMemo(() => {
    if (!selectedCourseId || !estudiantesData) return [];
    return estudiantesData
      .filter((e: any) => e.curso_id === Number(selectedCourseId))
      .map((e: any) => e.usuarios);
  }, [selectedCourseId, estudiantesData]);

  // Estado local para la asistencia actual
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({});
  
  const handleStateChange = (estudianteId: string, value: string) => {
    setAttendanceState(prev => ({ ...prev, [estudianteId]: value }));
  };

  // Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('todos');

  const filteredStudents = useMemo(() => {
    return estudiantesDelCurso.filter((student: any) => {
      const matchName = `${student.nombres} ${student.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase());
      const currentState = attendanceState[student.id] || 'presente';
      const matchState = filterState === 'todos' || currentState === filterState;
      return matchName && matchState;
    });
  }, [estudiantesDelCurso, searchTerm, filterState, attendanceState]);

  // Paginación
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const paginatedStudents = showAll 
    ? filteredStudents 
    : filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  // Guardar asistencia
  const [isSaving, setIsSaving] = useState(false);
  const handleSaveAttendance = async () => {
    if (!selectedCourseId) return;
    const session = sesionesData.find((s: any) => s.curso_id === Number(selectedCourseId));
    if (!session) {
      alert("No hay sesión programada para este curso donde guardar la asistencia.");
      return;
    }

    setIsSaving(true);
    const payload = estudiantesDelCurso.map((est: any) => ({
      estudiante_id: est.id,
      presente: attendanceState[est.id] || 'presente'
    }));

    const result = await saveAttendance(session.id, payload);
    setIsSaving(false);
    if (result.success) {
      alert("Asistencia guardada correctamente");
    } else {
      alert("Error al guardar asistencia");
    }
  };

  const todayStr = new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (errorProfile) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">Error al cargar datos</h2>
        <p>{errorProfile}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <p className="text-slate-500 mt-1">Bienvenido de nuevo, {userName}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoadingProfile ? (
          <div className="bg-brand-surface p-6 rounded-3xl border border-brand-surface-border shadow-sm animate-pulse flex items-center justify-between">
            <div className="space-y-3 w-full">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            </div>
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl ml-4 shrink-0"></div>
          </div>
        ) : (
          <StatCard label="Cursos Asignados" value={stats.cursosAsignados} icon={BookOpen} trend={periodo} />
        )}
        
        {isLoadingAttendance ? (
          <div className="bg-brand-surface p-6 rounded-3xl border border-brand-surface-border shadow-sm animate-pulse flex items-center justify-between">
            <div className="space-y-3 w-full">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            </div>
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl ml-4 shrink-0"></div>
          </div>
        ) : (
          <StatCard label="Total Estudiantes" value={totalEstudiantes} icon={Users} />
        )}

        {isLoadingAttendance ? (
          <div className="bg-brand-surface p-6 rounded-3xl border border-brand-surface-border shadow-sm animate-pulse flex items-center justify-between">
            <div className="space-y-3 w-full">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            </div>
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl ml-4 shrink-0"></div>
          </div>
        ) : (
          <StatCard label="Prom. Asistencia" value={`${promAsistencia}%`} icon={CheckCircle} />
        )}

        {isLoadingProfile ? (
          <div className="bg-brand-surface p-6 rounded-3xl border border-brand-surface-border shadow-sm animate-pulse flex items-center justify-between">
            <div className="space-y-3 w-full">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            </div>
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl ml-4 shrink-0"></div>
          </div>
        ) : (
          <StatCard label="Sesiones Programadas" value={stats.sesionesPendientes} icon={Clock} />
        )}
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-foreground">Control de asistencia - {todayStr}</h3>
          </div>
          
          <div className="w-full">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Seleccionar Curso</label>
            {isLoadingProfile ? (
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

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Filtros</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                 <input 
                   type="text" 
                   placeholder="Buscar estudiante..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-12 pr-4 py-3 bg-background text-foreground border border-brand-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition-all"
                   disabled={isLoadingAttendance}
                 />
              </div>
              
              <div className="sm:w-64 relative">
                 <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                 <select 
                   value={filterState}
                   onChange={(e) => setFilterState(e.target.value)}
                   className="w-full pl-12 pr-4 py-3 bg-background text-foreground border border-brand-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition-all appearance-none cursor-pointer"
                   disabled={isLoadingAttendance}
                 >
                   <option value="todos">Todos los estados</option>
                   <option value="presente">Presente</option>
                   <option value="ausente">Ausente</option>
                   <option value="tarde">Tarde</option>
                   <option value="justificado">Justificado</option>
                 </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoadingAttendance ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <Table headers={['Estudiante', 'Estado', 'Acciones']}>
              {paginatedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                    No se encontraron estudiantes
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStudents.map((student: any) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-semibold text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary dark:bg-brand-primary dark:text-brand-primary-fg text-xs font-bold uppercase shrink-0">
                          {student.nombres.charAt(0)}{student.apellidos.charAt(0)}
                        </div>
                        <span className="truncate max-w-50 md:max-w-md">{student.nombres} {student.apellidos}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <select
                        value={attendanceState[student.id] || 'presente'}
                        onChange={(e) => handleStateChange(student.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider outline-none border ${
                          (attendanceState[student.id] || 'presente') === 'presente' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-900' :
                          (attendanceState[student.id] || 'presente') === 'tarde' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900' :
                          (attendanceState[student.id] || 'presente') === 'ausente' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-900' :
                          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900'
                        }`}
                      >
                        <option value="presente">Presente</option>
                        <option value="tarde">Tarde</option>
                        <option value="ausente">Ausente</option>
                        <option value="justificado">Justificado</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      {/* Placeholder for future specific actions per student */}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </Table>
          )}
        </div>

        {!isLoadingAttendance && (
          <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-brand-surface-border pt-6">
            <div className="text-sm text-slate-500 dark:text-slate-400 w-full md:w-auto text-center md:text-left">
              Mostrando {paginatedStudents.length} de {filteredStudents.length} estudiantes
            </div>
            
            {!showAll && totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-background text-slate-500 dark:text-slate-400 disabled:opacity-50"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-medium text-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-background text-slate-500 dark:text-slate-400 disabled:opacity-50"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 w-full md:w-auto">
              {!showAll && filteredStudents.length > itemsPerPage && (
                <button 
                  onClick={() => setShowAll(true)}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-background border border-brand-surface-border text-foreground rounded-lg font-bold text-sm hover:border-brand-accent transition-colors"
                >
                  Ver Listado Completo
                </button>
              )}
              {showAll && (
                <button 
                  onClick={() => { setShowAll(false); setCurrentPage(1); }}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-background border border-brand-surface-border text-foreground rounded-lg font-bold text-sm hover:border-brand-accent transition-colors"
                >
                  Ver Paginado
                </button>
              )}
              <button 
                onClick={handleSaveAttendance}
                disabled={isSaving}
                className="flex-1 md:flex-none px-6 py-2.5 bg-brand-primary text-brand-primary-fg rounded-lg font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={16} />
                {isSaving ? "Guardando..." : "Guardar Asistencia"}
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

