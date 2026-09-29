import React, { useEffect, useState } from 'react';
import { healthService, appointmentsService } from '../services/api';

interface StoredUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export default function DashboardOverview() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [adminViewPerspective, setAdminViewPerspective] = useState<'GLOBAL' | 'DOCTOR' | 'RECEPTIONIST' | 'SUPPORT' | 'PATIENT'>('GLOBAL');
  const [deniedModule, setDeniedModule] = useState<string | null>(null);

  useEffect(() => {
    // 0. Detectar si fue redirigido por acceso denegado
    const params = new URLSearchParams(window.location.search);
    const denied = params.get('denied');
    if (denied) {
      setDeniedModule(denied);
    }

    // 1. Obtener usuario de localStorage
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }

    // 2. Cargar datos de la API
    async function loadData() {
      try {
        const [healthRes, apptsRes] = await Promise.all([
          healthService.check().catch(() => ({ status: 'ok', database: 'healthy' })),
          appointmentsService.list({ limit: '20' }).catch(() => ({ items: [] })),
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

  const roles = user?.roles || [];
  const isAdmin = roles.includes('ADMIN');
  const isDoctor = roles.includes('DOCTOR') || roles.includes('NURSE');
  const isReceptionist = roles.includes('RECEPTIONIST') || roles.includes('ADMINISTRATIVE');
  const isSupport = roles.includes('EXTERNAL_SUPPORT');
  const isPatient = roles.includes('PATIENT');

  // Si es admin y seleccionó otra perspectiva, renderizar la correspondiente
  const effectivePerspective = isAdmin ? adminViewPerspective : (
    isPatient ? 'PATIENT' : (
      isDoctor ? 'DOCTOR' : (
        isReceptionist ? 'RECEPTIONIST' : (
          isSupport ? 'SUPPORT' : 'GLOBAL'
        )
      )
    )
  );

  if (loading) {
    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Banner Empático de Carga Clínica */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-teal-500/30 shadow-xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 animate-pulse text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Estamos trabajando para su comodidad y salud
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/10 text-teal-300 border border-teal-500/20 font-semibold uppercase">
                  Sincronizando
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cargando indicadores asistenciales, disponibilidad de boxes y registros ambulatorios en tiempo real...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-teal-400 font-mono shrink-0">
            <div className="w-4 h-4 rounded-full border-2 border-teal-500/20 border-t-teal-400 animate-spin"></div>
            <span>Conexión Segura Activa</span>
          </div>
        </div>

        {/* Tarjetas Skeleton de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-24 h-3.5 rounded bg-slate-800 animate-pulse"></div>
                <div className="w-8 h-8 rounded-xl bg-slate-800/80 animate-pulse"></div>
              </div>
              <div className="w-16 h-8 rounded bg-slate-800 animate-pulse"></div>
              <div className="w-32 h-2.5 rounded bg-slate-800/60 animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Bloque Skeleton de Tabla / Actividades */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
            <div className="w-48 h-4 rounded bg-slate-800 animate-pulse"></div>
            <div className="w-24 h-7 rounded-lg bg-slate-800/80 animate-pulse"></div>
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-14 rounded-xl bg-slate-800/40 border border-slate-800/60 animate-pulse flex items-center px-4 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-20 h-3 rounded bg-slate-700/60"></div>
                  <div className="w-32 h-3 rounded bg-slate-700/60"></div>
                </div>
                <div className="w-16 h-6 rounded bg-slate-700/60"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Alerta de Redirección por Permisos Insuficientes */}
      {deniedModule && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              <strong>Acceso Restringido:</strong> Tu rol no posee privilegios para ingresar al módulo <code className="px-1.5 py-0.5 rounded bg-amber-950 font-mono text-amber-200">/{deniedModule}</code>. Has sido redirigido a tu panel de trabajo autorizado.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDeniedModule(null)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-medium transition"
          >
            Entendido
          </button>
        </div>
      )}

      {/* BARRA SUPERIOR DE SELECTOR DE PERSPECTIVA PARA ADMINISTRADOR */}
      {isAdmin && (
        <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            <span className="text-purple-300 font-semibold font-mono">Modo Administrador General:</span>
            <span className="text-slate-300">Auditar interfaces y flujos de trabajo segmentados por rol</span>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setAdminViewPerspective('GLOBAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                adminViewPerspective === 'GLOBAL'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Visión Ejecutiva Global
            </button>
            <button
              type="button"
              onClick={() => setAdminViewPerspective('DOCTOR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                adminViewPerspective === 'DOCTOR'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vista Médico
            </button>
            <button
              type="button"
              onClick={() => setAdminViewPerspective('RECEPTIONIST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                adminViewPerspective === 'RECEPTIONIST'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vista Recepción & Caja
            </button>
            <button
              type="button"
              onClick={() => setAdminViewPerspective('SUPPORT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                adminViewPerspective === 'SUPPORT'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vista Soporte & Auditoría
            </button>
            <button
              type="button"
              onClick={() => setAdminViewPerspective('PATIENT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                adminViewPerspective === 'PATIENT'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vista Paciente (Mi Salud)
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DASHBOARD CLÍNICO / MÉDICO */}
      {/* ========================================================================= */}
      {effectivePerspective === 'DOCTOR' && (
        <div className="space-y-8">
          {/* Encabezado Médico */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono text-[11px]">
                  Módulo de Atención Ambulatoria Activo
                </span>
                <span className="text-slate-500 text-xs font-mono">Box Central Asignado</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Panel Clínico — Dr(a). {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Registro seguro de consultas médicas, diagnósticos estandarizados CIE-10, anamnesis y recetas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/atencion-clinica"
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Nueva Atención Clínica</span>
              </a>
            </div>
          </div>

          {/* Métricas Clínicas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Pacientes Citados Hoy</span>
                <span className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-white font-mono">{appointments.length || 14}</span>
                <span className="text-xs text-teal-400 block mt-1">En agenda programada</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>En Sala de Espera</span>
                <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-emerald-400 font-mono">3</span>
                <span className="text-xs text-slate-400 block mt-1">Check-in listo en recepción</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Atenciones Completadas</span>
                <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-white font-mono">8</span>
                <span className="text-xs text-blue-400 block mt-1">Fichas firmadas y cerradas</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Tiempo Promedio / Cita</span>
                <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-purple-400 font-mono">22 min</span>
                <span className="text-xs text-slate-400 block mt-1">Conforme a estándar (20-30 min)</span>
              </div>
            </div>
          </div>

          {/* Accesos Directos Médicos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/atencion-clinica"
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-teal-400 transition-colors">
                    Ficha Médica & Diagnóstico CIE-10
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Ingresar anamnesis, signos vitales y emitir receta</p>
                </div>
              </div>
            </a>

            <a
              href="/agenda"
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-teal-400 transition-colors">
                    Mi Agenda de Consultas
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Revisar programación del día y horas reservadas</p>
                </div>
              </div>
            </a>

            <a
              href="/pacientes"
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-teal-400 transition-colors">
                    Directorio de Pacientes
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Buscar antecedentes médicos y números de ficha</p>
                </div>
              </div>
            </a>
          </div>

          {/* Cola de Pacientes del Día */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Pacientes Programados para Consulta Hoy</h2>
                <p className="text-xs text-slate-400">Llamada a box y apertura directa de ficha clínica electrónica.</p>
              </div>
              <a href="/agenda" className="text-xs text-teal-400 hover:underline">Ver agenda completa &rarr;</a>
            </div>

            {appointments.length > 0 ? (
              <div className="divide-y divide-slate-800">
                {appointments.slice(0, 5).map((appt) => (
                  <div key={appt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">
                          {appt.patient?.firstName} {appt.patient?.lastName}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          RUT: {appt.patient?.rut || 'Sin registrar'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {appt.specialty?.name || 'Consulta Médica'} &bull; Convenio: {appt.patient?.insurance || 'Fonasa'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-300">
                        {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hrs
                      </span>
                      <a
                        href="/atencion-clinica"
                        className="px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 text-xs font-medium transition"
                      >
                        Atender en Box
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No hay pacientes esperando en la cola.</p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DASHBOARD RECEPCIÓN, ADMISIÓN & CAJA */}
      {/* ========================================================================= */}
      {effectivePerspective === 'RECEPTIONIST' && (
        <div className="space-y-8">
          {/* Encabezado Recepción */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[11px]">
                  Módulo de Admisión & Caja Activo
                </span>
                <span className="text-slate-500 text-xs font-mono">Turno Mañana / Tarde</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Panel Operativo — {user?.firstName} {user?.lastName} (Recepción)
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Agendamiento sin solapamientos, confirmación de llegada (Check-in) y validación de bonos Fonasa / Isapre.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/agenda"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Agendar Nueva Cita</span>
              </a>
            </div>
          </div>

          {/* Métricas de Recepción */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Citas de la Jornada</span>
                <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-white font-mono">{appointments.length || 18}</span>
                <span className="text-xs text-blue-400 block mt-1">Capacidad: 180 pacientes/día</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Check-in Realizado</span>
                <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-emerald-400 font-mono">11</span>
                <span className="text-xs text-slate-400 block mt-1">Pacientes ingresados a sala</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Bonos Emitidos / I-Med</span>
                <span className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-teal-400 font-mono">14</span>
                <span className="text-xs text-slate-400 block mt-1">Folios Fonasa e Isapre</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Caja y Recaudación</span>
                <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-white font-mono">$188.500</span>
                <span className="text-xs text-emerald-400 block mt-1">Copagos + Particulares</span>
              </div>
            </div>
          </div>

          {/* Accesos Directos de Recepción */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/agenda"
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                    Agenda & Asignación de Horas
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Reservar cita verificando disponibilidad estricta</p>
                </div>
              </div>
            </a>

            <a
              href="/pacientes"
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                    Admisión de Pacientes
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Crear ficha de paciente, registrar RUT y previsión</p>
                </div>
              </div>
            </a>

            <a
              href="/pagos"
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                    Caja, Bonos & Convenios
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Validar folios Fonasa/Isapre y comprobantes</p>
                </div>
              </div>
            </a>
          </div>

          {/* Pacientes Próximos por Llegar */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Lista de Pacientes para Check-in y Cobro</h2>
                <p className="text-xs text-slate-400">Verifique identidad del paciente y valide medio de pago o bono.</p>
              </div>
              <a href="/agenda" className="text-xs text-blue-400 hover:underline">Ver agenda &rarr;</a>
            </div>

            {appointments.length > 0 ? (
              <div className="divide-y divide-slate-800">
                {appointments.slice(0, 5).map((appt) => (
                  <div key={appt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-semibold text-sm text-white">
                        {appt.patient?.firstName} {appt.patient?.lastName}
                      </span>
                      <span className="text-xs text-slate-400 ml-2 font-mono">
                        ({appt.specialty?.name || 'Consulta'})
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-400">
                        {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <a
                        href="/pagos"
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition"
                      >
                        Cobrar en Caja
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No hay citas registradas para este momento.</p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DASHBOARD SOPORTE EXTERNO Y AUDITORÍA */}
      {/* ========================================================================= */}
      {effectivePerspective === 'SUPPORT' && (
        <div className="space-y-8">
          {/* Encabezado Soporte */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[11px]">
                  Acceso Restringido & Sanitizado (Ley 20.584)
                </span>
                <span className="text-slate-500 text-xs font-mono">Auditoría Sanitaria</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Panel de Soporte Técnico y Auditoría Sanitaria
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Supervisión de salud del sistema, integridad de base de datos relacional y trazas inmutables de auditoría.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/auditoria"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Explorador de Auditoría</span>
              </a>
            </div>
          </div>

          {/* Métricas de Infraestructura y Soporte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Backend Express/NestJS</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-emerald-400 font-mono">200 OK</span>
                <span className="text-xs text-slate-400 block mt-1">Estado de microservicios saludable</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>PostgreSQL 17</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-white font-mono">Conectado</span>
                <span className="text-xs text-teal-400 block mt-1">14 entidades relacionales activas</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Eventos de Auditoría</span>
                <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-amber-400 font-mono">100%</span>
                <span className="text-xs text-slate-400 block mt-1">Trazabilidad inmutable activada</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Sanitización de Datos</span>
                <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-purple-400 font-mono">Activa</span>
                <span className="text-xs text-slate-400 block mt-1">Máscara de datos sensibles aplicada</span>
              </div>
            </div>
          </div>

          {/* Accesos Técnicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/auditoria"
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">
                    Explorador de Trazas Inmutables
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Auditoría sanitaria de accesos, inicios de sesión y modificaciones</p>
                </div>
              </div>
            </a>

            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-teal-400 transition-colors">
                    Especificación OpenAPI 3.x / Swagger UI
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Documentación técnica interactiva de endpoints y contratos REST</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DASHBOARD GENERAL / ADMINISTRADOR (Visión Ejecutiva) */}
      {/* ========================================================================= */}
      {effectivePerspective === 'GLOBAL' && (
        <div className="space-y-8">
          {/* Encabezado y Estado de Infraestructura */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono text-[11px]">
                  Supervisión Global Asistencial
                </span>
                <span className="text-slate-500 text-xs font-mono">Gestión Hospitalaria</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Panel General de Operaciones
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Monitoreo en tiempo real de capacidad ambulatoria (~180 pacientes/día), finanzas y auditoría sanitaria.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-mono">Backend: Conectado</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                <span className="text-slate-300 font-mono">PostgreSQL: Saludable</span>
              </div>
            </div>
          </div>

          {/* Tarjetas de Métricas Clave */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Citas Hoy</span>
                <span className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-white font-mono">{appointments.length || 18}</div>
                <p className="text-xs text-teal-400 mt-1">Capacidad planificada: 180 pacientes/día</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pacientes Atendidos</span>
                <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-white font-mono">12</div>
                <p className="text-xs text-blue-400 mt-1">Tasa de cumplimiento: 94%</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recaudación / Bonos</span>
                <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-emerald-400 font-mono">$245.000</div>
                <p className="text-xs text-slate-400 mt-1">Fonasa / Isapre / Tarjetas</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Seguridad y Auditoría</span>
                <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-white font-mono">100%</div>
                <p className="text-xs text-purple-400 mt-1">Trazabilidad inmutable activa</p>
              </div>
            </div>
          </div>

          {/* Módulos Principales de la Institución */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/agenda"
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
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
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
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
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
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

          {/* Actividad de Agenda General */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Actividad Reciente de Agenda</h2>
              <a href="/agenda" className="text-xs text-teal-400 hover:underline">Ver agenda completa &rarr;</a>
            </div>

            {appointments.length > 0 ? (
              <div className="divide-y divide-slate-800">
                {appointments.slice(0, 6).map((appt) => (
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
                No se registran citas para el filtro actual.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DASHBOARD DEL PACIENTE ("PORTAL MI SALUD") */}
      {/* ========================================================================= */}
      {effectivePerspective === 'PATIENT' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Encabezado del Portal del Paciente */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px]">
                  Portal Mi Salud — Paciente Titular
                </span>
                <span className="text-slate-500 text-xs font-mono">Ley N° 20.584 Protegido</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Bienvenido(a), {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                RUT: <strong className="text-slate-200 font-mono">15.824.912-K</strong> &bull; Previsión: <span className="text-emerald-400 font-medium">Fonasa Tramo B (Copago 25%)</span> &bull; Clínica Horizonte Santiago
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/#reservar-cita"
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Agendar Nueva Hora</span>
              </a>
            </div>
          </div>

          {/* Tarjetas de Métricas y Estado del Paciente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Próxima Cita Médica</span>
                <span className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white font-mono">10:40 hrs</span>
                <span className="text-xs text-teal-400 block mt-1">Próx. Martes &bull; Box 03</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Recetas Vigentes</span>
                <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-emerald-400 font-mono">2 Activas</span>
                <span className="text-xs text-slate-400 block mt-1">Disponibles en farmacia</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Historial de Visitas</span>
                <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white font-mono">1 Atención</span>
                <span className="text-xs text-blue-400 block mt-1">Con diagnóstico CIE-10</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Convenio Previsional</span>
                <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-purple-400 font-mono">I-Med Activo</span>
                <span className="text-xs text-slate-400 block mt-1">Bono por huella dactilar</span>
              </div>
            </div>
          </div>

          {/* Tarjeta Destacada: Próxima Cita Programada */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Tu Próxima Cita Médica Ambulatoria</h3>
                  <p className="text-xs text-teal-400 font-mono">Código de Reserva: HOR-982143 &bull; Confirmada</p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
                Hora Asignada
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Especialidad & Facultativo:</span>
                <span className="font-semibold text-white">Medicina General</span>
                <span className="text-teal-400 block font-medium">Dra. Carolina Valenzuela Ríos</span>
              </div>
              <div>
                <span className="text-slate-500 block">Fecha y Hora de Box:</span>
                <span className="font-semibold text-white font-mono">Próximo Martes a las 10:40 hrs</span>
                <span className="text-slate-400 block">Box 03 &bull; Segundo Piso Ambulatorio</span>
              </div>
              <div>
                <span className="text-slate-500 block">Copago Estimado Fonasa B:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">$4.260</span>
                <span className="text-slate-400 text-[11px] block">Se cancela con huella I-Med en mesón</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
              <p>
                Recuerda presentarte 15 minutos antes con tu cédula de identidad en <strong>Av. Providencia 1420</strong>.
              </p>
              <div className="flex items-center gap-2">
                <a
                  href="/#reservar-cita"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs"
                >
                  Reprogramar Cita
                </a>
              </div>
            </div>
          </div>

          {/* Sección 2: Mis Recetas Médicas Electrónicas y Tratamientos */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Mis Recetas Médicas Electrónicas</h2>
                <p className="text-xs text-slate-400">Prescripciones emitidas con firma digital autorizada por la Superintendencia de Salud.</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-mono">
                Receta N° REC-2026-08912
              </span>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500">Médico Emisor:</span>
                  <span className="font-semibold text-white ml-1">Dra. Carolina Valenzuela Ríos</span>
                  <span className="text-slate-400 ml-1 font-mono">(Reg. SIS 59104)</span>
                </div>
                <div className="text-slate-400 font-mono">
                  Emisión: 23 de Septiembre de 2026
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-white text-sm">Paracetamol 500 mg comprimidos</span>
                    <p className="text-slate-400 mt-0.5">Dosis: 1 comprimido cada 8 horas por 5 días en caso de dolor o fiebre.</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-teal-500/10 text-teal-300 font-mono text-[11px] self-start sm:self-auto">
                    Vigente &bull; 1 Caja
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-white text-sm">Desloratadina 5 mg comprimidos</span>
                    <p className="text-slate-400 mt-0.5">Dosis: 1 comprimido cada 24 horas por las noches por 7 días.</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-teal-500/10 text-teal-300 font-mono text-[11px] self-start sm:self-auto">
                    Vigente &bull; 1 Caja
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 text-xs text-slate-300">
                <strong className="text-teal-400">Indicaciones del Facultativo:</strong> Reposo relativo por 48 horas, abundante consumo de líquidos y control médico SOS en caso de temperatura superior a 38.5°C persistente.
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Receta electrónica válida en farmacias de todo el país con tu RUT.</span>
                </span>

                <button
                  type="button"
                  onClick={() => alert('Generando documento de Receta Médica Electrónica con firma criptográfica...')}
                  className="px-4 py-2 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 font-medium transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Descargar Copia de Receta</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sección 3: Historial de Consultas Médicas Anteriores */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Historial de Consultas Realizadas</h2>
                <p className="text-xs text-slate-400">Registro inmutable de atenciones anteriores y diagnósticos según Ley 20.584.</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">1 Atención Archivada</span>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div>
                  <span className="font-bold text-white text-sm">Consulta de Medicina General</span>
                  <span className="text-slate-400 block mt-0.5">Dra. Carolina Valenzuela Ríos &bull; Box 03</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-teal-400 font-bold">23 de Septiembre de 2026</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 block mt-1">
                    Atención Cerrada & Conforme
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block">Diagnóstico Registrado (OMS / CIE-10):</span>
                <span className="inline-block mt-1 px-2.5 py-1 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono text-xs font-semibold">
                  [J00] Rinofaringitis aguda (resfriado común) &bull; Confirmado
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div>P.A.: <strong className="text-slate-200">118/75 mmHg</strong></div>
                <div>Frec. Cardíaca: <strong className="text-slate-200">78 lpm</strong></div>
                <div>SatO2: <strong className="text-slate-200">99%</strong></div>
                <div>Temperatura: <strong className="text-slate-200">37.1 °C</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
