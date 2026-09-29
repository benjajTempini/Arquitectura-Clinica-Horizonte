import React, { useState } from 'react';
import { authService } from '../services/api';

const DEMO_ACCOUNTS = [
  { role: 'Paciente (Portal Mi Salud)', email: 'paciente.demo@clinicahorizonte.cl', pass: 'Clinica2026!' },
  { role: 'Dr. Morales (Médico)', email: 'dr.morales@clinicahorizonte.cl', pass: 'Clinica2026!' },
  { role: 'Recepción & Caja', email: 'recepcion@clinicahorizonte.cl', pass: 'Clinica2026!' },
  { role: 'Administrador General', email: 'admin@clinicahorizonte.cl', pass: 'Clinica2026!' },
  { role: 'Soporte Externo', email: 'soporte.ext@clinicahorizonte.cl', pass: 'Clinica2026!' },
];

export default function LoginForm() {
  const [email, setEmail] = useState('paciente.demo@clinicahorizonte.cl');
  const [password, setPassword] = useState('Clinica2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === 'true') {
      setInfoMessage('Tu sesión ha expirado o necesitas identificarte para continuar.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await authService.login({ email, password });
      if (res.accessToken) {
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('user', JSON.stringify(res.user));
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/dashboard';
        window.location.href = redirect;
      }
    } catch (err: any) {
      setError(err.message || 'Error al autenticar. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.pass);
  };

  return (
    <div className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Portal de Acceso</h2>
        <p className="text-sm text-slate-400 mt-1">Clínica Horizonte — Pacientes (Mi Salud) y Funcionarios</p>
      </div>

      {infoMessage && (
        <div className="mb-5 p-3 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>{infoMessage}</span>
        </div>
      )}

      {loading && (
        <div className="mb-5 p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-3 animate-fadeIn">
          <div className="relative w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 animate-pulse text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-white">Estamos trabajando para su comodidad y salud</p>
            <p className="text-[11px] text-teal-300/80 font-mono">Autenticando credenciales de acceso seguro...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            placeholder="usuario@clinicahorizonte.cl"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-medium text-sm transition shadow-lg shadow-teal-900/30 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
              <span>Validando credenciales...</span>
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-800">
        <span className="text-xs font-semibold text-slate-400 block mb-3 uppercase tracking-wider">
          Cuentas Rápidas de Prueba (Sintéticas):
        </span>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={() => selectDemoAccount(acc)}
              className="text-left p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 hover:text-white transition"
            >
              <div className="font-semibold text-teal-400">{acc.role}</div>
              <div className="truncate text-slate-400">{acc.email.split('@')[0]}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
