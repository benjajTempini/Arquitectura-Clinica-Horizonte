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
  const [reason, setReason] = useState('');
  const [anamnesis, setAnamnesis] = useState('');
  const [physicalExam, setPhysicalExam] = useState('');
  const [vitalSigns, setVitalSigns] = useState({ pa: '', fc: '', temp: '', sat: '', peso: '', talla: '' });
  const [indication, setIndication] = useState('');

  // Diagnósticos
  const [diagnoses, setDiagnoses] = useState([
    { code: '', description: '', type: 'PRIMARY' },
  ]);

  // Tratamientos
  const [treatments, setTreatments] = useState<any[]>([]);

  useEffect(() => {
    async function loadInitial() {
      try {
        const pats = await patientsService.list();
        setPatients(pats.items || []);

        const urlParams = new URLSearchParams(window.location.search);
        const pid = urlParams.get('patientId') || pats.items?.[0]?.id;
        if (pid) {
          setSelectedPatientId(pid);
        }
      } catch (err: any) {
        setMessage({
          type: 'error',
          text: err.message || 'Error al cargar lista de pacientes.',
        });
      }
    }
    loadInitial();
  }, []);

  const loadPatientData = async (patientId: string) => {
    if (!patientId) return;
    setLoading(true);
    try {
      const [hist, appts] = await Promise.all([
        clinicalCareService.getPatientHistory(patientId),
        appointmentsService.list({ patientId }),
      ]);
      setHistory(hist || []);
      const pending = (appts.items || []).filter((a: any) => !a.clinicalCare);
      setPendingAppointments(pending);
      if (pending.length > 0) {
        setSelectedAppointmentId(pending[0].id);
      } else {
        setSelectedAppointmentId('');
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'No fue posible cargar el historial del paciente.',
      });
      setHistory([]);
      setPendingAppointments([]);
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

    if (!selectedAppointmentId) {
      setMessage({
        type: 'error',
        text: 'Debe seleccionar una cita médica del paciente para asociar la atención clínica. Si el paciente no tiene citas, agende una primero en la sección Agenda.',
      });
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      setMessage({ type: 'error', text: 'El motivo de consulta es obligatorio (al menos 3 caracteres).' });
      return;
    }
    if (!anamnesis.trim() || anamnesis.trim().length < 5) {
      setMessage({ type: 'error', text: 'La anamnesis clínica es obligatoria (al menos 5 caracteres).' });
      return;
    }
    const validDiagnoses = diagnoses.filter((d) => d.code.trim() && d.description.trim());
    if (validDiagnoses.length === 0) {
      setMessage({ type: 'error', text: 'Debe ingresar al menos un diagnóstico con código CIE-10 válido y descripción.' });
      return;
    }

    const validTreatments = treatments.filter((t) => t.medication.trim());

    try {
      await clinicalCareService.create(selectedAppointmentId, {
        reason: reason.trim(),
        anamnesis: anamnesis.trim(),
        physicalExam: physicalExam?.trim(),
        vitalSigns: JSON.stringify(vitalSigns),
        indication: indication?.trim(),
        diagnoses: validDiagnoses,
        treatments: validTreatments.length > 0 ? validTreatments : undefined,
      });

      setMessage({ type: 'success', text: 'Atención clínica registrada exitosamente con trazabilidad y receta médica.' });
      setReason('');
      setAnamnesis('');
      setPhysicalExam('');
      setVitalSigns({ pa: '', fc: '', temp: '', sat: '', peso: '', talla: '' });
      setIndication('');
      setDiagnoses([{ code: '', description: '', type: 'PRIMARY' }]);
      setTreatments([]);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Atención Médica & Ficha Clínica</h1>
          <p className="text-sm text-slate-500 mt-1">
            Espacio de trabajo para facultativos: anamnesis, examen físico, codificación CIE-10 y prescripciones.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold ml-4 hover:opacity-75">✕</button>
        </div>
      )}

      {/* Selector de Paciente */}
      <div className="p-4 rounded-2xl bg-white border border-sky-100 flex flex-col sm:flex-row items-center gap-4 shadow-xs">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider shrink-0 font-mono">
          Paciente en Consulta:
        </label>
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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
        <div className="lg:col-span-1 p-5 rounded-2xl bg-white border border-sky-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Historial Clínico</h2>
            <span className="text-xs text-slate-500 font-mono">{history.length} atenciones</span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-500 py-4">Cargando antecedentes clínicos...</p>
          ) : history.length > 0 ? (
            <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1">
              {history.map((h, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500 border-b border-slate-200 pb-1.5">
                    <span className="font-mono text-blue-700 font-semibold">{new Date(h.createdAt).toLocaleDateString()}</span>
                    <span>Dr(a). {h.professional?.lastName || 'Facultativo Tratante'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Motivo:</span>
                    <span className="text-slate-600">{h.reason}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Diagnósticos:</span>
                    <div className="space-y-1 mt-1">
                      {h.diagnoses?.map((d: any, di: number) => (
                        <div key={di} className="inline-block mr-1.5 px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-mono font-medium">
                          [{d.code}] {d.description}
                        </div>
                      ))}
                    </div>
                  </div>
                  {h.treatments?.length > 0 && (
                    <div>
                      <span className="font-semibold text-slate-900 block">Tratamientos:</span>
                      <ul className="list-disc list-inside text-slate-600 text-[11px]">
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
            <p className="text-xs text-slate-500 py-8 text-center">
              No se registran atenciones clínicas previas para este paciente.
            </p>
          )}
        </div>

        {/* Formulario Registro de Atención Nueva */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-sky-100 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">Registro de Atención Actual</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Signos Vitales */}
            <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-3 font-mono">
                Signos Vitales & Medidas
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">P.A. (mmHg)</label>
                  <input
                    type="text"
                    value={vitalSigns.pa}
                    onChange={(e) => setVitalSigns({ ...vitalSigns, pa: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-mono focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">F.C. (lpm)</label>
                  <input
                    type="text"
                    value={vitalSigns.fc}
                    onChange={(e) => setVitalSigns({ ...vitalSigns, fc: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-mono focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Temp (°C)</label>
                  <input
                    type="text"
                    value={vitalSigns.temp}
                    onChange={(e) => setVitalSigns({ ...vitalSigns, temp: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-mono focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">SatO2 (%)</label>
                  <input
                    type="text"
                    value={vitalSigns.sat}
                    onChange={(e) => setVitalSigns({ ...vitalSigns, sat: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-mono focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Peso (kg)</label>
                  <input
                    type="text"
                    value={vitalSigns.peso}
                    onChange={(e) => setVitalSigns({ ...vitalSigns, peso: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-mono focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Talla (m)</label>
                  <input
                    type="text"
                    value={vitalSigns.talla}
                    onChange={(e) => setVitalSigns({ ...vitalSigns, talla: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-mono focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo de Consulta</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Anamnesis / Evolución</label>
              <textarea
                required
                rows={3}
                value={anamnesis}
                onChange={(e) => setAnamnesis(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Examen Físico</label>
              <textarea
                rows={2}
                value={physicalExam}
                onChange={(e) => setPhysicalExam(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            {/* Sección Diagnósticos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Diagnósticos (CIE-10)</label>
                <button
                  type="button"
                  onClick={addDiagnosis}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
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
                    className="w-28 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:bg-white focus:border-blue-500 transition"
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
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-blue-500 transition"
                  />
                  {diagnoses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDiagnosis(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600"
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
                <label className="text-xs font-semibold text-slate-700">Prescripción y Tratamiento</label>
                <button
                  type="button"
                  onClick={addTreatment}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  + Agregar Fármaco
                </button>
              </div>

              {treatments.map((t, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    placeholder="Fármaco"
                    value={t.medication}
                    onChange={(e) => {
                      const next = [...treatments];
                      next[idx].medication = e.target.value;
                      setTreatments(next);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs"
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
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs"
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
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs"
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
                      className="w-16 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => removeTreatment(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Indicaciones Médicas y Seguimiento</label>
              <textarea
                rows={2}
                value={indication}
                onChange={(e) => setIndication(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm transition shadow-md shadow-blue-600/20 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                    <span>Guardando Ficha Clínica...</span>
                  </>
                ) : (
                  'Registrar Atención Clínica'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
