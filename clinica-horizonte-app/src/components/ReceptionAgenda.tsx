import React, { useEffect, useState } from 'react';
import {
  professionalsService,
  specialtiesService,
  patientsService,
  appointmentsService,
} from '../services/api';

export default function ReceptionAgenda() {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal Reserva
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('');
  const [appointmentReason, setAppointmentReason] = useState('');

  // Modal Reprogramar
  const [rescheduleModal, setRescheduleModal] = useState<any>(null);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const [profs, specs, pats] = await Promise.all([
          professionalsService.list(),
          specialtiesService.list(),
          patientsService.list(),
        ]);
        setProfessionals(profs || []);
        setSpecialties(specs || []);
        setPatients(pats.items || []);
        if (profs && profs.length > 0) {
          setSelectedProfessional(profs[0].id);
        }
      } catch (err: any) {
        setActionMessage({
          type: 'error',
          text: err.message || 'Error al conectar con los servicios de Clínica Horizonte.',
        });
      }
    }
    init();
  }, []);

  const loadAgendaAndAvailability = async () => {
    if (!selectedProfessional || !selectedDate) return;
    setLoading(true);
    setActionMessage(null);
    try {
      const [avail, appts] = await Promise.all([
        professionalsService.getAvailability(selectedProfessional, selectedDate),
        appointmentsService.list({ professionalId: selectedProfessional, date: selectedDate }),
      ]);
      setAvailability(avail);
      setAppointments(appts.items || []);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'No fue posible obtener la disponibilidad para la fecha seleccionada.',
      });
      setAvailability(null);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgendaAndAvailability();
  }, [selectedProfessional, selectedDate]);

  const handleBookSlot = (slot: any) => {
    setSelectedSlot(slot);
    setSelectedSpecialtyId(specialties[0]?.id || '');
    setSelectedPatientId(patients[0]?.id || '');
    setShowModal(true);
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await appointmentsService.create({
        patientId: selectedPatientId,
        professionalId: selectedProfessional,
        specialtyId: selectedSpecialtyId,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason: appointmentReason,
      });
      setActionMessage({ type: 'success', text: 'Cita reservada y confirmada con éxito.' });
      setShowModal(false);
      setAppointmentReason('');
      loadAgendaAndAvailability();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.code === 'APPOINTMENT_OVERLAP'
          ? 'Error de solapamiento: El profesional ya tiene una cita reservada en ese horario.'
          : err.message || 'No se pudo reservar la cita.',
      });
    }
  };

  const handleStatusChange = async (appointmentId: string, status: string) => {
    try {
      await appointmentsService.updateStatus(appointmentId, { status });
      setActionMessage({ type: 'success', text: `Estado actualizado a ${status}` });
      loadAgendaAndAvailability();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error al actualizar estado.' });
    }
  };

  const submitReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await appointmentsService.reschedule(rescheduleModal.id, {
        startTime: newStartTime,
        endTime: newEndTime,
        reason: rescheduleReason,
      });
      setActionMessage({ type: 'success', text: 'Cita reprogramada exitosamente.' });
      setRescheduleModal(null);
      loadAgendaAndAvailability();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.code === 'APPOINTMENT_OVERLAP'
          ? 'Conflicto: El horario seleccionado se solapa con otra cita.'
          : err.message || 'No se pudo reprogramar la cita.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agenda Médica & Recepción</h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestión de citas, consulta de disponibilidad en tiempo real y prevención de solapamientos.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Selector de Profesional y Fecha */}
      <div className="p-5 rounded-2xl bg-white border border-sky-100 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
            Profesional de Salud
          </label>
          <select
            value={selectedProfessional}
            onChange={(e) => setSelectedProfessional(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-sky-50/50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
          >
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                Dr(a). {p.firstName} {p.lastName} — {p.specialties?.[0]?.specialty?.name || 'Medicina'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
            Fecha de Atención
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-sky-50/50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Franjas Horarias Disponibles */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-white border border-sky-100 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-3">Franjas de Disponibilidad</h2>
          {loading ? (
            <div className="py-4 space-y-2.5 animate-fadeIn">
              <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-xs flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin shrink-0"></div>
                <span className="text-sky-900 font-medium text-[11px] leading-tight">Estamos trabajando para su comodidad y salud. Calculando disponibilidad...</span>
              </div>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-10 rounded-lg bg-slate-50 border border-slate-100 animate-pulse flex items-center justify-between px-3">
                  <div className="w-14 h-3 rounded bg-slate-200"></div>
                  <div className="w-16 h-5 rounded bg-slate-200"></div>
                </div>
              ))}
            </div>
          ) : availability?.slots?.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {availability.slots.map((slot: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex items-center justify-between text-xs transition ${
                    slot.isAvailable
                      ? 'bg-sky-50/80 border-sky-200 text-sky-900 hover:border-sky-400'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <span className="font-mono font-medium">{slot.displayTime}</span>
                  {slot.isAvailable ? (
                    <button
                      onClick={() => handleBookSlot(slot)}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                    >
                      Reservar
                    </button>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-400 font-mono">Ocupado</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">
              No hay horarios disponibles configurados para este día.
            </p>
          )}
        </div>

        {/* Citas del Día */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-sky-100 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-3">Citas Agendadas para la Fecha</h2>
          {appointments.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {appointments.map((appt) => (
                <div key={appt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {appt.patient?.firstName} {appt.patient?.lastName}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">({appt.patient?.nationalId})</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1 flex items-center gap-3">
                      <span>Esp: {appt.specialty?.name}</span>
                      <span>•</span>
                      <span className="font-mono text-blue-600 font-semibold">
                        {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(appt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {appt.notes && <p className="text-xs text-slate-500 mt-1 italic">{appt.notes}</p>}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                      {appt.status}
                    </span>

                    {appt.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatusChange(appt.id, 'CONFIRMED')}
                        className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                      >
                        Confirmar
                      </button>
                    )}

                    {appt.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStatusChange(appt.id, 'ARRIVED')}
                        className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                      >
                        Llegada
                      </button>
                    )}

                    {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
                      <>
                        <button
                          onClick={() => {
                            setRescheduleModal(appt);
                            setNewStartTime(appt.startTime);
                            setNewEndTime(appt.endTime);
                          }}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition"
                        >
                          Reprogramar
                        </button>
                        <button
                          onClick={() => handleStatusChange(appt.id, 'CANCELLED')}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-8 text-center">
              No hay citas agendadas para el profesional en la fecha indicada.
            </p>
          )}
        </div>
      </div>

      {/* Modal Reservar Cita */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-100 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Reservar Cita Médica</h3>
            <p className="text-xs text-blue-600 font-mono mb-4">Horario: {selectedSlot?.displayTime}</p>

            <form onSubmit={submitBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Paciente</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-sky-50/50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {patients.map((pat) => (
                    <option key={pat.id} value={pat.id}>
                      {pat.firstName} {pat.lastName} ({pat.nationalId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Especialidad</label>
                <select
                  value={selectedSpecialtyId}
                  onChange={(e) => setSelectedSpecialtyId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-sky-50/50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {specialties.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name} ({spec.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo de Consulta</label>
                <input
                  type="text"
                  value={appointmentReason}
                  onChange={(e) => setAppointmentReason(e.target.value)}
                  placeholder="e.g. Control preventivo, molestia general"
                  className="w-full px-3 py-2 rounded-lg bg-sky-50/50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition"
                >
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reprogramar */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-100 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Reprogramar Cita</h3>
            <p className="text-xs text-slate-600 mb-4">
              Paciente: {rescheduleModal.patient?.firstName} {rescheduleModal.patient?.lastName}
            </p>

            <form onSubmit={submitReschedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nueva Fecha y Hora de Inicio</label>
                <input
                  type="datetime-local"
                  required
                  value={newStartTime ? new Date(newStartTime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const start = new Date(e.target.value);
                    const end = new Date(start.getTime() + 20 * 60000);
                    setNewStartTime(start.toISOString());
                    setNewEndTime(end.toISOString());
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-sky-50/50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo de Reprogramación</label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Cambio de turno laboral"
                  className="w-full px-3 py-2 rounded-lg bg-sky-50/50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRescheduleModal(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition"
                >
                  Confirmar Reprogramación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
