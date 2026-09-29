import React, { useEffect, useState } from 'react';
import { auditService, healthService } from '../services/api';

export default function AuditViewer() {
  const [events, setEvents] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [resourceFilter, setResourceFilter] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAuditData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [healthData, auditData] = await Promise.all([
        healthService.check().catch(() => ({ status: 'offline', database: 'disconnected' })),
        auditService.list(50, resourceFilter),
      ]);
      setHealth(healthData);
      setEvents(auditData.items || []);
    } catch (err: any) {
      if (err.statusCode === 403) {
        setErrorMessage(
          'Acceso restringido: Solo los usuarios con rol ADMINISTRADOR o SOPORTE EXTERNO tienen autorización para auditar los eventos del sistema.',
        );
      } else {
        setErrorMessage(err.message || 'No fue posible consultar los registros de auditoría.');
      }
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, [resourceFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Auditoría & Soporte Técnico</h1>
          <p className="text-sm text-slate-400 mt-1">
            Trazabilidad inmutable de eventos sensibles y supervisión técnica sanitaria sanitizada.
          </p>
        </div>
        <button
          onClick={loadAuditData}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar Registros
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl text-xs flex items-center justify-between border bg-amber-500/10 border-amber-500/30 text-amber-300">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Monitor de Salud de Servicios */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <span className="text-xs text-slate-400 block uppercase font-mono">Estado API NestJS</span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                health?.status === 'ok' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="font-bold text-white text-sm font-mono">
              {health?.status === 'ok' ? 'OPERATIVO (200 OK)' : 'STANDBY'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
            Uptime: {Math.round(health?.uptime || 0)}s
          </span>
        </div>

        <div>
          <span className="text-xs text-slate-400 block uppercase font-mono">Base de Datos PostgreSQL</span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                health?.database === 'healthy' ? 'bg-emerald-400' : 'bg-blue-400'
              }`}
            />
            <span className="font-bold text-white text-sm font-mono">
              {health?.database || 'CONECTADO'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
            Transacciones ACID y Migraciones
          </span>
        </div>

        <div>
          <span className="text-xs text-slate-400 block uppercase font-mono">Política de Privacidad</span>
          <div className="mt-1">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-semibold">
              SANITIZACIÓN ACTIVA
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
            Sin exposición de passwords ni fichas
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-400">Filtrar por Recurso:</label>
        <select
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Todos los recursos</option>
          <option value="AUTH">AUTH (Inicio de Sesión)</option>
          <option value="APPOINTMENT">APPOINTMENT (Citas)</option>
          <option value="CLINICAL_CARE">CLINICAL_CARE (Atenciones)</option>
          <option value="PATIENT">PATIENT (Pacientes)</option>
          <option value="PAYMENT">PAYMENT (Pagos)</option>
        </select>
      </div>

      {/* Tabla de Auditoría */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Acción</th>
                <th className="py-3 px-4">Recurso</th>
                <th className="py-3 px-4">Usuario Responsable</th>
                <th className="py-3 px-4">Dirección IP</th>
                <th className="py-3 px-4">Detalles Sanitizados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex items-center gap-2 text-teal-400">
                        <div className="w-4 h-4 rounded-full border-2 border-teal-500/20 border-t-teal-400 animate-spin"></div>
                        <span className="text-xs font-semibold text-white">Estamos trabajando para su comodidad y salud</span>
                      </div>
                      <span className="text-[11px] text-teal-300 font-mono">Consultando bitácora de trazabilidad sanitaria y accesos...</span>
                    </div>
                  </td>
                </tr>
              ) : events.length > 0 ? (
                events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-400">{new Date(ev.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-semibold border border-slate-700">
                        {ev.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{ev.resource}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {ev.user ? `${ev.user.firstName} ${ev.user.lastName} (${ev.user.email})` : 'Sistema'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{ev.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-400" title={ev.details}>
                      {ev.details || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    No se registran eventos de auditoría para el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
