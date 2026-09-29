import React, { useEffect, useState } from 'react';

interface StoredUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export default function Navbar() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined' && (window as any).ClinicalLoader) {
      (window as any).ClinicalLoader.start('Cerrando sesión de forma segura...');
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  // Determinar rol principal y etiqueta amigable
  const roles = user?.roles || [];
  const isAdmin = roles.includes('ADMIN');
  const isDoctor = roles.includes('DOCTOR') || roles.includes('NURSE');
  const isReceptionist = roles.includes('RECEPTIONIST') || roles.includes('ADMINISTRATIVE');
  const isSupport = roles.includes('EXTERNAL_SUPPORT');
  const isPatient = roles.includes('PATIENT');

  const getRoleBadge = () => {
    if (isAdmin) {
      return { label: 'Administrador General', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
    }
    if (isDoctor) {
      return { label: 'Médico Tratante', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' };
    }
    if (isReceptionist) {
      return { label: 'Recepción & Caja', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
    }
    if (isSupport) {
      return { label: 'Soporte Externo', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    }
    if (isPatient) {
      return { label: 'Paciente', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    }
    return { label: roles[0] || 'Personal', color: 'bg-slate-800 text-slate-300 border-slate-700' };
  };

  const badge = getRoleBadge();

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-lg backdrop-blur-md">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16">
          
          {/* Logotipo e Identidad */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white block">Clínica Horizonte</span>
                <span className="text-[11px] text-teal-400 block -mt-1 font-mono">Salud & Gestión Integral</span>
              </div>
            </a>
          </div>

          {/* NAVEGACIÓN DESKTOP: SEGÚN ESTADO DE AUTENTICACIÓN */}
          <div className="hidden lg:flex items-center space-x-1">
            {!user ? (
              /* Menú Público para Pacientes y Visitantes */
              <>
                <a href="/" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                  Inicio
                </a>
                <a href="/#especialidades" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                  Especialidades
                </a>
                <a href="/reservar-hora" className="px-3 py-2 rounded-lg text-xs font-medium text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 transition flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Reservar Hora</span>
                </a>
                <a href="/consultar-cita" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                  Consultar Cita
                </a>
                <a href="/#convenios" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                  Convenios Fonasa / Isapre
                </a>
                <a href="/#contacto" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                  Ubicación & Contacto
                </a>
              </>
            ) : (
              /* Menú Privado Segmentado por Rol de Funcionario */
              <>
                {/* 1. Módulos para ADMINISTRADOR GENERAL (Total) */}
                {isAdmin && (
                  <>
                    <a href="/dashboard" className="px-3 py-2 rounded-lg text-xs font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition">
                      Dashboard General
                    </a>
                    <a href="/agenda" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                      Agenda & Citas
                    </a>
                    <a href="/pacientes" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                      Pacientes
                    </a>
                    <a href="/atencion-clinica" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                      Atención Médica
                    </a>
                    <a href="/pagos" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                      Caja & Pagos
                    </a>
                    <a href="/auditoria" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                      Auditoría Sanitaria
                    </a>
                  </>
                )}

                {/* 2. Módulos para MÉDICO / ENFERMERÍA */}
                {isDoctor && !isAdmin && (
                  <>
                    <a href="/dashboard" className="px-3 py-2 rounded-lg text-xs font-medium text-teal-300 bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition">
                      Dashboard Clínico
                    </a>
                    <a href="/agenda" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                      Mi Agenda
                    </a>
                    <a href="/atencion-clinica" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                      Ficha & Atención CIE-10
                    </a>
                    <a href="/pacientes" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                      Directorio Pacientes
                    </a>
                  </>
                )}

                {/* 3. Módulos para RECEPCIÓN Y ADMISIÓN */}
                {isReceptionist && !isAdmin && (
                  <>
                    <a href="/dashboard" className="px-3 py-2 rounded-lg text-xs font-medium text-blue-300 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition">
                      Dashboard Recepción
                    </a>
                    <a href="/agenda" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                      Agenda & Turnos
                    </a>
                    <a href="/pacientes" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                      Admisión Pacientes
                    </a>
                    <a href="/pagos" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                      Caja & Bonos Fonasa/Isapre
                    </a>
                  </>
                )}

                {/* 4. Módulos para SOPORTE EXTERNO */}
                {isSupport && !isAdmin && (
                  <>
                    <a href="/dashboard" className="px-3 py-2 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition">
                      Dashboard Soporte
                    </a>
                    <a href="/auditoria" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                      Auditoría y Trazabilidad
                    </a>
                  </>
                )}

                {/* 5. Módulos para PACIENTE (Portal Mi Salud) */}
                {isPatient && !isAdmin && (
                  <>
                    <a href="/dashboard" className="px-3 py-2 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Portal Mi Salud</span>
                    </a>
                    <a href="/reservar-hora" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
                      Reservar Cita
                    </a>
                  </>
                )}

                {/* Enlace para volver a la vista del paciente sin deslogearse */}
                <a
                  href="/"
                  title="Ver portal público de pacientes"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition ml-2 border border-slate-800"
                >
                  Ver Web Pública
                </a>
              </>
            )}
          </div>

          {/* SECCIÓN DERECHA: SESIÓN O ACCESO */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-semibold text-slate-100 block">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border inline-block mt-0.5 ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 border border-slate-700 hover:border-red-500/30 rounded-lg transition"
                >
                  Salir
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-md transition flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Acceso Funcionarios</span>
              </a>
            )}

            {/* Botón de Menú Móvil */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              aria-label="Abrir menú"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* MENÚ MÓVIL DESPLEGABLE */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-800 space-y-2 bg-slate-900/95">
            {!user ? (
              <div className="space-y-1 px-2">
                <a href="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
                  Inicio
                </a>
                <a href="/#especialidades" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
                  Especialidades Médicas
                </a>
                <a href="/reservar-hora" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-teal-400 hover:bg-slate-800">
                  Reservar Hora Médica
                </a>
                <a href="/consultar-cita" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
                  Consultar Cita
                </a>
                <a href="/#convenios" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
                  Convenios Fonasa / Isapre
                </a>
                <a href="/#contacto" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
                  Contacto & Urgencias
                </a>
              </div>
            ) : (
              <div className="space-y-1 px-2">
                <div className="px-3 py-2 mb-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-xs font-bold text-white block">{user.firstName} {user.lastName}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border inline-block mt-1 ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                <a href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-teal-400 hover:bg-slate-800">
                  Mi Dashboard
                </a>

                {isAdmin && (
                  <>
                    <a href="/agenda" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">Agenda & Citas</a>
                    <a href="/pacientes" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">Pacientes</a>
                    <a href="/atencion-clinica" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">Atención Médica</a>
                    <a href="/pagos" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">Caja & Pagos</a>
                    <a href="/auditoria" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">Auditoría Sanitaria</a>
                  </>
                )}

                {isDoctor && !isAdmin && (
                  <>
                    <a href="/agenda" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">Mi Agenda de Consultas</a>
                    <a href="/atencion-clinica" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">Ficha Médica & CIE-10</a>
                    <a href="/pacientes" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">Directorio Pacientes</a>
                  </>
                )}

                {isReceptionist && !isAdmin && (
                  <>
                    <a href="/agenda" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">Agenda & Turnos</a>
                    <a href="/pacientes" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">Admisión Pacientes</a>
                    <a href="/pagos" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">Caja & Bonos</a>
                  </>
                )}

                {isSupport && !isAdmin && (
                  <a href="/auditoria" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
                    Auditoría Sanitaria
                  </a>
                )}

                {isPatient && !isAdmin && (
                  <>
                    <a href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-emerald-400 font-semibold hover:bg-slate-800">
                      Portal Mi Salud
                    </a>
                    <a href="/reservar-hora" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
                      Reservar Cita Médica
                    </a>
                  </>
                )}

                <div className="pt-2 border-t border-slate-800">
                  <a href="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800">
                    Ver Web Pública Pacientes
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
