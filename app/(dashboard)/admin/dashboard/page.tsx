'use client';

import React, { useState } from 'react';
import { StatCard, Card } from '@/components/ui/card';
import { Table, TableRow, TableCell } from '@/components/ui/table';
import { CreditCard, Calendar, Users, Activity, Search, Filter, Download, Plus, Settings2, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockPayments = [
  { id: 1, student: 'Juan Pérez', period: '2026-I', amount: 450.00, status: 'confirmado', date: '18 Jun, 2026' },
  { id: 2, student: 'María Garcia', period: '2026-I', amount: 450.00, status: 'pendiente', date: '20 Jun, 2026' },
  { id: 3, student: 'Carlos López', period: '2026-I', amount: 450.00, status: 'rechazado', date: '15 Jun, 2026' },
  { id: 4, student: 'Ana Martínez', period: '2026-I', amount: 450.00, status: 'confirmado', date: '19 Jun, 2026' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'pagos' | 'periodos'>('pagos');

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Gestión Administrativa</h2>
          <p className="text-slate-500 mt-1">Panel de control de ingresos, periodos académicos y matrículas.</p>
        </div>
        
        <div className="inline-flex bg-brand-surface p-1 rounded-xl border border-brand-surface-border">
          <button 
            onClick={() => setActiveTab('pagos')}
            className={cn(
              "px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              activeTab === 'pagos' ? "bg-background text-foreground shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-foreground"
            )}
          >
            Pagos
          </button>
          <button 
            onClick={() => setActiveTab('periodos')}
            className={cn(
              "px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              activeTab === 'periodos' ? "bg-background text-foreground shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-foreground"
            )}
          >
            Periodos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Recaudación Mes" value="S/ 12,450" icon={CreditCard} trend="▲ +8% vs anterior" />
        <StatCard label="Matrículas Activas" value={452} icon={Users} trend="Periodo 2026-I" />
        <StatCard label="Pagos Pendientes" value={24} icon={Activity} trend="Requiere validación" />
        <StatCard label="Cursos Vigentes" value={18} icon={Calendar} />
      </div>

      {activeTab === 'pagos' ? (
        <Card className="animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div className="relative flex-1 max-w-lg">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nombre de estudiante, DNI o código..." 
                className="w-full pl-10 pr-4 py-2.5 bg-background text-foreground border border-brand-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 border border-brand-surface-border rounded-xl text-xs font-bold text-slate-500 hover:bg-background transition-colors">
                <Filter size={16} />
                Filtrar por Estado
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-brand-primary-fg rounded-xl text-xs font-bold hover:opacity-90 transition-opacity">
                <Download size={16} />
                Exportar CSV
              </button>
            </div>
          </div>

          <Table headers={['Estudiante', 'Concepto', 'Monto', 'Fecha de Pago', 'Estado', 'Acciones']}>
            {mockPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-bold text-foreground">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-background flex items-center justify-center">
                      <Users size={14} className="text-slate-500 dark:text-slate-400" />
                    </div>
                    {payment.student}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-500">Mensualidad {payment.period}</TableCell>
                <TableCell className="font-mono font-bold text-foreground">S/ {payment.amount.toFixed(2)}</TableCell>
                <TableCell className="text-xs text-slate-500 dark:text-slate-400">{payment.date}</TableCell>
                <TableCell>
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                    payment.status === 'confirmado' ? "bg-green-50 text-green-700 dark:bg-green-900/20" :
                    payment.status === 'pendiente' ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20" : "bg-red-50 text-red-700 dark:bg-red-900/20"
                  )}>
                    {payment.status === 'confirmado' ? <ShieldCheck size={10} /> : payment.status === 'pendiente' ? <Clock size={10} /> : <AlertCircle size={10} />}
                    {payment.status}
                  </div>
                </TableCell>
                <TableCell>
                  <button className="text-brand-gold font-bold hover:underline text-[10px] tracking-widest uppercase">Validar</button>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="lg:col-span-2 space-y-8">
            <Card title="Calendario Académico" description="Gestión de periodos vigentes y futuros">
              <div className="grid gap-4 mt-4">
                <div className="p-6 border-2 border-brand-accent bg-brand-accent/5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-lg">Periodo 2026-I</h4>
                      <p className="text-xs text-slate-500 font-medium">Ciclo Académico Regular • 18 Semanas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-4 py-1.5 bg-brand-accent text-brand-primary-fg text-[10px] font-black rounded-full uppercase tracking-widest">Activo</span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-bold uppercase tracking-tight">Fin: 15 de Julio, 2026</p>
                  </div>
                </div>
                
                <div className="p-6 border border-brand-surface-border rounded-2xl flex items-center justify-between group hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-4 opacity-50">
                    <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-lg">Periodo 2025-II</h4>
                      <p className="text-xs text-slate-500 font-medium">Ciclo Académico Finalizado</p>
                    </div>
                  </div>
                  <span className="px-4 py-1.5 bg-background text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-full uppercase tracking-widest">Histórico</span>
                </div>

                <button className="group w-full py-8 border-2 border-dashed border-brand-surface-border rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400 hover:border-brand-accent hover:text-brand-accent transition-all">
                  <div className="p-3 bg-background rounded-full group-hover:bg-brand-accent/10 transition-colors">
                    <Plus size={24} />
                  </div>
                  <span className="font-bold text-sm tracking-tight">Configurar Nuevo Ciclo Académico</span>
                </button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card title="Ajustes de Tarifas" description="Valores base por servicio" className="h-full">
              <div className="space-y-10 pt-6">
                <div className="space-y-6">
                  <div className="relative">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] block mb-3">Tasa de Matrícula</label>
                    <div className="flex items-center gap-0 group">
                      <div className="h-12 w-12 flex items-center justify-center bg-background border border-r-0 border-brand-surface-border rounded-l-xl text-slate-500 dark:text-slate-400 font-bold">S/</div>
                      <input type="number" defaultValue={250} className="w-full h-12 bg-transparent border border-brand-surface-border rounded-r-xl px-4 font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-accent/20" />
                    </div>
                  </div>
                  
                  <div className="relative">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] block mb-3">Mensualidad General</label>
                    <div className="flex items-center gap-0 group">
                      <div className="h-12 w-12 flex items-center justify-center bg-background border border-r-0 border-brand-surface-border rounded-l-xl text-slate-500 dark:text-slate-400 font-bold">S/</div>
                      <input type="number" defaultValue={450} className="w-full h-12 bg-transparent border border-brand-surface-border rounded-r-xl px-4 font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-accent/20" />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-xl flex gap-3">
                  <AlertCircle size={18} className="text-amber-600 shrink-0" />
                  <p className="text-[10px] text-amber-700 dark:text-amber-500 leading-relaxed font-medium">
                    Los cambios en las tarifas afectarán a todos los estudiantes que aún no han generado su recibo de pago para el mes actual.
                  </p>
                </div>

                <button className="w-full py-4 bg-brand-primary text-brand-primary-fg rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:shadow-lg hover:shadow-brand-accent/20 transition-all flex items-center justify-center gap-2">
                  <Settings2 size={16} />
                  Actualizar Tarifario
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

