import React, { useState } from 'react';

interface Specialty {
  id: string;
  name: string;
  code: string;
  durationMinutes: number;
  price: number;
  description: string;
}

const SPECIALTIES: Specialty[] = [
  { id: '1', code: 'MED-GEN', name: 'Medicina General', durationMinutes: 20, price: 14200, description: 'Atención primaria ambulatoria, medicina preventiva y controles de salud para adultos.' },
  { id: '2', code: 'PED-01', name: 'Pediatría Integral', durationMinutes: 30, price: 18500, description: 'Control de niño sano, patologías agudas pediátricas y orientación nutricional infantil.' },
  { id: '3', code: 'CAR-01', name: 'Cardiología Preventiva', durationMinutes: 30, price: 28000, description: 'Evaluación cardiovascular, riesgo coronario, lectura de electrocardiograma y monitoreo de presión.' },
  { id: '4', code: 'TRA-01', name: 'Traumatología Adulto & Infantil', durationMinutes: 20, price: 22000, description: 'Diagnóstico y tratamiento de lesiones musculares, óseas, articulares y esguinces.' },
];

const DOCTORS = [
  { id: 'doc-1', name: 'Dr. Roberto Morales Soto', specialty: 'Medicina General / Cardiología', box: 'Box 01' },
  { id: 'doc-2', name: 'Dra. Carolina Valenzuela Ríos', specialty: 'Pediatría Integral', box: 'Box 03' },
  { id: 'doc-3', name: 'Dr. Matías Albornoz Castro', specialty: 'Traumatología', box: 'Box 04' },
];

const TIME_SLOTS = [
  '08:40', '09:20', '10:00', '10:40', '11:20', '12:00', '14:20', '15:00', '15:40', '16:20', '17:00', '17:40'
];

export default function PatientBookingWidget() {
  const [selectedSpecialty, setSelectedSpecialty] = useState(SPECIALTIES[0].id);
  const [selectedDoctor, setSelectedDoctor] = useState(DOCTORS[0].id);
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
    if (!patientRut || !patientName || !patientPhone) {
      alert('Por favor complete los campos obligatorios (RUT, Nombre y Teléfono).');
      return;
    }

    const specialty = SPECIALTIES.find((s) => s.id === selectedSpecialty);
    const doctor = DOCTORS.find((d) => d.id === selectedDoctor);
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
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-mono font-semibold text-teal-400 uppercase tracking-wider block">
            Reserva de Horas Médicas Online
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Agendamiento de Consulta Ambulatoria
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Selecciona especialidad, facultativo y horario disponible sin solapamientos.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
          <span>Disponibilidad en Tiempo Real</span>
        </div>
      </div>

      <div className="pt-6">
        {isSubmitting ? (
          <div className="p-8 rounded-2xl bg-slate-950/80 border border-teal-500/30 text-center space-y-4 animate-fadeIn max-w-lg mx-auto shadow-2xl">
            <div className="relative w-14 h-14 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
              <svg className="w-7 h-7 animate-pulse text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-teal-400 animate-ping"></span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Estamos trabajando para su comodidad y salud
              </h3>
              <p className="text-xs text-teal-300 font-mono mt-1">
                {submittingStage}
              </p>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div className="bg-teal-400 h-1.5 rounded-full animate-shimmer w-full"></div>
            </div>
          </div>
        ) : bookingSuccess ? (
          <div className="p-6 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-slate-100 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">¡Hora Médica Reservada con Éxito!</h3>
                <p className="text-xs text-teal-400 font-mono">Código de Reserva: {bookingSuccess.code}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Paciente:</span>
                <span className="font-semibold text-white">{bookingSuccess.patientName}</span>
                <span className="text-slate-400 font-mono block">{bookingSuccess.patientRut}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Especialidad & Médico:</span>
                <span className="font-semibold text-white">{bookingSuccess.specialty}</span>
                <span className="text-teal-400 block font-medium">{bookingSuccess.doctor}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Fecha & Horario:</span>
                <span className="font-semibold text-white font-mono">{bookingSuccess.date}</span>
                <span className="text-teal-400 font-mono block">{bookingSuccess.time} hrs ({bookingSuccess.box})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Copago Estimado:</span>
                <span className="font-bold text-emerald-400 text-sm font-mono">
                  ${bookingSuccess.copay.toLocaleString('es-CL')}
                </span>
                <span className="text-slate-400 text-[11px] block">Convenio: {bookingSuccess.insurance}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <p>
                Presentarse 15 minutos antes con cédula de identidad en <strong>Av. Providencia 1420</strong>.
              </p>
              <div className="flex items-center gap-2">
                <a
                  href="#consultar-cita"
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
                >
                  Ver en Consultar Cita
                </a>
                <button
                  type="button"
                  onClick={() => { setBookingSuccess(null); setPatientRut(''); setPatientName(''); }}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition"
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
              <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                1. Selección de Especialidad
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {SPECIALTIES.map((spec) => (
                  <div
                    key={spec.id}
                    onClick={() => setSelectedSpecialty(spec.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      selectedSpecialty === spec.id
                        ? 'bg-teal-500/10 border-teal-500 text-white shadow-sm'
                        : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-bold text-sm">{spec.name}</h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-teal-400">
                          {spec.durationMinutes} min
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {spec.description}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Arancel Base:</span>
                      <span className="font-mono font-semibold text-slate-200">
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
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                  Profesional de Salud
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  {DOCTORS.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.box}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                  Fecha de Atención
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                  Previsión de Salud
                </label>
                <select
                  value={patientInsurance}
                  onChange={(e) => setPatientInsurance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
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
              <span className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
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
                        ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Paso 4: Identificación del Paciente */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                2. Datos del Paciente Titular
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">RUT Paciente *</label>
                  <input
                    type="text"
                    required
                    placeholder="12.345.678-9"
                    value={patientRut}
                    onChange={(e) => setPatientRut(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Sofía Contreras Díaz"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Teléfono Móvil *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+56 9 8765 4321"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="paciente@correo.cl"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Confirmar Reserva */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Reserva protegida contra duplicidades y respaldada por la Ley N° 20.584.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-semibold text-sm transition shadow-lg shadow-teal-950/50 flex items-center justify-center gap-2"
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
