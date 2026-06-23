'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Card, StatCard } from '@/components/ui/card';
import { BookOpen, Award, CheckCircle, Clock, BookMarked, PieChart } from 'lucide-react';
import Link from 'next/link';
import { getProfileAndCourses, getAsistencia, getTasksAndGrades } from './actions';
import { withCache } from '@/lib/clientCache';

export default function StudentDashboardClient() {
  // Estados Independientes
  const [profileData, setProfileData] = useState<any>(null);
  const [errorProfile, setErrorProfile] = useState<string | null>(null);
  
  const [asistenciaData, setAsistenciaData] = useState<any>(null);
  const [tasksData, setTasksData] = useState<any>(null);

  // Efecto en cascada paralela
  useEffect(() => {
    let mounted = true;
    
    // 1. Disparar el primer fetch rápido
    withCache('dashboard_profile', () => getProfileAndCourses()).then(res => {
      if (!mounted) return;
      if (res.error) {
        setErrorProfile(res.error);
        return;
      }
      setProfileData(res);
      
      const cursoIds = res.cursosIds || [];
      
      // 2. Disparar los fetches pesados
      withCache(`dashboard_asistencia_${cursoIds.join(',')}`, () => getAsistencia(cursoIds)).then(asistRes => {
        if (mounted) setAsistenciaData(asistRes);
      });

      withCache(`dashboard_tasks_${cursoIds.join(',')}`, () => getTasksAndGrades(cursoIds)).then(tasksRes => {
        if (mounted) setTasksData(tasksRes);
      });
      
    });

    return () => { mounted = false; };
  }, []);

  const isLoadingProfile = !profileData && !errorProfile;
  const isLoadingAsistencia = !asistenciaData;
  const isLoadingTasks = !tasksData;

  // Cálculos con useMemo
  const tareasPendientesSemana = useMemo(() => {
    if (!tasksData) return 0;
    const { tareas, entregas } = tasksData;
    const entregadasIds = new Set(entregas.map((e: any) => e.tarea_id));
    
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); 
    startOfWeek.setHours(0,0,0,0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); 
    endOfWeek.setHours(23,59,59,999);

    return tareas.filter((t: any) => {
      if (entregadasIds.has(t.id)) return false; 
      const deadline = new Date(t.fecha_limite);
      return deadline >= startOfWeek && deadline <= endOfWeek;
    }).length;
  }, [tasksData]);

  const statsTareas = useMemo(() => {
    if (!tasksData) return { total: 0, completadas: 0, porcentaje: 0 };
    const { tareas, entregas } = tasksData;
    const total = tareas.length;
    const entregadasIds = new Set(entregas.map((e: any) => e.tarea_id));
    const completadas = tareas.filter((t: any) => entregadasIds.has(t.id)).length;
    
    return {
      total,
      completadas,
      porcentaje: total === 0 ? 0 : Math.round((completadas / total) * 100)
    };
  }, [tasksData]);

  const promedioPonderado = useMemo(() => {
    if (!tasksData || !tasksData.notas || tasksData.notas.length === 0) return 0;
    const sum = tasksData.notas.reduce((acc: number, cur: any) => acc + Number(cur.nota || 0), 0);
    return (sum / tasksData.notas.length).toFixed(1);
  }, [tasksData]);

  const statsAsistencia = useMemo(() => {
    if (!asistenciaData) return { total: 0, general: 0, presente: 0, ausente: 0, tarde: 0, justificado: 0 };
    const { asistencias } = asistenciaData;
    const total = asistencias.length;
    if (total === 0) return { total: 0, general: 0, presente: 0, ausente: 0, tarde: 0, justificado: 0 };

    let presente = 0, ausente = 0, tarde = 0, justificado = 0;

    asistencias.forEach((a: any) => {
      const p = a.presente.toLowerCase();
      if (p === 'presente') presente++;
      else if (p === 'ausente') ausente++;
      else if (p === 'tarde') tarde++;
      else if (p === 'justificado') justificado++;
    });

    const general = Math.round(((presente + justificado) / total) * 100);

    return { total, general, presente, ausente, tarde, justificado };
  }, [asistenciaData]);

  if (errorProfile) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">Error al cargar perfil</h2>
        <p>{errorProfile}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      
      {/* Saludo y Alertas */}
      <div className="bg-brand-primary dark:bg-brand-surface rounded-3xl p-8 text-brand-primary-fg dark:text-foreground relative overflow-hidden shadow-lg border border-transparent dark:border-brand-surface-border">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BookMarked size={120} />
        </div>
        <div className="relative z-10">
          {isLoadingProfile ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-brand-primary-fg/20 dark:bg-slate-800 rounded w-1/3"></div>
              <div className="h-10 bg-brand-primary-fg/20 dark:bg-slate-800 rounded-xl w-2/3 border border-brand-accent/10"></div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-black mb-2 tracking-tight">
                Hola, {profileData.perfil?.nombres}
              </h2>
              {isLoadingTasks ? (
                 <div className="h-10 bg-brand-primary-fg/20 dark:bg-slate-800 rounded-xl w-2/3 border border-brand-accent/10 animate-pulse mt-2"></div>
              ) : tareasPendientesSemana > 0 ? (
                <p className="text-brand-accent text-lg font-medium bg-brand-primary-fg/10 dark:bg-brand-accent/10 inline-block px-4 py-2 rounded-xl border border-brand-accent/20 mt-2">
                  Tienes <strong className="font-black">{tareasPendientesSemana}</strong> tarea(s) programada(s) que aún no has presentado para esta semana.
                </p>
              ) : (
                <p className="text-brand-primary-fg/80 dark:text-slate-500 dark:text-slate-400 text-lg mt-2">
                  Estás al día con todas tus entregas para esta semana. ¡Buen trabajo!
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* 4 Cards de Analítica (Resuelven escalonadamente) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: Cursos (Carga rápido con el perfil) */}
        {isLoadingProfile ? (
          <div className="bg-brand-surface p-6 rounded-3xl border border-brand-surface-border shadow-sm animate-pulse flex items-center justify-between">
            <div className="space-y-3 w-full">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            </div>
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl ml-4 shrink-0"></div>
          </div>
        ) : (
          <StatCard
            label="Cursos Matriculados"
            value={profileData.cursos.length}
            icon={BookOpen}
            trend={profileData.periodo?.nombre}
          />
        )}

        {/* CARD 2: Promedio Ponderado (Depende de TasksData) */}
        {isLoadingTasks ? (
          <div className="bg-brand-surface p-6 rounded-3xl border border-brand-surface-border shadow-sm animate-pulse flex items-center justify-between">
            <div className="space-y-3 w-full">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            </div>
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl ml-4 shrink-0"></div>
          </div>
        ) : (
          <StatCard
            label="Promedio Ponderado"
            value={promedioPonderado}
            icon={Award}
            trend="Sobre 20 pts"
          />
        )}

        {/* CARD 3: Asistencia (Depende de AsistenciaData) */}
        {isLoadingAsistencia ? (
          <div className="bg-brand-surface p-6 rounded-3xl border border-brand-surface-border shadow-sm animate-pulse flex items-center justify-between">
            <div className="space-y-3 w-full">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            </div>
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl ml-4 shrink-0"></div>
          </div>
        ) : (
          <StatCard
            label="Asistencia General"
            value={`${statsAsistencia.general}%`}
            icon={Clock}
            trend={`${statsAsistencia.presente + statsAsistencia.justificado} de ${statsAsistencia.total} sesiones`}
          />
        )}

        {/* CARD 4: Tareas Completadas (Depende de TasksData) */}
        {isLoadingTasks ? (
          <div className="bg-brand-surface p-6 rounded-3xl border border-brand-surface-border shadow-sm animate-pulse flex items-center justify-between">
            <div className="space-y-3 w-full">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            </div>
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl ml-4 shrink-0"></div>
          </div>
        ) : (
          <StatCard
            label="Tareas Completadas"
            value={`${statsTareas.completadas} / ${statsTareas.total}`}
            icon={CheckCircle}
            trend={`${statsTareas.porcentaje}% Completado`}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Acceso Rápido a Cursos (Resuelve rápido con Profile) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BookMarked size={20} className="text-brand-accent" />
            Acceso Rápido a Cursos
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoadingProfile ? (
              <>
                {[1, 2].map((i) => (
                  <div key={i} className="bg-brand-surface p-6 rounded-2xl border border-brand-surface-border shadow-sm animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-3"></div>
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                  </div>
                ))}
              </>
            ) : profileData.cursos.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-brand-surface rounded-2xl border border-dashed border-brand-surface-border text-slate-500 dark:text-slate-400">
                No estás matriculado en ningún curso actualmente.
              </div>
            ) : (
              profileData.cursos.map((c: any) => (
                <Link key={c.id} href={`/estudiante/cursos?cursoId=${c.id}`}>
                  <div className="bg-brand-surface p-6 rounded-2xl border border-brand-surface-border shadow-sm hover:border-brand-primary hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider bg-brand-accent/10 px-2 py-1 rounded">
                          {c.nivel?.nombre || 'Nivel General'}
                        </span>
                        <h4 className="font-bold text-foreground text-lg mt-2 group-hover:text-brand-primary transition-colors">
                          {c.nombre}
                        </h4>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Asistencia Acumulada (Depende de AsistenciaData) */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <PieChart size={20} className="text-brand-accent" />
            Asistencia Acumulada
          </h3>
          
          <Card className="p-6">
            {isLoadingAsistencia ? (
              <div className="animate-pulse space-y-5">
                <div className="flex justify-between items-end">
                  <div className="space-y-2 w-1/3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                  <div className="space-y-2 w-1/4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                </div>
                <div className="pt-4 border-t border-brand-surface-border space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-8"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Sesiones</p>
                    <p className="text-3xl font-black text-foreground">{statsAsistencia.total}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Asistencia</p>
                    <p className="text-xl font-bold text-brand-primary dark:text-brand-accent">{statsAsistencia.general}%</p>
                  </div>
                </div>

                {statsAsistencia.total > 0 ? (
                  <div className="space-y-3 pt-4 border-t border-brand-surface-border">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Presente
                      </span>
                      <span className="font-bold">{statsAsistencia.presente}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Justificado
                      </span>
                      <span className="font-bold">{statsAsistencia.justificado}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div> Tarde
                      </span>
                      <span className="font-bold">{statsAsistencia.tarde}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Ausente
                      </span>
                      <span className="font-bold">{statsAsistencia.ausente}</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-brand-surface-border text-center text-sm text-slate-500 dark:text-slate-400">
                    Aún no tienes registros de asistencia.
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

    </div>
  );
}

