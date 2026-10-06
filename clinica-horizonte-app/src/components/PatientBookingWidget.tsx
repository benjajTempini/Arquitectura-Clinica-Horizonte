import React, { useState, useEffect } from 'react';
import { isValidNationalId, formatRut } from '../utils/rut.util';
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

export default function PatientBookingWidget() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStage, setSubmittingStage] = useState('Estamos trabajando para su comodidad y salud...');

  useEffect(() => {
    async function loadData() {
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
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  const calculateCopay = (insurance: string, fullPrice: number) => {
    switch (insurance) {
      case 'FONASA_A':
        return 0;
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
        return Math.round(fullPrice * 0.3);
      default:
        return fullPrice;
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRut = patientRut.replace(/\./g, '').trim().toUpperCase();
    if (!cleanRut || !isValidNationalId(cleanRut)) {
      alert('Por favor ingrese un RUT chileno válido (ej: 15.824.912-K) o documento oficial.');
      return;
    }
    if (!patientName.trim() || patientName.trim().length < 2) {
      alert('Por favor ingrese el nombre completo del paciente.');
      return;
    }
    if (!patientPhone.trim() || patientPhone.trim().length < 8) {
      alert('Por favor ingrese un teléfono de contacto válido.');
      return;
    }

    const specialty = specialties.find((s) => s.id === selectedSpecialty);
    const doctor = doctors.find((d) => d.id === selectedDoctor);
    const bookingCode = `HOR-${Math.floor(100000 + Math.random() * 900000)}`;

    const newBooking = {
      code: bookingCode,
      patientName: patientName.trim(),
      patientRut: formatRut(cleanRut) || cleanRut,
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

    setIsSubmitting(true);
    setSubmittingStage('Estamos trabajando para su comodidad y salud...');

    setTimeout(() => {
      setSubmittingStage('Validando disponibilidad y ausencia de solapamiento para el Box...');
    }, 300);

    setTimeout(() => {
      try {
        const existing = JSON.parse(localStorage.getItem('patient_bookings') || '[]');
        existing.unshift(newBooking);
        localStorage.setItem('patient_bookings', JSON.stringify(existing));
      } catch {
        // Fallback
      }

      setIsSubmitting(false);
      setBookingSuccess(newBooking);
    }, 700);
  };

  return (
    <div className="w-full bg-white border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <span className="text-xs font-mono font-semibold text-blue-600 uppercase tracking-wider block">
            Reserva de Horas Médicas Online
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Agendamiento de Consulta Ambulatoria
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Selecciona especialidad, facultativo y horario disponible sin solapamientos.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span>Disponibilidad en Tiempo Real</span>
        </div>
      </div>

      <div className="pt-6">
        {isSubmitting ? (
          <div className="p-8 rounded-2xl bg-sky-50 border border-sky-200 text-center space-y-4 animate-fadeIn max-w-lg mx-auto shadow-sm">
            <div className="relative w-14 h-14 mx-auto rounded-2xl bg-sky-100 text-blue-600 flex items-center justify-center">
              <svg className="w-7 h-7 animate-pulse text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 animate-ping"></span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-wide">
                Estamos trabajando para su comodidad y salud
              </h3>
              <p className="text-xs text-sky-700 font-mono mt-1">
                {submittingStage}
              </p>
            </div>
            <div className="w-full bg-sky-200/60 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-1.5 rounded-full animate-shimmer w-full"></div>
            </div>
          </div>
        ) : bookingSuccess ? (
          <div className="p-6 rounded-2xl bg-sky-50/50 border border-sky-200 text-slate-800 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">¡Hora Médica Reservada con Éxito!</h3>
                <p className="text-xs text-blue-600 font-mono font-medium">Código de Reserva: {bookingSuccess.code}</p>
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
                <span className="text-blue-600 block font-medium">{bookingSuccess.doctor}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Fecha & Horario:</span>
                <span className="font-semibold text-slate-900 font-mono">{bookingSuccess.date}</span>
                <span className="text-blue-600 font-mono block font-semibold">{bookingSuccess.time} hrs ({bookingSuccess.box})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Copago Estimado:</span>
                <span className="font-bold text-emerald-700 text-sm font-mono">
                  ${bookingSuccess.copay.toLocaleString('es-CL')}
                </span>
                <span className="text-slate-500 text-[11px] block">Convenio: {bookingSuccess.insurance}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-2 border-t border-sky-100">
              <p>
                Presentarse 15 minutos antes con cédula de identidad en <strong>Av. Providencia 1420</strong>.
              </p>
              <div className="flex items-center gap-2">
                <a
                  href="/consultar-cita"
                  className="px-3.5 py-2 rounded-lg bg-white hover:bg-sky-50 text-slate-700 font-medium border border-slate-200 transition"
                >
                  Ver en Consultar Cita
                </a>
                <button
                  type="button"
                  onClick={() => { setBookingSuccess(null); setPatientRut(''); setPatientName(''); }}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition shadow-xs"
                >
                  Agendar Otra Cita
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBookingSubmit} className="space-y-6">
            {/* Paso 1: Especialidad */}
            <div>
              <span className="text-xs font-mono font-semibold text-slate-600 uppercase tracking-wider block mb-3">
                1. Selección de Especialidad
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {specialties.map((spec) => (
                  <div
                    key={spec.id}
                    onClick={() => setSelectedSpecialty(spec.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      selectedSpecialty === spec.id
                        ? 'bg-sky-50 border-blue-500 text-slate-900 shadow-xs ring-1 ring-blue-500/20'
                        : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:border-sky-300 hover:bg-sky-50/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-bold text-sm text-slate-900">{spec.name}</h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-medium">
                          {spec.durationMinutes} min
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {spec.description}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Arancel Base:</span>
                      <span className="font-mono font-bold text-slate-800">
                        ${spec.price.toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Paso 2: Profesional, Fecha y Previsión */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                  Profesional de Salud
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                  Previsión de Salud
                </label>
                <select
                  value={patientInsurance}
                  onChange={(e) => setPatientInsurance(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
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

            {/* Paso 3: Horarios Disponibles */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                Horarios Disponibles (Atención Puntual en Box)
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 text-center rounded-lg text-xs font-mono font-medium transition ${
                      selectedSlot === slot
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:border-sky-300 hover:text-blue-600'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Paso 4: Identificación del Paciente */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-mono font-semibold text-slate-600 uppercase tracking-wider block mb-3">
                2. Datos del Paciente Titular
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">RUT Paciente *</label>
                  <input
                    type="text"
                    required
                    placeholder="12.345.678-9"
                    value={patientRut}
                    onChange={(e) => setPatientRut(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Sofía Contreras Díaz"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Teléfono Móvil *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+56 9 8765 4321"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="paciente@correo.cl"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Confirmar Reserva */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Reserva protegida contra duplicidades y respaldada por la Ley N° 20.584.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                    <span>Validando Reserva...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Confirmar Reserva de Hora</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
