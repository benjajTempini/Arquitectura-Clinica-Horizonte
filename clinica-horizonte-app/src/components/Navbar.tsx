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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    if (typeof document !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'));
    }

    const handleThemeChange = (e: any) => {
      setIsDark(e.detail?.theme === 'dark');
    };
    window.addEventListener('clinical:theme-change', handleThemeChange);
    return () => window.removeEventListener('clinical:theme-change', handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    if (nextIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      window.dispatchEvent(new CustomEvent('clinical:theme-change', { detail: { theme: 'dark' } }));
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      window.dispatchEvent(new CustomEvent('clinical:theme-change', { detail: { theme: 'light' } }));
    }
  };

  const handleLogout = () => {
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
      return { label: 'Administrador General', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (isDoctor) {
      return { label: 'Médico Tratante', color: 'bg-sky-50 text-sky-700 border-sky-200' };
    }
    if (isReceptionist) {
      return { label: 'Recepción & Caja', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (isSupport) {
      return { label: 'Soporte Externo', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    if (isPatient) {
      return { label: 'Paciente', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    return { label: roles[0] || 'Personal', color: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  const badge = getRoleBadge();

  return (
    <nav className="bg-white/95 dark:bg-[#071916]/95 border-b border-sky-100 dark:border-teal-900/60 text-slate-800 dark:text-slate-100 sticky top-0 z-50 shadow-xs backdrop-blur-md">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16">
          
          {/* Logotipo e Identidad */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform shadow-xs">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 block">Clínica Horizonte</span>
                <span className="text-[11px] text-sky-600 font-mono block -mt-1 font-medium">Salud & Gestión Integral</span>
              </div>
            </a>
          </div>

          {/* NAVEGACIÓN DESKTOP: SEGÚN ESTADO DE AUTENTICACIÓN */}
          <div className="hidden lg:flex items-center space-x-1">
            {!user ? (
              /* Menú Público para Pacientes y Visitantes */
              <>
                <a href="/" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                  Inicio
                </a>
                <a href="/#especialidades" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                  Especialidades
                </a>
                <a href="/reservar-hora" className="px-3 py-2 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-sky-50 transition flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Reservar Hora</span>
                </a>
                <a href="/consultar-cita" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                  Consultar Cita
                </a>
                <a href="/#convenios" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                  Convenios Fonasa / Isapre
                </a>
                <a href="/#contacto" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                  Ubicación & Contacto
                </a>
              </>
            ) : (
              /* Menú Privado Segmentado por Rol de Funcionario */
              <>
                {/* 1. Módulos para ADMINISTRADOR GENERAL (Total) */}
                {isAdmin && (
                  <>
                    <a href="/dashboard" className="px-3 py-2 rounded-lg text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition">
                      Dashboard General
                    </a>
                    <a href="/medicos" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                      Gestión Médicos
                    </a>
                    <a href="/agenda" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                      Agenda & Citas
                    </a>
                    <a href="/pacientes" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                      Pacientes
                    </a>
                    <a href="/atencion-clinica" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                      Atención Médica
                    </a>
                    <a href="/pagos" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                      Caja & Pagos
                    </a>
                    <a href="/auditoria" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                      Auditoría Sanitaria
                    </a>
                  </>
                )}

                {/* 2. Módulos para MÉDICO / ENFERMERÍA */}
                {isDoctor && !isAdmin && (
                  <>
                    <a href="/dashboard" className="px-3 py-2 rounded-lg text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 transition">
                      Dashboard Clínico
                    </a>
                    <a href="/agenda" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                      Mi Agenda
                    </a>
                    <a href="/atencion-clinica" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                      Ficha & Atención CIE-10
                    </a>
                    <a href="/pacientes" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                      Directorio Pacientes
                    </a>
                  </>
                )}

                {/* 3. Módulos para RECEPCIÓN Y ADMISIÓN */}
                {isReceptionist && !isAdmin && (
                  <>
                    <a href="/dashboard" className="px-3 py-2 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition">
                      Dashboard Recepción
                    </a>
                    <a href="/agenda" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                      Agenda & Turnos
                    </a>
                    <a href="/pacientes" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                      Admisión Pacientes
                    </a>
                    <a href="/pagos" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                      Caja & Bonos Fonasa/Isapre
                    </a>
                  </>
                )}

                {/* 4. Módulos para SOPORTE EXTERNO */}
                {isSupport && !isAdmin && (
                  <>
                    <a href="/dashboard" className="px-3 py-2 rounded-lg text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition">
                      Dashboard Soporte
                    </a>
                    <a href="/auditoria" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                      Auditoría y Trazabilidad
                    </a>
                  </>
                )}

                {/* 5. Módulos para PACIENTE (Portal Mi Salud) */}
                {isPatient && !isAdmin && (
                  <>
                    <a href="/dashboard" className="px-3 py-2 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Portal Mi Salud</span>
                    </a>
                    <a href="/reservar-hora" className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-sky-50 transition">
                      Reservar Cita
                    </a>
                  </>
                )}

                {/* Enlace para volver a la vista del paciente sin deslogearse */}
                <a
                  href="/"
                  title="Ver portal público de pacientes"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition ml-2 border border-slate-200"
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
                  <span className="text-xs font-semibold text-slate-900 block">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border inline-block mt-0.5 ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg transition"
                >
                  Salir
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Acceso Funcionarios</span>
              </a>
            )}

            {/* Botón de Alternancia de Tema (Modo Claro / Modo Oscuro Teal) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={isDark ? 'Activar modo claro' : 'Activar modo oscuro (Teal nocturno)'}
              className="p-2 rounded-xl border border-slate-200 dark:border-teal-800/80 bg-slate-50 dark:bg-[#0c221e] text-slate-600 dark:text-teal-300 hover:text-teal-700 dark:hover:text-teal-200 hover:border-teal-300 dark:hover:border-teal-500 transition shadow-xs flex items-center justify-center"
            >
              {isDark ? (
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Botón de Menú Móvil */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-[#0c221e] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-transparent dark:border-teal-800/60"
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
          <div className="lg:hidden py-4 border-t border-sky-100 dark:border-teal-900/60 space-y-2 bg-white/95 dark:bg-[#071916]/95">
            {!user ? (
              <div className="space-y-1 px-2">
                <a href="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">
                  Inicio
                </a>
                <a href="/#especialidades" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">
                  Especialidades Médicas
                </a>
                <a href="/reservar-hora" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-blue-600 font-medium hover:bg-sky-50">
                  Reservar Hora Médica
                </a>
                <a href="/consultar-cita" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">
                  Consultar Cita
                </a>
                <a href="/#convenios" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">
                  Convenios Fonasa / Isapre
                </a>
                <a href="/#contacto" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">
                  Contacto & Urgencias
                </a>
              </div>
            ) : (
              <div className="space-y-1 px-2">
                <div className="px-3 py-2 mb-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs font-bold text-slate-900 block">{user.firstName} {user.lastName}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border inline-block mt-1 ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                <a href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-blue-600 font-medium hover:bg-sky-50">
                  Mi Dashboard
                </a>

                {isAdmin && (
                  <>
                    <a href="/medicos" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">Gestión Médicos</a>
                    <a href="/agenda" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">Agenda & Citas</a>
                    <a href="/pacientes" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">Pacientes</a>
                    <a href="/atencion-clinica" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">Atención Médica</a>
                    <a href="/pagos" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">Caja & Pagos</a>
                    <a href="/auditoria" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">Auditoría Sanitaria</a>
                  </>
                )}

                {isDoctor && !isAdmin && (
                  <>
                    <a href="/agenda" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">Mi Agenda de Consultas</a>
                    <a href="/atencion-clinica" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">Ficha Médica & CIE-10</a>
                    <a href="/pacientes" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">Directorio Pacientes</a>
                  </>
                )}

                {isReceptionist && !isAdmin && (
                  <>
                    <a href="/agenda" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">Agenda & Turnos</a>
                    <a href="/pacientes" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">Admisión Pacientes</a>
                    <a href="/pagos" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">Caja & Bonos</a>
                  </>
                )}

                {isSupport && !isAdmin && (
                  <a href="/auditoria" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">
                    Auditoría Sanitaria
                  </a>
                )}

                {isPatient && !isAdmin && (
                  <>
                    <a href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-emerald-700 font-semibold hover:bg-sky-50">
                      Portal Mi Salud
                    </a>
                    <a href="/reservar-hora" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-sky-50">
                      Reservar Cita Médica
                    </a>
                  </>
                )}

                <div className="pt-2 border-t border-slate-200">
                  <a href="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-100">
                    Ver Web Pública Pacientes
                  </a>
                </div>
              </div>
            )}

            {/* Alternar Tema en Menú Móvil */}
            <div className="pt-2 px-2 border-t border-slate-200 dark:border-teal-900/60">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-teal-200 bg-slate-50 dark:bg-[#0c221e] border border-slate-200 dark:border-teal-800/80 hover:bg-slate-100 dark:hover:bg-[#122e29] transition"
              >
                <span className="flex items-center gap-2">
                  {isDark ? (
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                  <span>{isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro (Teal)'}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-teal-500/40 text-teal-600 dark:text-teal-400">
                  {isDark ? 'Oscuro' : 'Claro'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
