import React, { useEffect, useState } from 'react';
import { clinicalCareService, patientsService, appointmentsService } from '../services/api';

export default function ClinicalEncounter() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<any[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario de Atención
  const [reason, setReason] = useState('Control por sospecha de hipertensión');
  const [anamnesis, setAnamnesis] = useState('Paciente refiere cefalea matutina y mareos leves ocasionales.');
  const [physicalExam, setPhysicalExam] = useState('Buen estado general, ruidos cardíacos rítmicos sin soplos.');
  const [vitalSigns, setVitalSigns] = useState({ pa: '135/85', fc: '74', temp: '36.6', sat: '98', peso: '75', talla: '1.72' });
  const [indication, setIndication] = useState('Control de presión diario, dieta reducida en sodio.');

  // Diagnósticos
  const [diagnoses, setDiagnoses] = useState([
    { code: 'I10', description: 'Hipertensión esencial (primaria)', type: 'PRIMARY' },
  ]);

  // Tratamientos
  const [treatments, setTreatments] = useState([
    { medication: 'Losartán Potásico', dosage: '50 mg', frequency: 'Cada 24 horas', durationDays: 30, instructions: 'En ayunas' },
  ]);

  useEffect(() => {
    async function loadInitial() {
      try {
        const pats = await patientsService.list().catch(() => ({
          items: [
            { id: 'pat1', firstName: 'Juan Pablo', lastName: 'Araya Fuentes', nationalId: '12345678-5' },
            { id: 'pat2', firstName: 'María Ignacia', lastName: 'González Castro', nationalId: '14567890-K' },
          ],
        }));
        setPatients(pats.items || []);

        // Leer si viene ?patientId en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const pid = urlParams.get('patientId') || pats.items?.[0]?.id;
        if (pid) {
          setSelectedPatientId(pid);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadInitial();
  }, []);

  const loadPatientData = async (patientId: string) => {
    if (!patientId) return;
    setLoading(true);
    try {
      const [hist, appts] = await Promise.all([
        clinicalCareService.getPatientHistory(patientId).catch(() => [
          {
            id: 'cc-1',
            createdAt: '2026-09-20T10:00:00Z',
            reason: 'Chequeo médico de rutina',
            anamnesis: 'Paciente asintomático acude a chequeo preventivo anual.',
            physicalExam: 'Sin alteraciones relevantes.',
            indication: 'Mantener hábitos saludables y ejercicio físico regular.',
            vitalSigns: '{"pa":"120/80","fc":"70","temp":"36.5"}',
            professional: { firstName: 'Roberto', lastName: 'Morales Soto' },
            diagnoses: [{ code: 'Z00.0', description: 'Examen médico general' }],
            treatments: [],
          },
        ]),
        appointmentsService.list({ patientId, status: 'ARRIVED' }).catch(() => ({ items: [] })),
      ]);
      setHistory(hist);
      setPendingAppointments(appts.items || []);
      if (appts.items?.length > 0) {
        setSelectedAppointmentId(appts.items[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientData(selectedPatientId);
    }
  }, [selectedPatientId]);

  const addDiagnosis = () => {
    setDiagnoses([...diagnoses, { code: '', description: '', type: 'SECONDARY' }]);
  };

  const removeDiagnosis = (idx: number) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== idx));
  };

  const addTreatment = () => {
    setTreatments([...treatments, { medication: '', dosage: '', frequency: '', durationDays: 7, instructions: '' }]);
  };

  const removeTreatment = (idx: number) => {
    setTreatments(treatments.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const apptId = selectedAppointmentId || 'mock-appointment-id';
    try {
      await clinicalCareService.create(apptId, {
        reason,
        anamnesis,
        physicalExam,
        vitalSigns: JSON.stringify(vitalSigns),
        indication,
        diagnoses,
        treatments,
      });

      setMessage({ type: 'success', text: 'Atención clínica registrada exitosamente con trazabilidad y receta médica.' });
      loadPatientData(selectedPatientId);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.code === 'CLINICAL_CARE_EXISTS'
          ? 'Esta cita ya tiene una atención médica registrada.'
          : err.message || 'Error al registrar atención médica.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Atención Médica & Ficha Clínica</h1>
          <p className="text-sm text-slate-400 mt-1">
            Espacio de trabajo para facultativos: anamnesis, examen físico, codificación CIE-10 y prescripciones.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Selector de Paciente */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
          Paciente en Consulta:
        </label>
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500"
        >
          {patients.map((pat) => (
            <option key={pat.id} value={pat.id}>
              {pat.firstName} {pat.lastName} — RUT: {pat.nationalId}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Historial Clínico Cronológico */}
        <div className="lg:col-span-1 p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Historial Clínico</h2>
            <span className="text-xs text-slate-400 font-mono">{history.length} atenciones</span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-4">Cargando antecedentes clínicos...</p>
          ) : history.length > 0 ? (
            <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1">
              {history.map((h, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-700 pb-1.5">
                    <span className="font-mono text-teal-400">{new Date(h.createdAt).toLocaleDateString()}</span>
                    <span>Dr(a). {h.professional?.lastName || 'Morales'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Motivo:</span>
                    <span className="text-slate-300">{h.reason}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Diagnósticos:</span>
                    <div className="space-y-1 mt-1">
                      {h.diagnoses?.map((d: any, di: number) => (
                        <div key={di} className="inline-block mr-1.5 px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[11px] font-mono">
                          [{d.code}] {d.description}
                        </div>
                      ))}
                    </div>
                  </div>
                  {h.treatments?.length > 0 && (
                    <div>
                      <span className="font-semibold text-white block">Tratamientos:</span>
                      <ul className="list-disc list-inside text-slate-300 text-[11px]">
                        {h.treatments.map((t: any, ti: number) => (
                          <li key={ti}>{t.medication} - {t.dosage} ({t.frequency})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-8 text-center">
              No se registran atenciones clínicas previas para este paciente.
            </p>
          )}
        </div>

        {/* Formulario Registro de Atención Nueva */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900 border border-slate-800">
          <h2 className="text-base font-bold text-white mb-4">Registro de Atención Actual</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Signos Vitales */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-3">
                Signos Vitales & Medidas
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">P.A. (mmHg)</label>
                  <input
                    type="text"
                    value={vitalSigns.pa}
                    onChange={(e) => setVitalSigns({ ...vitalSigns, pa: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">F.C. (lpm)</label>
                  <input
                    type="text"
                    value={vitalSigns.fc}
                    onChange={(e) => setVitalSigns({ ...vitalSigns, fc: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Temp (°C)</label>
                  <input
                    type="text"
                    value={vitalSigns.temp}
                    onChange={(e) => setVitalSigns({ ...vitalSigns, temp: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">SatO2 (%)</label>
                  <input
                    type="text"
                    value={vitalSigns.sat}
                    onChange={(e) => setVitalSigns({ ...vitalSigns, sat: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Peso (kg)</label>
                  <input
                    type="text"
                    value={vitalSigns.peso}
                    onChange={(e) => setVitalSigns({ ...vitalSigns, peso: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Talla (m)</label>
                  <input
                    type="text"
                    value={vitalSigns.talla}
                    onChange={(e) => setVitalSigns({ ...vitalSigns, talla: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Motivo de Consulta</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Anamnesis / Evolución</label>
              <textarea
                required
                rows={3}
                value={anamnesis}
                onChange={(e) => setAnamnesis(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Examen Físico</label>
              <textarea
                rows={2}
                value={physicalExam}
                onChange={(e) => setPhysicalExam(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Sección Diagnósticos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Diagnósticos (CIE-10)</label>
                <button
                  type="button"
                  onClick={addDiagnosis}
                  className="text-xs text-teal-400 hover:text-teal-300 font-semibold"
                >
                  + Agregar Diagnóstico
                </button>
              </div>

              {diagnoses.map((d, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    placeholder="Código (e.g. I10)"
                    value={d.code}
                    onChange={(e) => {
                      const next = [...diagnoses];
                      next[idx].code = e.target.value;
                      setDiagnoses(next);
                    }}
                    className="w-24 px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Descripción diagnóstica..."
                    value={d.description}
                    onChange={(e) => {
                      const next = [...diagnoses];
                      next[idx].description = e.target.value;
                      setDiagnoses(next);
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                  {diagnoses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDiagnosis(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Sección Tratamientos / Receta */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Prescripción y Tratamiento</label>
                <button
                  type="button"
                  onClick={addTreatment}
                  className="text-xs text-teal-400 hover:text-teal-300 font-semibold"
                >
                  + Agregar Fármaco
                </button>
              </div>

              {treatments.map((t, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center bg-slate-800/30 p-2 rounded-lg border border-slate-700/60">
                  <input
                    type="text"
                    placeholder="Fármaco"
                    value={t.medication}
                    onChange={(e) => {
                      const next = [...treatments];
                      next[idx].medication = e.target.value;
                      setTreatments(next);
                    }}
                    className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Dosis (e.g. 50 mg)"
                    value={t.dosage}
                    onChange={(e) => {
                      const next = [...treatments];
                      next[idx].dosage = e.target.value;
                      setTreatments(next);
                    }}
                    className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Frecuencia (e.g. C/12h)"
                    value={t.frequency}
                    onChange={(e) => {
                      const next = [...treatments];
                      next[idx].frequency = e.target.value;
                      setTreatments(next);
                    }}
                    className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="Días"
                      value={t.durationDays}
                      onChange={(e) => {
                        const next = [...treatments];
                        next[idx].durationDays = Number(e.target.value);
                        setTreatments(next);
                      }}
                      className="w-16 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => removeTreatment(idx)}
                      className="p-1 text-slate-400 hover:text-red-400 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Indicaciones Médicas y Seguimiento</label>
              <textarea
                rows={2}
                value={indication}
                onChange={(e) => setIndication(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition shadow-lg shadow-teal-900/30"
              >
                Registrar Atención Clínica
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
