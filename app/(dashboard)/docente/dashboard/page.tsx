import React from 'react';
import { StatCard, Card } from '@/components/ui/card';
import { Timeline } from '@/components/ui/timeline';
import { Table, TableRow, TableCell } from '@/components/ui/table';
import { Users, BookOpen, Clock, CheckCircle, MoreVertical } from 'lucide-react';

const mockSessions = [
  { id: 1, title: 'Introducción al Álgebra', type: 'teoria' as const, date: 'Hoy, 21 Jun', time: '08:00 AM' },
  { id: 2, title: 'Práctica Dirigida 01', type: 'practica' as const, date: 'Mañana, 22 Jun', time: '10:00 AM' },
  { id: 3, title: 'Examen Parcial I', type: 'examen' as const, date: '25 Jun', time: '08:00 AM' },
  { id: 4, title: 'Presentación de Proyecto', type: 'entrega_final' as const, date: '30 Jun', time: '11:00 AM' },
];

const mockStudents = [
  { id: 1, name: 'Juan Pérez', code: '2024001', status: 'presente' },
  { id: 2, name: 'María Garcia', code: '2024002', status: 'tarde' },
  { id: 3, name: 'Carlos López', code: '2024003', status: 'ausente' },
  { id: 4, name: 'Ana Martínez', code: '2024004', status: 'presente' },
];

export default function TeacherDashboard() {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Panel de Docente</h2>
        <p className="text-slate-500 mt-1">Bienvenido de nuevo, Ismael. Tienes 2 sesiones programadas para hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Cursos Asignados" value={4} icon={BookOpen} trend="Semetre 2026-I" />
        <StatCard label="Total Estudiantes" value={128} icon={Users} trend="+5 este mes" />
        <StatCard label="Prom. Asistencia" value="92%" icon={CheckCircle} trend="Excelente" />
        <StatCard label="Sesiones Pendientes" value={12} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card title="Próximas Sesiones" description="Tu programación académica">
            <Timeline items={mockSessions} />
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card 
            title="Control de Asistencia" 
            description="Última sesión: Introducción al Álgebra (Sección A)"
            className="h-full"
          >
            <Table headers={['Estudiante', 'Código', 'Estado', 'Acción']}>
              {mockStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-semibold text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary dark:bg-brand-primary dark:text-brand-primary-fg text-xs font-bold">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      {student.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{student.code}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      student.status === 'presente' ? 'bg-green-100 text-green-700' :
                      student.status === 'tarde' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {student.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
                      <MoreVertical size={16} className="text-slate-400" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
            <div className="mt-6 flex justify-between items-center border-t border-slate-100 dark:border-brand-surface-border pt-6">
              <p className="text-sm text-slate-400">Mostrando {mockStudents.length} de 32 estudiantes</p>
              <button className="px-6 py-2.5 bg-brand-primary text-brand-primary-fg rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
                Ver Listado Completo
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
