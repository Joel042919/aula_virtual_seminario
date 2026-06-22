import React from 'react';
import { StatCard, Card } from '@/components/ui/card';
import { BookOpen, GraduationCap, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { Table, TableRow, TableCell } from '@/components/ui/table';

const mockCourses = [
  { id: 1, name: 'Introducción al Álgebra', progress: '65%', nextSession: 'Mañana, 08:00 AM', color: 'bg-blue-600' },
  { id: 2, name: 'Física I', progress: '40%', nextSession: 'Miércoles, 10:00 AM', color: 'bg-indigo-600' },
  { id: 3, name: 'Comprensión Lectora', progress: '85%', nextSession: 'Jueves, 02:00 PM', color: 'bg-emerald-600' },
];

const mockGrades = [
  { id: 1, title: 'Práctica Calificada 01', course: 'Álgebra', score: 18, comment: 'Buen desarrollo de los problemas.' },
  { id: 2, title: 'Laboratorio de Cinemática', course: 'Física I', score: 15, comment: 'Faltó mayor detalle en las conclusiones.' },
  { id: 3, title: 'Ensayo Literario', course: 'Lectura', score: 19, comment: 'Excelente análisis crítico.' },
];

export default function StudentDashboard() {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Mi Aula Virtual</h2>
          <p className="text-slate-500 mt-1">Hola Ismael, tienes 3 tareas pendientes para esta semana.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-brand-primary-fg rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
          <BookOpen size={16} />
          Ver todos mis cursos
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Cursos Matriculados" value={3} icon={BookOpen} trend="Ciclo 2026-I" />
        <StatCard label="Promedio Ponderado" value="17.4" icon={GraduationCap} trend="▲ +1.2 vs anterior" />
        <StatCard label="Asistencia General" value="95%" icon={Clock} trend="Muy Bueno" />
        <StatCard label="Tareas Completadas" value="12/15" icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockCourses.map((course) => (
              <Card key={course.id} className="relative group overflow-hidden hover:border-brand-accent/40 transition-all border border-brand-surface-border">
                <div className={`absolute top-0 left-0 w-1 h-full ${course.color}`} />
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-lg text-foreground group-hover:text-brand-accent transition-colors">{course.name}</h4>
                    <button className="p-1 rounded bg-background text-slate-400 group-hover:text-brand-accent">
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      <span>Progreso del Curso</span>
                      <span>{course.progress}</span>
                    </div>
                    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                      <div className={`h-full ${course.color}`} style={{ width: course.progress }} />
                    </div>
                  </div>
                  <div className="pt-3 flex items-center gap-2">
                    <Clock size={12} className="text-slate-400" />
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">Próxima: {course.nextSession}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card title="Calificaciones Recientes" description="Tus últimos resultados evaluativos">
            <Table headers={['Evaluación', 'Curso', 'Nota', 'Acción']}>
              {mockGrades.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell className="font-bold text-foreground">{grade.title}</TableCell>
                  <TableCell className="text-slate-400 text-xs">{grade.course}</TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg ${
                      grade.score >= 15 ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'
                    }`}>
                      {grade.score}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button className="text-brand-accent font-bold hover:underline text-xs tracking-tight">VER FEEDBACK</button>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card title="Asistencia Acumulada" description="Rendimiento proporcional" className="h-full">
            <div className="space-y-8 pt-6">
              <div className="flex items-center gap-5">
                <div className="w-2.5 h-16 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
                <div>
                  <p className="text-sm font-bold text-foreground">Puntual</p>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-medium">24 SESIONES (85%)</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-2.5 h-10 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
                <div>
                  <p className="text-sm font-bold text-foreground">Tardanza</p>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-medium">3 SESIONES (10%)</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-2.5 h-6 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
                <div>
                  <p className="text-sm font-bold text-foreground">Inasistencia</p>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-medium">1 SESIÓN (5%)</p>
                </div>
              </div>

              <div className="pt-10 mt-6 border-t border-brand-surface-border">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-foreground uppercase">Estado de Permanencia</span>
                  <span className="text-xs font-bold text-green-600">HABILITADO</span>
                </div>
                <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '95%' }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-4 text-center leading-relaxed">
                  Recuerda que con más de 3 inasistencias injustificadas pierdes derecho a examen final.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
