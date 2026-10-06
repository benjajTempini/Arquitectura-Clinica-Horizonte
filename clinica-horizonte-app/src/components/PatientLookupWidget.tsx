import React, { useState } from 'react';

export default function PatientLookupWidget() {
  const [lookupRut, setLookupRut] = useState('');
  const [lookupResults, setLookupResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupRut.trim()) return;

    setIsSearching(true);
    setLookupResults(null);
    setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem('patient_bookings') || '[]');
        const cleanSearch = lookupRut.replace(/[^0-9kK]/g, '').toLowerCase();
        const found = stored.filter((b: any) =>
          b.patientRut.replace(/[^0-9kK]/g, '').toLowerCase() === cleanSearch
        );

        if (found.length > 0) {
          setLookupResults(found);
        } else {
          setLookupResults([]);
        }
      } catch {
        setLookupResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 550);
  };

  return (
    <div className="w-full bg-white border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <span className="text-xs font-mono font-semibold text-blue-600 uppercase tracking-wider block">
            Seguimiento de Citas
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Consulta de Cita Médica Agendada
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verifica tu facultativo asignado, box de atención, horario y recomendaciones previas.
          </p>
        </div>
      </div>

      <div className="pt-6 space-y-6">
        {/* Formulario de Búsqueda por RUT */}
        <form onSubmit={handleLookupSubmit} className="max-w-xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              placeholder="Ingresa tu RUT (ej: 15.824.912-K)"
              value={lookupRut}
              onChange={(e) => setLookupRut(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono text-center sm:text-left transition"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shrink-0 shadow-xs"
            >
              {isSearching ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                  <span>Consultando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Consultar Cita</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 text-center">
            Información protegida conforme a la Ley N° 20.584 de Derechos y Deberes del Paciente.
          </p>
        </form>

        {/* Estado Activo de Carga con Mensaje Empático */}
        {isSearching && (
          <div className="pt-2 max-w-xl mx-auto animate-fadeIn">
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-center gap-3.5 shadow-xs">
              <div className="relative w-9 h-9 rounded-xl bg-sky-100 text-blue-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 animate-pulse text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-slate-900 tracking-wide">
                  Estamos trabajando para su comodidad y salud
                </h4>
                <p className="text-[11px] text-sky-700 font-mono mt-0.5">
                  Buscando citas vigentes y asignaciones de box para este RUT...
                </p>
              </div>
              <div className="w-4 h-4 rounded-full border-2 border-sky-200 border-t-blue-600 animate-spin shrink-0"></div>
            </div>
          </div>
        )}

        {/* Resultados de la Búsqueda */}
        {lookupResults !== null && (
          <div className="pt-2 animate-fadeIn">
            {lookupResults.length > 0 ? (
              <div className="space-y-4 max-w-3xl mx-auto">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-blue-700 font-semibold">
                    Se encontraron {lookupResults.length} cita(s) asociadas a este RUT:
                  </span>
                  <span className="text-slate-500">Clínica Horizonte Providencia</span>
                </div>

                {lookupResults.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-white border border-sky-200 space-y-4 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{item.specialty}</h3>
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                            {item.status || 'CONFIRMADA'}
                          </span>
                        </div>
                        <span className="text-xs text-blue-600 font-mono">Código: {item.code}</span>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs text-slate-500 block">Horario Programado</span>
                        <span className="text-sm font-bold text-slate-900 font-mono">{item.date}</span>
                        <span className="text-xs text-blue-600 font-mono block font-semibold">{item.time} hrs</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Médico Tratante:</span>
                        <span className="font-semibold text-slate-800">{item.doctor}</span>
                        <span className="text-slate-500 block">{item.box}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Paciente Titular:</span>
                        <span className="font-semibold text-slate-800">{item.patientName}</span>
                        <span className="text-slate-500 font-mono block">{item.patientRut}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Previsión / Copago:</span>
                        <span className="font-semibold text-emerald-700 font-mono">
                          {item.insurance}
                        </span>
                        <span className="text-slate-500 text-[11px] block">Validación en mesón I-Med</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 text-xs text-slate-700 flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <strong className="text-slate-900">Indicaciones de Atención:</strong>
                        <span className="text-slate-600 ml-1">
                          Presentarse 15 minutos antes con cédula de identidad en <strong>Av. Providencia 1420</strong>. Si tienes exámenes previos relacionados, favor llevarlos al box de consulta.
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 text-xs max-w-xl mx-auto space-y-3">
                <p>No se registran citas activas para el RUT ingresado ({lookupRut}).</p>
                <p className="text-slate-500 text-[11px]">
                  Verifica que el RUT esté bien escrito o reserva una nueva hora médica.
                </p>
                <div>
                  <a
                    href="/reservar-hora"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition text-xs shadow-xs"
                  >
                    <span>Ir a Reservar Hora</span>
                    <span>&rarr;</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
