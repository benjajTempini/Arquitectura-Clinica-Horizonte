import React, { useEffect, useState } from 'react';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Nombre */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white block">Clínica Horizonte</span>
                <span className="text-xs text-teal-400 block -mt-1 font-mono">Salud & Gestión Integral</span>
              </div>
            </a>
          </div>

          {/* Menú de Navegación Principal */}
          <div className="hidden md:flex items-center space-x-1">
            <a href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
              Dashboard
            </a>
            <a href="/agenda" className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
              Agenda & Citas
            </a>
            <a href="/pacientes" className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
              Pacientes
            </a>
            <a href="/atencion-clinica" className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
              Atención Médica
            </a>
            <a href="/pagos" className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
              Pagos & Caja
            </a>
            <a href="/auditoria" className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">
              Auditoría & Soporte
            </a>
          </div>

          {/* Sesión de Usuario */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-sm font-semibold text-slate-100 block">{user.firstName} {user.lastName}</span>
                  <span className="text-xs text-teal-400 font-mono block">
                    {user.roles?.[0] || 'Personal'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 border border-slate-700 hover:border-red-500/30 rounded-lg transition"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition"
              >
                Acceso Personal
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
