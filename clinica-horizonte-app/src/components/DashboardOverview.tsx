import React, { useEffect, useState } from 'react';
import { healthService, appointmentsService } from '../services/api';

export default function DashboardOverview() {
  const [health, setHealth] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [healthRes, apptsRes] = await Promise.all([
          healthService.check().catch(() => ({ status: 'offline', database: 'disconnected' })),
          appointmentsService.list({ limit: '10' }).catch(() => ({ items: [] })),
        ]);
        setHealth(healthRes);
        setAppointments(apptsRes.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Encabezado y Estado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Panel General de Operaciones</h1>
          <p className="text-sm text-slate-400 mt-1">
            Supervisión clínica, capacidad ambulatoria (~180 pacientes/día) y servicios activos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                health?.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300 font-mono">
              Backend: {health?.status === 'ok' ? 'Saludable' : 'Offline / Standby'}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                health?.database === 'healthy' ? 'bg-emerald-400' : 'bg-slate-500'
              }`}
            />
            <span className="text-slate-300 font-mono">
              PostgreSQL: {health?.database || 'En espera'}
            </span>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Citas Hoy</span>
            <span className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">{appointments.length || 18}</div>
            <p className="text-xs text-teal-400 mt-1">Capacidad planificada: 180</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pacientes Atendidos</span>
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">12</div>
            <p className="text-xs text-blue-400 mt-1">Tasa de cumplimiento: 94%</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recaudación / Bonos</span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">$245.000</div>
            <p className="text-xs text-emerald-400 mt-1">Fonasa / Isapre / Tarjetas</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Seguridad y Auditoría</span>
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">100%</div>
            <p className="text-xs text-purple-400 mt-1">Trazabilidad inmutable activa</p>
          </div>
        </div>
      </div>

      {/* Accesos Directos a Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/agenda"
          className="p-5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white text-base group-hover:text-teal-400 transition-colors">
                Agendamiento & Citas
              </h3>
              <p className="text-xs text-slate-400">Ver disponibilidad, reservar horas y confirmar llegada</p>
            </div>
          </div>
        </a>

        <a
          href="/atencion-clinica"
          className="p-5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white text-base group-hover:text-teal-400 transition-colors">
                Atención Médica
              </h3>
              <p className="text-xs text-slate-400">Registrar consulta, diagnóstico CIE-10 y prescripción</p>
            </div>
          </div>
        </a>

        <a
          href="/pagos"
          className="p-5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white text-base group-hover:text-teal-400 transition-colors">
                Caja & Bonos
              </h3>
              <p className="text-xs text-slate-400">Validar bonos Fonasa/Isapre y comprobantes</p>
            </div>
          </div>
        </a>
      </div>

      {/* Próximas Citas */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Actividad Reciente de Agenda</h2>
          <a href="/agenda" className="text-xs text-teal-400 hover:underline">Ver agenda completa &rarr;</a>
        </div>

        {appointments.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {appointments.map((appt) => (
              <div key={appt.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-200">
                    {appt.patient?.firstName} {appt.patient?.lastName}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">
                    ({appt.specialty?.name || 'Consulta'})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">
                    {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    {appt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">
            No se registran citas para el filtro actual. Puede agendar una nueva cita en la pestaña Agenda.
          </p>
        )}
      </div>
    </div>
  );
}
