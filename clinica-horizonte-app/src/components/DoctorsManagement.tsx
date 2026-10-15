import React, { useState, useEffect } from 'react';
import { professionalsService, specialtiesService } from '../services/api';
import { validatePersonName } from '../utils/rut.util';

interface Specialty {
  id: string;
  name: string;
  code: string;
}

interface Professional {
  id: string;
  licenseNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  specialties?: Array<{ specialty: Specialty }>;
  schedules?: Array<{ boxNumber?: string; dayOfWeek: number; startTime: string; endTime: string }>;
}

export default function DoctorsManagement() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal de Incorporación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    licenseNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialtyId: '',
    box: 'Box 101 — Ambulatorio',
    password: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal de Confirmación de Desvinculación
  const [doctorToDeactivate, setDoctorToDeactivate] = useState<Professional | null>(null);
  const [doctorToReactivate, setDoctorToReactivate] = useState<Professional | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profs, specs] = await Promise.all([
        professionalsService.list(true), // includeInactive = true
        specialtiesService.list(),
      ]);
      setProfessionals(profs);
      setSpecialties(specs);
      if (specs.length > 0 && !formData.specialtyId) {
        setFormData((prev) => ({ ...prev, specialtyId: specs[0].id }));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (field: 'firstName' | 'lastName', val: string) => {
    // Bloquear números inmediatamente
    const clean = val.replace(/\d/g, '');
    setFormData((prev) => ({ ...prev, [field]: clean }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Validar Nombres
    const fnVal = validatePersonName(formData.firstName);
    if (!fnVal.valid) {
      setFormError(fnVal.error || 'Nombre inválido.');
      return;
    }
    const lnVal = validatePersonName(formData.lastName);
    if (!lnVal.valid) {
      setFormError(lnVal.error || 'Apellido inválido.');
      return;
    }

    // 2. Validar Registro de Superintendencia
    if (!formData.licenseNumber.trim() || formData.licenseNumber.trim().length < 4) {
      setFormError('El número de registro de la Superintendencia debe tener al menos 4 caracteres.');
      return;
    }

    // 3. Validar Especialidad
    if (!formData.specialtyId) {
      setFormError('Por favor selecciona una especialidad médica.');
      return;
    }

    setIsSubmitting(true);
    try {
      await professionalsService.create({
        licenseNumber: formData.licenseNumber.trim().toUpperCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        specialtyId: formData.specialtyId,
        box: formData.box.trim(),
        password: formData.password.trim() || 'Clinica2026!',
      });

      setNotification({
        message: `Dr(a). ${formData.firstName} ${formData.lastName} incorporado(a) exitosamente al equipo médico.`,
        type: 'success',
      });
      setIsCreateModalOpen(false);
      setFormData({
        licenseNumber: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        specialtyId: specialties[0]?.id || '',
        box: 'Box 101 — Ambulatorio',
        password: '',
      });
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error al incorporar al profesional.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (doctor: Professional, newStatus: boolean) => {
    setActionLoading(true);
    try {
      const res = await professionalsService.updateStatus(doctor.id, newStatus);
      setNotification({
        message: res.message || (newStatus ? 'Médico reactivado.' : 'Médico desvinculado e inactivado.'),
        type: 'success',
      });
      setDoctorToDeactivate(null);
      setDoctorToReactivate(null);
      loadData();
    } catch (err: any) {
      setNotification({
        message: err.message || 'Error al modificar el estado del médico.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredProfessionals = professionals.filter((p) => {
    const matchesSearch =
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.specialties?.some((s) => s.specialty?.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? p.isActive
        : !p.isActive;

    return matchesSearch && matchesStatus;
  });

  const activeCount = professionals.filter((p) => p.isActive).length;
  const inactiveCount = professionals.filter((p) => !p.isActive).length;

  return (
    <div className="max-w-[1650px] mx-auto space-y-6 animate-fadeIn py-2">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-teal-900/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-mono font-semibold">
              Módulo de Gobernanza Sanitaria — Exclusivo Administrador
            </span>
            <span className="text-slate-500 text-xs font-mono">Ley N° 20.584 & Superintendencia</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gestión de Personal Médico y Facultativos
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Incorporación de nuevos médicos con credenciales, asignación de box y desvinculación con preservación legal de ficha clínica.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Incorporar Nuevo Médico</span>
          </button>
        </div>
      </div>

      {/* Notificación Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs font-semibold hover:underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Métricas de Facultativos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c221e] border border-sky-100 dark:border-teal-800/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Cuerpo Médico Total
          </span>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono mt-2 block">
            {professionals.length}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Profesionales registrados institucionalmente</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c221e] border border-sky-100 dark:border-teal-800/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Médicos Activos (En Consulta)
          </span>
          <span className="text-3xl font-extrabold text-emerald-600 dark:text-teal-400 font-mono mt-2 block">
            {activeCount}
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-teal-400 block mt-0.5">Disponibles para reserva y atención</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c221e] border border-sky-100 dark:border-teal-800/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Desvinculados / Inactivos
          </span>
          <span className="text-3xl font-extrabold text-slate-500 dark:text-slate-400 font-mono mt-2 block">
            {inactiveCount}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Acceso revocado • Historial preservado</span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0c221e] border border-sky-100 dark:border-teal-800/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[260px] max-w-md relative">
          <input
            type="text"
            placeholder="Buscar por médico, registro Superintendencia, correo o especialidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#071311] border border-slate-200 dark:border-teal-800/80 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-[#0c221e] focus:outline-none focus:border-blue-500 transition"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#071311] rounded-xl border border-slate-200 dark:border-teal-900 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-[#0c221e] text-blue-600 dark:text-teal-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Todos ({professionals.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'ACTIVE'
                ? 'bg-white dark:bg-[#0c221e] text-emerald-600 dark:text-teal-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Activos ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'INACTIVE'
                ? 'bg-white dark:bg-[#0c221e] text-slate-700 dark:text-slate-200 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Desvinculados ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Tabla de Médicos */}
      <div className="bg-white dark:bg-[#0c221e] border border-sky-100 dark:border-teal-800/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#071311] border-b border-slate-200 dark:border-teal-900 text-slate-500 uppercase tracking-wider font-mono text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Facultativo</th>
                <th className="px-5 py-3.5">Reg. Superintendencia</th>
                <th className="px-5 py-3.5">Especialidad</th>
                <th className="px-5 py-3.5">Box Asignado</th>
                <th className="px-5 py-3.5">Contacto</th>
                <th className="px-5 py-3.5 text-center">Estado</th>
                <th className="px-5 py-3.5 text-right">Acción Sanitaria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-teal-900/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Estamos trabajando para su comodidad y salud. Consultando nómina médica...
                  </td>
                </tr>
              ) : filteredProfessionals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No se encontraron profesionales de salud con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredProfessionals.map((prof) => {
                  const specNames =
                    prof.specialties?.map((s) => s.specialty?.name).filter(Boolean).join(', ') ||
                    'Medicina General';
                  const box = prof.schedules?.[0]?.boxNumber || 'Box Ambulatorio';

                  return (
                    <tr
                      key={prof.id}
                      className={`hover:bg-sky-50/40 dark:hover:bg-teal-950/30 transition ${
                        !prof.isActive ? 'bg-slate-50/50 dark:bg-[#071311]/50 opacity-75' : ''
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              prof.isActive
                                ? 'bg-blue-100 dark:bg-teal-900 text-blue-700 dark:text-teal-300'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                            }`}
                          >
                            Dr
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              Dr(a). {prof.firstName} {prof.lastName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ID: {prof.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {prof.licenseNumber}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-300">
                        {specNames}
                      </td>

                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {box}
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-slate-700 dark:text-slate-300 block">{prof.email}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{prof.phone}</span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        {prof.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Activo en Box</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            <span>Desvinculado</span>
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {prof.isActive ? (
                          <button
                            type="button"
                            onClick={() => setDoctorToDeactivate(prof)}
                            className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-semibold transition shadow-xs"
                          >
                            Desvincular
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDoctorToReactivate(prof)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-teal-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-teal-300 border border-emerald-200 dark:border-teal-800 text-xs font-semibold transition shadow-xs"
                          >
                            Reincorporar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Incorporar Nuevo Médico */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c221e] border border-sky-100 dark:border-teal-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-teal-900">
              <div>
                <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-teal-400 uppercase tracking-wider block">
                  Alta Administrativa de Facultativo
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Incorporar Nuevo Médico
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#071311] text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Rodrigo Andrés"
                    value={formData.firstName}
                    onChange={(e) => handleNameChange('firstName', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#071311] border border-slate-200 dark:border-teal-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Aravena Carrasco"
                    value={formData.lastName}
                    onChange={(e) => handleNameChange('lastName', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#071311] border border-slate-200 dark:border-teal-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reg. Superintendencia Salud *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: MED-10492"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#071311] border border-slate-200 dark:border-teal-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Especialidad Asignada *
                  </label>
                  <select
                    required
                    value={formData.specialtyId}
                    onChange={(e) => setFormData({ ...formData, specialtyId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#071311] border border-slate-200 dark:border-teal-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    {specialties.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="dr.apellido@clinicahorizonte.cl"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#071311] border border-slate-200 dark:border-teal-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono Móvil *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+56 9 7654 3210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#071311] border border-slate-200 dark:border-teal-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Box de Consulta Asignado
                  </label>
                  <input
                    type="text"
                    placeholder="Box 101 — Ambulatorio"
                    value={formData.box}
                    onChange={(e) => setFormData({ ...formData, box: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#071311] border border-slate-200 dark:border-teal-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contraseña Inicial (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Por defecto: Clinica2026!"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#071311] border border-slate-200 dark:border-teal-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold shadow-md transition"
                >
                  {isSubmitting ? 'Incorporando...' : 'Confirmar Alta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmación de Desvinculación */}
      {doctorToDeactivate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0c221e] border border-red-200 dark:border-red-900 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                ¿Desvincular a Dr(a). {doctorToDeactivate.firstName} {doctorToDeactivate.lastName}?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Esta acción <strong>revocará de inmediato su acceso al sistema y lo retirará de las agendas de reserva pública</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <span className="font-bold">Ley N° 20.584:</span>
              <span>El historial clínico previo, diagnósticos y atenciones firmadas por este facultativo se conservarán intactos e inmutables por exigencia legal sanitaria.</span>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDoctorToDeactivate(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleToggleStatus(doctorToDeactivate, false)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-semibold shadow-md transition"
              >
                {actionLoading ? 'Procesando...' : 'Confirmar Desvinculación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmación de Reincorporación */}
      {doctorToReactivate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0c221e] border border-emerald-200 dark:border-teal-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-teal-900/60 text-emerald-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                ¿Reincorporar a Dr(a). {doctorToReactivate.firstName} {doctorToReactivate.lastName}?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                El facultativo volverá a tener acceso activo a su agenda clínica y estará disponible para agendamiento de pacientes.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDoctorToReactivate(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleToggleStatus(doctorToReactivate, true)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold shadow-md transition"
              >
                {actionLoading ? 'Reincorporando...' : 'Confirmar Reincorporación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

