import React from 'react';

export const RegistroPDFTemplate = ({ registryData }: { registryData: any }) => {
  if (!registryData) return null;

  const { curso, estudiantes, sesiones, asistencias, tareas, notas } = registryData;

  // Placeholder Static Data as requested
  const staticData = {
    director: "TOBIAS SOLIS CALVO",
    lugar: "TRUJILLO",
    distrito: "TRUJILLO",
    cel: "993098683",
    creditos: "3",
    docente: "MARGARITA DURAND PAIMA", // Using static to perfectly match image if DB lacks it, though we could pull it from context. We'll use static for now.
    fecha: "22-06-26 al 26-06-26"
  };

  // Helper to format date "DD.MM.YY"
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString().slice(-2);
    return `${day}.${month}.${year}`;
  };

  // Safe get assistance: 'presente', 'tarde', 'falta'
  const getAsistenciaMark = (estudianteId: string, sesionId: number) => {
    const a = asistencias.find((a: any) => a.estudiante_id === estudianteId && a.sesion_id === sesionId);
    if (!a) return '';
    return a.presente === 'presente' ? '•' : a.presente === 'falta' ? 'F' : 'T';
  };

  // Safe get nota
  const getNota = (estudianteId: string, tareaId: number) => {
    const n = notas.find((n: any) => n.estudiante_id === estudianteId && n.tarea_id === tareaId);
    return n ? n.nota : '';
  };

  // Calcular Nota Final Promediada (Simplificado)
  const getNotaFinal = (estudianteId: string) => {
    const notasAlumno = tareas.map((t: any) => getNota(estudianteId, t.id)).filter((n: any) => n !== '');
    if (notasAlumno.length === 0) return '';
    const sum = notasAlumno.reduce((acc: number, curr: number) => acc + Number(curr), 0);
    return (sum / notasAlumno.length).toFixed(1);
  };

  return (
    <div className="relative w-[210mm] min-h-[297mm] mx-auto text-white overflow-hidden p-8 shadow-2xl rounded-sm" style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#3b4351' }}>
      {/* Background Image fixed to absolute back */}
      <img 
        src="/img/membrete.png" 
        alt="Membrete" 
        className="absolute top-0 left-0 w-[210mm] h-full object-cover z-0"
        style={{ pointerEvents: 'none' }}
      />
      
      <div className="relative z-10 w-full h-full">
        
        {/* Header Table */}
        <table className="w-full border-collapse border border-white mb-6 text-[11px]">
          <tbody>
            <tr>
              <td className="border border-white p-1 font-bold w-[15%]">DIRECTOR:</td>
              <td className="border border-white p-1 w-[40%]">{staticData.director}</td>
              <td className="border border-white p-1 font-bold w-[15%]">DISTRITO:</td>
              <td className="border border-white p-1">{staticData.distrito}</td>
            </tr>
            <tr>
              <td className="border border-white p-1 font-bold">MATERIA:</td>
              <td className="border border-white p-1 uppercase">{curso.nombre || 'MINISTERIOS'}</td>
              <td className="border border-white p-1 font-bold">FECHA:</td>
              <td className="border border-white p-1">{staticData.fecha}</td>
            </tr>
            <tr>
              <td className="border border-white p-1 font-bold">DOCENTE:</td>
              <td className="border border-white p-1 uppercase">{staticData.docente}</td>
              <td className="border border-white p-1 font-bold">CEL:</td>
              <td className="border border-white p-1">{staticData.cel}</td>
            </tr>
            <tr>
              <td className="border border-white p-1 font-bold">NIVEL:</td>
              <td className="border border-white p-1 uppercase">{curso.nivel || 'BACHILLER'}</td>
              <td className="border border-white p-1 font-bold">CRÉDITOS:</td>
              <td className="border border-white p-1">{staticData.creditos}</td>
            </tr>
            <tr>
              <td className="border border-white p-1 font-bold">LUGAR:</td>
              <td className="border border-white p-1" colSpan={3}>{staticData.lugar}</td>
            </tr>
          </tbody>
        </table>

        {/* Title */}
        <h2 className="text-center font-bold text-xl italic mb-6 tracking-widest text-white drop-shadow-md">
          Registro de Asistencia y Notas
        </h2>

        {/* Main Table */}
        <table className="w-full border-collapse border border-white text-[10px] text-center">
          <thead>
            <tr>
              <th className="border border-white w-6 p-1" rowSpan={2}>N°</th>
              <th className="border border-white p-1 text-left" rowSpan={2}>APELLIDOS Y NOMBRES</th>
              {sesiones.length > 0 && (
                <th className="border border-white p-1" colSpan={sesiones.length}>ASISTENCIA</th>
              )}
              <th className="border border-white p-1" colSpan={tareas.length + 1}>CRITERIOS CALIFICABLES</th>
            </tr>
            <tr>
              {/* Asistencia Headers Rotated */}
              {sesiones.map((s: any, idx: number) => (
                <th key={s.id} className="border border-white p-1 h-28 align-bottom">
                  <div className="rotate-180" style={{ writingMode: 'vertical-rl' }}>
                    {formatDate(s.created_at)}
                  </div>
                </th>
              ))}
              
              {/* Tareas Headers Rotated */}
              {tareas.map((t: any, idx: number) => (
                <th key={t.id} className="border border-white p-1 h-28 align-bottom font-normal">
                  <div className="rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
                    {t.titulo.substring(0, 20)}
                  </div>
                </th>
              ))}
              <th className="border border-white p-1 h-28 align-bottom">
                <div className="rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
                  Nota Final
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {estudiantes.map((est: any, idx: number) => (
              <tr key={est.id}>
                <td className="border border-white p-1">{idx + 1}</td>
                <td className="border border-white p-1 text-left whitespace-nowrap overflow-hidden text-ellipsis uppercase">
                  {est.apellidos} {est.nombres}
                </td>
                
                {/* Asistencias */}
                {sesiones.map((s: any) => (
                  <td key={s.id} className="border border-white p-1 font-bold">
                    {getAsistenciaMark(est.id, s.id)}
                  </td>
                ))}

                {/* Notas */}
                {tareas.map((t: any) => (
                  <td key={t.id} className="border border-white p-1">
                    {getNota(est.id, t.id)}
                  </td>
                ))}
                
                {/* Nota Final */}
                <td className="border border-white p-1 font-bold">
                  {getNotaFinal(est.id)}
                </td>
              </tr>
            ))}
            {/* Si no hay estudiantes para que no se vea vacío */}
            {estudiantes.length === 0 && (
              <tr>
                <td className="border border-white p-4 text-center" colSpan={2 + sesiones.length + tareas.length + 1}>
                  No hay estudiantes matriculados en este curso.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer Signatures */}
        <div className="mt-24 w-full text-center text-xs">
          <div className="flex justify-end mb-8">
            <p>Trujillo, {new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex justify-between px-16">
            <div className="flex flex-col items-center">
              <div className="w-48 border-b border-white mb-2"></div>
              <p className="font-bold">{staticData.director}</p>
              <p>DIRECTOR</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-48 border-b border-white mb-2"></div>
              <p className="font-bold uppercase">{staticData.docente}</p>
              <p>DOCENTE</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
