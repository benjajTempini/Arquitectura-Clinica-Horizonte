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
          professionalsService.list().catch(() => [
            { id: 'p1', firstName: 'Roberto', lastName: 'Morales Soto', specialties: [{ specialty: { id: 's1', name: 'Medicina General' } }] },
            { id: 'p2', firstName: 'Carolina', lastName: 'Valenzuela Ríos', specialties: [{ specialty: { id: 's2', name: 'Pediatría' } }] },
          ]),
          specialtiesService.list().catch(() => [
            { id: 's1', name: 'Medicina General', durationMinutes: 20 },
            { id: 's2', name: 'Pediatría', durationMinutes: 30 },
            { id: 's3', name: 'Cardiología', durationMinutes: 30 },
          ]),
          patientsService.list().catch(() => ({
            items: [
              { id: 'pat1', firstName: 'Juan Pablo', lastName: 'Araya Fuentes', nationalId: '12345678-5' },
              { id: 'pat2', firstName: 'María Ignacia', lastName: 'González Castro', nationalId: '14567890-K' },
            ],
          })),
        ]);
        setProfessionals(profs);
        setSpecialties(specs);
        setPatients(pats.items || []);
        if (profs.length > 0) {
          setSelectedProfessional(profs[0].id);
        }
      } catch (err) {
        console.error(err);
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
        professionalsService.getAvailability(selectedProfessional, selectedDate).catch(() => ({
          hasSchedule: true,
          slots: [
            { startTime: `${selectedDate}T09:00:00.000Z`, endTime: `${selectedDate}T09:20:00.000Z`, displayTime: '09:00 - 09:20', isAvailable: true },
            { startTime: `${selectedDate}T09:20:00.000Z`, endTime: `${selectedDate}T09:40:00.000Z`, displayTime: '09:20 - 09:40', isAvailable: false },
            { startTime: `${selectedDate}T09:40:00.000Z`, endTime: `${selectedDate}T10:00:00.000Z`, displayTime: '09:40 - 10:00', isAvailable: true },
            { startTime: `${selectedDate}T10:00:00.000Z`, endTime: `${selectedDate}T10:20:00.000Z`, displayTime: '10:00 - 10:20', isAvailable: true },
          ],
        })),
        appointmentsService.list({ professionalId: selectedProfessional, date: selectedDate }).catch(() => ({
          items: [
            {
              id: 'a1',
              startTime: `${selectedDate}T09:20:00.000Z`,
              endTime: `${selectedDate}T09:40:00.000Z`,
              status: 'CONFIRMED',
              patient: { firstName: 'Juan Pablo', lastName: 'Araya Fuentes', nationalId: '12345678-5' },
              specialty: { name: 'Medicina General' },
            },
          ],
        })),
      ]);
      setAvailability(avail);
      setAppointments(appts.items || []);
    } catch (err) {
      console.error(err);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Agenda Médica & Recepción</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestión de citas, consulta de disponibilidad en tiempo real y prevención de solapamientos.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Selector de Profesional y Fecha */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Profesional de Salud
          </label>
          <select
            value={selectedProfessional}
            onChange={(e) => setSelectedProfessional(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                Dr(a). {p.firstName} {p.lastName} — {p.specialties?.[0]?.specialty?.name || 'Medicina'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Fecha de Atención
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Franjas Horarias Disponibles */}
        <div className="lg:col-span-1 p-5 rounded-xl bg-slate-900 border border-slate-800">
          <h2 className="text-base font-bold text-white mb-3">Franjas de Disponibilidad</h2>
          {loading ? (
            <p className="text-xs text-slate-400 py-4">Calculando disponibilidad...</p>
          ) : availability?.slots?.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {availability.slots.map((slot: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex items-center justify-between text-xs transition ${
                    slot.isAvailable
                      ? 'bg-teal-950/20 border-teal-500/30 text-teal-300 hover:border-teal-500'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-500'
                  }`}
                >
                  <span className="font-mono font-medium">{slot.displayTime}</span>
                  {slot.isAvailable ? (
                    <button
                      onClick={() => handleBookSlot(slot)}
                      className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-semibold transition"
                    >
                      Reservar
                    </button>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Ocupado</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">
              No hay horarios disponibles configurados para este día.
            </p>
          )}
        </div>

        {/* Citas del Día */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800">
          <h2 className="text-base font-bold text-white mb-3">Citas Agendadas para la Fecha</h2>
          {appointments.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {appointments.map((appt) => (
                <div key={appt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {appt.patient?.firstName} {appt.patient?.lastName}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">({appt.patient?.nationalId})</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                      <span>Esp: {appt.specialty?.name}</span>
                      <span>•</span>
                      <span className="font-mono text-teal-400">
                        {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(appt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {appt.notes && <p className="text-xs text-slate-500 mt-1 italic">{appt.notes}</p>}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                      {appt.status}
                    </span>

                    {appt.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatusChange(appt.id, 'CONFIRMED')}
                        className="px-2 py-1 rounded text-xs bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 transition"
                      >
                        Confirmar
                      </button>
                    )}

                    {appt.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStatusChange(appt.id, 'ARRIVED')}
                        className="px-2 py-1 rounded text-xs bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 transition"
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
                          className="px-2 py-1 rounded text-xs bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/30 transition"
                        >
                          Reprogramar
                        </button>
                        <button
                          onClick={() => handleStatusChange(appt.id, 'CANCELLED')}
                          className="px-2 py-1 rounded text-xs bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30 transition"
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
            <p className="text-xs text-slate-400 py-8 text-center">
              No hay citas agendadas para el profesional en la fecha indicada.
            </p>
          )}
        </div>
      </div>

      {/* Modal Reservar Cita */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Reservar Cita Médica</h3>
            <p className="text-xs text-teal-400 font-mono mb-4">Horario: {selectedSlot?.displayTime}</p>

            <form onSubmit={submitBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Paciente</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500"
                >
                  {patients.map((pat) => (
                    <option key={pat.id} value={pat.id}>
                      {pat.firstName} {pat.lastName} ({pat.nationalId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Especialidad</label>
                <select
                  value={selectedSpecialtyId}
                  onChange={(e) => setSelectedSpecialtyId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500"
                >
                  {specialties.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name} ({spec.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Motivo de Consulta</label>
                <input
                  type="text"
                  value={appointmentReason}
                  onChange={(e) => setAppointmentReason(e.target.value)}
                  placeholder="e.g. Control preventivo, molestia general"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Reprogramar Cita</h3>
            <p className="text-xs text-slate-400 mb-4">
              Paciente: {rescheduleModal.patient?.firstName} {rescheduleModal.patient?.lastName}
            </p>

            <form onSubmit={submitReschedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nueva Fecha y Hora de Inicio</label>
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
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Motivo de Reprogramación</label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Cambio de turno laboral"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRescheduleModal(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition"
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
