import React, { useEffect, useState } from 'react';
import { patientsService } from '../services/api';
import { isValidNationalId, formatRut } from '../utils/rut.util';

export default function PatientDirectory() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario nuevo paciente
  const [formData, setFormData] = useState({
    nationalId: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: 'MASCULINO',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
  });

  const loadPatients = async (query = '') => {
    setLoading(true);
    try {
      const res = await patientsService.list(query);
      setPatients(res.items || []);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'No fue posible consultar el listado de pacientes.',
      });
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPatients(search);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validación de campos
    const cleanId = formData.nationalId.replace(/\./g, '').trim().toUpperCase();
    if (!cleanId || !isValidNationalId(cleanId)) {
      setMessage({ type: 'error', text: 'El identificador debe ser un RUT chileno válido (ej: 15420312-K) o pasaporte oficial.' });
      return;
    }
    if (!formData.firstName.trim() || formData.firstName.trim().length < 2) {
      setMessage({ type: 'error', text: 'El nombre es obligatorio y debe tener al menos 2 caracteres.' });
      return;
    }
    if (!formData.lastName.trim() || formData.lastName.trim().length < 2) {
      setMessage({ type: 'error', text: 'Los apellidos son obligatorios y deben tener al menos 2 caracteres.' });
      return;
    }
    const birth = new Date(formData.birthDate);
    if (isNaN(birth.getTime()) || birth > new Date() || birth.getFullYear() < 1900) {
      setMessage({ type: 'error', text: 'La fecha de nacimiento debe ser válida y anterior a la fecha actual.' });
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 8) {
      setMessage({ type: 'error', text: 'El teléfono debe tener un formato válido (ej: +56 9 8765 4321).' });
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setMessage({ type: 'error', text: 'Por favor ingrese un correo electrónico válido.' });
      return;
    }

    try {
      await patientsService.create({
        ...formData,
        nationalId: formatRut(cleanId) || cleanId,
      });
      setMessage({ type: 'success', text: 'Paciente registrado exitosamente.' });
      setShowModal(false);
      setFormData({
        nationalId: '',
        firstName: '',
        lastName: '',
        birthDate: '',
        gender: 'MASCULINO',
        phone: '',
        email: '',
        address: '',
        emergencyContact: '',
      });
      loadPatients();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.code === 'PATIENT_DUPLICATE'
          ? 'Ya existe un paciente con el mismo RUT o identificador.'
          : err.message || 'Error al registrar paciente.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Directorio de Pacientes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Búsqueda, registro oficial y administración de fichas clínicas de pacientes ambulatorios.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-md shadow-blue-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Registrar Paciente
        </button>
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

      {/* Buscador */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por RUT, Nombre, Apellido o Correo..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-xs"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-xs"
        >
          Buscar
        </button>
      </form>

      {/* Tabla de Pacientes */}
      <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sky-50/60 text-slate-700 font-semibold uppercase tracking-wider border-b border-sky-100">
              <tr>
                <th className="py-3 px-4">Identificador (RUT)</th>
                <th className="py-3 px-4">Nombre Completo</th>
                <th className="py-3 px-4">F. Nacimiento</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Contacto Emergencia</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex items-center gap-2 text-blue-600">
                        <div className="w-4 h-4 rounded-full border-2 border-sky-200 border-t-blue-600 animate-spin"></div>
                        <span className="text-xs font-semibold text-slate-900">Estamos trabajando para su comodidad y salud</span>
                      </div>
                      <span className="text-[11px] text-sky-700 font-mono">Sincronizando directorio y fichas de pacientes...</span>
                    </div>
                  </td>
                </tr>
              ) : patients.length > 0 ? (
                patients.map((pat) => (
                  <tr key={pat.id} className="hover:bg-sky-50/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{pat.nationalId}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{pat.firstName} {pat.lastName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(pat.birthDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800">{pat.phone}</div>
                      <div className="text-slate-500 text-[11px]">{pat.email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{pat.emergencyContact || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`/atencion-clinica?patientId=${pat.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-blue-700 border border-sky-200 transition text-xs font-semibold"
                      >
                        Ver Historial
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No se encontraron pacientes para la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Paciente */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-sky-100 rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Registrar Nuevo Paciente</h3>
            <p className="text-xs text-slate-500 mb-4">Ingreso de ficha ambulatoria oficial</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">RUT / Identificador</label>
                  <input
                    type="text"
                    required
                    placeholder="15420312-K"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Género</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  >
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMENINO">Femenino</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombres</label>
                  <input
                    type="text"
                    required
                    placeholder="Carlos Alberto"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Apellidos</label>
                  <input
                    type="text"
                    required
                    placeholder="Mendoza Peña"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    required
                    placeholder="+56 9 8765 4321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="carlos.mendoza@ejemplo.cl"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección Particular</label>
                <input
                  type="text"
                  placeholder="Av. Providencia 1240, Dpto 502"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contacto de Emergencia</label>
                <input
                  type="text"
                  placeholder="Patricia Peña (Madre) +56 9 1111 2222"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
                >
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
