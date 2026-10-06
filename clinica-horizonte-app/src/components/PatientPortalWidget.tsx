import React, { useState, useEffect } from 'react';
import { specialtiesService, professionalsService } from '../services/api';

interface Specialty {
  id: string;
  name: string;
  code: string;
  durationMinutes: number;
  price: number;
  description: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  box: string;
}

const TIME_SLOTS = [
  '08:40', '09:20', '10:00', '10:40', '11:20', '12:00', '14:20', '15:00', '15:40', '16:20', '17:00', '17:40'
];

export default function PatientPortalWidget() {
  const [activeTab, setActiveTab] = useState<'booking' | 'lookup' | 'insurance'>('booking');

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Booking Form State
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[1]);
  const [patientRut, setPatientRut] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientInsurance, setPatientInsurance] = useState('FONASA_B');
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  // Lookup State
  const [lookupRut, setLookupRut] = useState('');
  const [lookupResults, setLookupResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Insurance Calculator State
  const [simInsurance, setSimInsurance] = useState('FONASA_B');
  const [simSpecialty, setSimSpecialty] = useState('');

  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [specs, profs] = await Promise.all([
          specialtiesService.list(),
          professionalsService.list(),
        ]);
        const mappedSpecs: Specialty[] = (specs || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          durationMinutes: s.durationMinutes || s.defaultDurationMin || 20,
          price: s.price || 15000,
          description: s.description || 'Consulta médica ambulatoria integral.',
        }));
        setSpecialties(mappedSpecs);
        if (mappedSpecs.length > 0) {
          setSelectedSpecialty(mappedSpecs[0].id);
          setSimSpecialty(mappedSpecs[0].id);
        }

        const mappedDocs: Doctor[] = (profs || []).map((p: any) => ({
          id: p.id,
          name: `Dr(a). ${p.firstName} ${p.lastName}`,
          specialty: p.specialties?.map((s: any) => s.specialty?.name).filter(Boolean).join(' / ') || 'Medicina General',
          box: p.schedules?.[0]?.boxNumber || 'Box Ambulatorio',
        }));
        setDoctors(mappedDocs);
        if (mappedDocs.length > 0) {
          setSelectedDoctor(mappedDocs[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadCatalogs();
  }, []);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientRut || !patientName || !patientPhone) {
      alert('Por favor complete los campos obligatorios (RUT, Nombre y Teléfono).');
      return;
    }

    const specialty = specialties.find((s) => s.id === selectedSpecialty);
    const doctor = doctors.find((d) => d.id === selectedDoctor);
    const bookingCode = `HOR-${Math.floor(100000 + Math.random() * 900000)}`;

    const newBooking = {
      code: bookingCode,
      patientName,
      patientRut,
      patientPhone,
      patientEmail,
      specialty: specialty?.name,
      doctor: doctor?.name,
      box: doctor?.box,
      date: bookingDate,
      time: selectedSlot,
      insurance: patientInsurance,
      totalPrice: specialty?.price,
      copay: calculateCopay(patientInsurance, specialty?.price || 14200),
      createdAt: new Date().toISOString(),
    };

    // Store in localStorage for user retrieval
    try {
      const existing = JSON.parse(localStorage.getItem('patient_bookings') || '[]');
      existing.unshift(newBooking);
      localStorage.setItem('patient_bookings', JSON.stringify(existing));
    } catch {
      // Storage error
    }

    setBookingSuccess(newBooking);
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupRut.trim()) return;

    setIsSearching(true);
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
    }, 400);
  };

  const calculateCopay = (insurance: string, fullPrice: number) => {
    switch (insurance) {
      case 'FONASA_A':
        return 0; // Gratuidad institucional
      case 'FONASA_B':
        return Math.round(fullPrice * 0.25);
      case 'FONASA_C':
        return Math.round(fullPrice * 0.35);
      case 'FONASA_D':
        return Math.round(fullPrice * 0.45);
      case 'ISAPRE_COLMENA':
      case 'ISAPRE_BANMEDICA':
      case 'ISAPRE_CONSALUD':
      case 'ISAPRE_CRUZBLANCA':
        return Math.round(fullPrice * 0.3); // Promedio bonificación 70%
      default:
        return fullPrice; // Particular 100%
    }
  };

  return (
    <div className="w-full bg-white border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-xs">
      {/* Selector de Pestañas de Servicios para el Paciente */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono font-semibold text-blue-600 uppercase tracking-wider block">
            Portal de Autoservicio Pacientes
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Gestión Ambulatoria para Pacientes y Familias
          </h2>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-sky-50 rounded-xl border border-sky-200">
          <button
            type="button"
            onClick={() => { setActiveTab('booking'); setBookingSuccess(null); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
              activeTab === 'booking'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-sky-100/60'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Reservar Hora</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lookup')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
              activeTab === 'lookup'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-sky-100/60'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Consultar Mi Cita</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('insurance')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
              activeTab === 'insurance'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-sky-100/60'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Convenios & Copagos</span>
          </button>
        </div>
      </div>

      {/* CONTENIDO 1: RESERVA DE HORA */}
      {activeTab === 'booking' && (
        <div className="pt-6">
          {bookingSuccess ? (
            <div className="p-6 rounded-2xl bg-sky-50 border border-sky-200 text-slate-800 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                  ✓
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">¡Hora Médica Reservada con Éxito!</h3>
                  <p className="text-xs text-blue-600 font-mono">Código de Reserva: {bookingSuccess.code}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-white border border-sky-100 text-xs shadow-xs">
                <div>
                  <span className="text-slate-500 block">Paciente:</span>
                  <span className="font-semibold text-slate-900">{bookingSuccess.patientName}</span>
                  <span className="text-slate-500 font-mono block">{bookingSuccess.patientRut}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Especialidad & Médico:</span>
                  <span className="font-semibold text-slate-900">{bookingSuccess.specialty}</span>
                  <span className="text-blue-600 block">{bookingSuccess.doctor}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Fecha & Horario:</span>
                  <span className="font-semibold text-slate-900">{bookingSuccess.date}</span>
                  <span className="text-blue-600 font-mono block">{bookingSuccess.time} hrs ({bookingSuccess.box})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Copago Estimado:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    ${bookingSuccess.copay.toLocaleString('es-CL')}
                  </span>
                  <span className="text-slate-500 text-[11px] block">Convenio: {bookingSuccess.insurance}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-2 border-t border-sky-100">
                <p>
                  Por favor presentarse 15 minutos antes de la hora con su cédula de identidad en <strong>Av. Providencia 1420</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => { setBookingSuccess(null); setPatientRut(''); setPatientName(''); }}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
                >
                  Agendar Otra Cita
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-6">
              {/* Paso 1: Especialidad y Profesional */}
              <div>
                <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider block mb-3">
                  1. Selección Asistencial
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {specialties.map((spec) => (
                    <div
                      key={spec.id}
                      onClick={() => setSelectedSpecialty(spec.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        selectedSpecialty === spec.id
                          ? 'bg-sky-50 border-sky-400 text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-sky-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-bold text-sm text-slate-900">{spec.name}</h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                            {spec.durationMinutes} min
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {spec.description}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Arancel Base:</span>
                        <span className="font-mono font-semibold text-slate-900">
                          ${spec.price.toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paso 2: Profesional, Fecha y Franja Horaria */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                    Profesional Asignado
                  </label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full bg-sky-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} — {doc.box}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                    Fecha de Atención
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-sky-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                    Previsión de Salud
                  </label>
                  <select
                    value={patientInsurance}
                    onChange={(e) => setPatientInsurance(e.target.value)}
                    className="w-full bg-sky-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="FONASA_A">Fonasa Tramo A (Gratuidad)</option>
                    <option value="FONASA_B">Fonasa Tramo B (Copago 25%)</option>
                    <option value="FONASA_C">Fonasa Tramo C (Copago 35%)</option>
                    <option value="FONASA_D">Fonasa Tramo D (Copago 45%)</option>
                    <option value="ISAPRE_BANMEDICA">Isapre Banmédica</option>
                    <option value="ISAPRE_COLMENA">Isapre Colmena Golden Cross</option>
                    <option value="ISAPRE_CONSALUD">Isapre Consalud</option>
                    <option value="ISAPRE_CRUZBLANCA">Isapre CruzBlanca</option>
                    <option value="PARTICULAR">Particular (Sin Convenio)</option>
                  </select>
                </div>
              </div>

              {/* Paso 3: Horarios Disponibles (Sin Solapamientos) */}
              <div>
                <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                  Franja Horaria Disponible (Atención Puntual)
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 text-center rounded-lg text-xs font-mono font-medium transition ${
                        selectedSlot === slot
                          ? 'bg-blue-600 text-white font-bold shadow-md'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-sky-300 hover:text-slate-900'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paso 4: Identificación del Paciente */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider block mb-3">
                  2. Datos del Paciente Titular
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">RUT Paciente *</label>
                    <input
                      type="text"
                      required
                      placeholder="12.345.678-9"
                      value={patientRut}
                      onChange={(e) => setPatientRut(e.target.value)}
                      className="w-full bg-sky-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Sofía Contreras Díaz"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full bg-sky-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Teléfono Móvil *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+56 9 8765 4321"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full bg-sky-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      placeholder="paciente@correo.cl"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      className="w-full bg-sky-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              {/* Botón de Confirmación */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Reserva protegida contra duplicidades y respaldada por la Ley N° 20.584.</span>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-md flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Confirmar Reserva de Hora</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* CONTENIDO 2: CONSULTA DE CITA CON RUT */}
      {activeTab === 'lookup' && (
        <div className="pt-6 space-y-6">
          <form onSubmit={handleLookupSubmit} className="max-w-xl mx-auto space-y-4 text-center">
            <h3 className="text-base font-bold text-slate-900">Consulte el estado y detalles de su cita médica</h3>
            <p className="text-xs text-slate-600">
              Ingrese su RUT para visualizar sus horas reservadas, médico tratante y box de atención.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Ej: 12.345.678-9"
                value={lookupRut}
                onChange={(e) => setLookupRut(e.target.value)}
                className="flex-1 bg-sky-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono text-center"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
              >
                {isSearching ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </form>

          {lookupResults !== null && (
            <div className="pt-4">
              {lookupResults.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-xs font-mono text-blue-600 block">
                    {lookupResults.length} cita(s) encontrada(s) para el RUT consultado:
                  </span>
                  {lookupResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-white border border-sky-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{item.specialty}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-50 text-sky-800 border border-sky-200">
                            {item.code || 'CONFIRMADA'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Médico: <strong className="text-blue-600">{item.doctor}</strong> ({item.box || 'Box Central'})
                        </p>
                        <p className="text-xs text-slate-500">
                          Paciente: {item.patientName} &bull; Previsión: {item.insurance}
                        </p>
                      </div>

                      <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6">
                        <div className="text-xs text-slate-500">Fecha y Hora Programada</div>
                        <div className="text-base font-bold text-slate-900 font-mono">{item.date}</div>
                        <div className="text-xs text-blue-600 font-mono">{item.time} hrs</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-sky-50/50 rounded-2xl border border-sky-100 text-slate-500 text-xs">
                  No se encontraron citas activas para el RUT ingresado. Puede reservar una nueva hora médica en la pestaña superior.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO 3: GUÍA DE CONVENIOS Y SIMULADOR */}
      {activeTab === 'insurance' && (
        <div className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-white border border-sky-100 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Simulador de Copago Estimado</h3>
              
              <div>
                <label className="block text-xs text-slate-600 mb-1">Especialidad de Consulta:</label>
                <select
                  value={simSpecialty}
                  onChange={(e) => setSimSpecialty(e.target.value)}
                  className="w-full bg-sky-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Arancel Total: ${s.price.toLocaleString('es-CL')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Convenio de Salud:</label>
                <select
                  value={simInsurance}
                  onChange={(e) => setSimInsurance(e.target.value)}
                  className="w-full bg-sky-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="FONASA_A">Fonasa Tramo A (100% Bonificado / $0)</option>
                  <option value="FONASA_B">Fonasa Tramo B (Copago 25%)</option>
                  <option value="FONASA_C">Fonasa Tramo C (Copago 35%)</option>
                  <option value="FONASA_D">Fonasa Tramo D (Copago 45%)</option>
                  <option value="ISAPRE_BANMEDICA">Isapres (Banmédica, Colmena, Consalud, CruzBlanca ~30%)</option>
                  <option value="PARTICULAR">Particular (Sin Previsión)</option>
                </select>
              </div>

              {(() => {
                const s = specialties.find((x) => x.id === simSpecialty) || specialties[0];
                if (!s) return null;
                const copay = calculateCopay(simInsurance, s.price);
                const discount = s.price - copay;
                return (
                  <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Arancel Institucional:</span>
                      <span className="font-mono text-slate-900">${s.price.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between text-blue-600">
                      <span>Bonificación Previsión:</span>
                      <span className="font-mono">-${discount.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="pt-2 border-t border-sky-200 flex justify-between font-bold text-sm">
                      <span className="text-slate-900">Copago a Pagar en Caja:</span>
                      <span className="text-emerald-700 font-mono">${copay.toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">¿Cómo Funciona el Pago y Validación de Bonos?</h3>
              
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-100 flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-sky-100 text-blue-700 font-bold shrink-0">1</div>
                  <p>
                    <strong className="text-slate-900">Bono Electrónico I-Med en Caja:</strong> No es necesario comprar el bono antes. En nuestra recepción validamos su huella digital y se emite el bono al instante con el copago exacto.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-100 flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-sky-100 text-blue-700 font-bold shrink-0">2</div>
                  <p>
                    <strong className="text-slate-900">Bonos Web Fonasa e Isapres:</strong> Si ya compró su bono en el portal de Fonasa o de su Isapre, simplemente entregue el número de folio al recepcionista.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-100 flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-sky-100 text-blue-700 font-bold shrink-0">3</div>
                  <p>
                    <strong className="text-slate-900">Medios de Pago Aceptados:</strong> Tarjetas de débito (Redcompra), crédito en cuotas, efectivo y transferencia electrónica.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
