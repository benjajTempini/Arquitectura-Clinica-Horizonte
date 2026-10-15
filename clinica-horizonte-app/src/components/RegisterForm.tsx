import React, { useState, useEffect } from 'react';
import { authService } from '../services/api';
import {
  cleanRut,
  formatRut,
  validateChileanRut,
  validatePersonName,
} from '../utils/rut.util';

export default function RegisterForm() {
  const [nationalId, setNationalId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [rutError, setRutError] = useState<string | null>(null);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState('/reservar-hora');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const red = params.get('redirect');
    if (red) {
      setRedirectPath(red);
    }
  }, []);

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9kK.-]/g, '');
    setNationalId(raw);
    if (rutError) setRutError(null);
  };

  const handleRutBlur = () => {
    const trimmed = nationalId.trim();
    if (!trimmed) return;
    const clean = cleanRut(trimmed);
    let candidate = trimmed;
    if (clean.length >= 7 && clean.length <= 9 && !trimmed.includes('.')) {
      candidate = formatRut(clean);
      setNationalId(candidate);
    }
    const val = validateChileanRut(candidate);
    if (!val.valid) {
      setRutError(val.error || 'RUT inválido');
    } else {
      setRutError(null);
    }
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/\d/.test(val)) {
      setFirstNameError('El nombre no puede contener números.');
      setFirstName(val.replace(/\d/g, ''));
      return;
    }
    setFirstName(val);
    if (firstNameError) setFirstNameError(null);
  };

  const handleFirstNameBlur = () => {
    if (!firstName.trim()) return;
    const val = validatePersonName(firstName);
    if (!val.valid) {
      setFirstNameError(val.error || 'Nombre inválido');
    } else {
      setFirstNameError(null);
    }
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/\d/.test(val)) {
      setLastNameError('Los apellidos no pueden contener números.');
      setLastName(val.replace(/\d/g, ''));
      return;
    }
    setLastName(val);
    if (lastNameError) setLastNameError(null);
  };

  const handleLastNameBlur = () => {
    if (!lastName.trim()) return;
    const val = validatePersonName(lastName);
    if (!val.valid) {
      setLastNameError(val.error || 'Apellido inválido');
    } else {
      setLastNameError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRutError(null);
    setFirstNameError(null);
    setLastNameError(null);
    setPhoneError(null);
    setPasswordError(null);

    // 1. Validar RUT
    let rutToValidate = nationalId.trim();
    const clean = cleanRut(rutToValidate);
    if (clean.length >= 7 && clean.length <= 9 && !rutToValidate.includes('.')) {
      rutToValidate = formatRut(clean);
      setNationalId(rutToValidate);
    }
    const rutVal = validateChileanRut(rutToValidate);
    if (!rutVal.valid) {
      setRutError(rutVal.error || 'RUT inválido.');
      return;
    }

    // 2. Validar Nombres y Apellidos
    const fnVal = validatePersonName(firstName);
    if (!fnVal.valid) {
      setFirstNameError(fnVal.error || 'Nombre inválido (sin números).');
      return;
    }
    const lnVal = validatePersonName(lastName);
    if (!lnVal.valid) {
      setLastNameError(lnVal.error || 'Apellido inválido (sin números).');
      return;
    }

    // 3. Validar Teléfono
    if (!phone.trim() || phone.trim().length < 8) {
      setPhoneError('Por favor ingrese un número de teléfono válido (ej: +56 9 8765 4321).');
      return;
    }

    // 4. Validar Contraseñas
    if (!password || password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.register({
        nationalId: rutToValidate,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
      });

      if (res.accessToken) {
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('user', JSON.stringify(res.user));
        window.location.href = redirectPath;
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta. Por favor verifique los datos.');
    } finally {
      setLoading(false);
    }
  };

  const loginLink = `/login${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`;

  return (
    <div className="max-w-xl w-full mx-auto bg-white dark:bg-[#0c221e] border border-sky-100 dark:border-teal-800/80 rounded-2xl p-6 sm:p-8 shadow-xl shadow-sky-950/5">
      <div className="text-center mb-6">
        <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-teal-400 uppercase tracking-wider block mb-1">
          Portal de Pacientes — Mi Salud
        </span>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Crear Cuenta de Paciente
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Regístrate para reservar citas, acceder a tus órdenes médicas y gestionar tu historial.
        </p>
      </div>

      {loading && (
        <div className="mb-5 p-3.5 rounded-xl bg-sky-50 dark:bg-teal-950/60 border border-sky-200 dark:border-teal-800 text-sky-800 dark:text-teal-200 text-xs flex items-center gap-3 animate-fadeIn">
          <div className="relative w-7 h-7 rounded-lg bg-sky-100 dark:bg-teal-900/60 text-blue-600 dark:text-teal-300 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Estamos trabajando para su comodidad y salud</p>
            <p className="text-[11px] text-sky-700 dark:text-teal-400 font-mono">Registrando tu cuenta y vinculando tu ficha médica segura...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* RUT */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            RUT Titular *
          </label>
          <input
            type="text"
            required
            placeholder="12.345.678-5"
            value={nationalId}
            onChange={handleRutChange}
            onBlur={handleRutBlur}
            className={`w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#071311] border text-slate-900 dark:text-slate-100 text-xs font-mono transition focus:bg-white dark:focus:bg-[#0c221e] focus:outline-none ${
              rutError
                ? 'border-red-500 bg-red-50/30'
                : 'border-slate-200 dark:border-teal-800/80 focus:border-blue-500'
            }`}
          />
          {rutError && (
            <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">{rutError}</p>
          )}
        </div>

        {/* Nombres y Apellidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombres *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Sofía Andrea"
              value={firstName}
              onChange={handleFirstNameChange}
              onBlur={handleFirstNameBlur}
              className={`w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#071311] border text-slate-900 dark:text-slate-100 text-xs transition focus:bg-white dark:focus:bg-[#0c221e] focus:outline-none ${
                firstNameError
                  ? 'border-red-500 bg-red-50/30'
                  : 'border-slate-200 dark:border-teal-800/80 focus:border-blue-500'
              }`}
            />
            {firstNameError && (
              <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">{firstNameError}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Apellidos *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Contreras Díaz"
              value={lastName}
              onChange={handleLastNameChange}
              onBlur={handleLastNameBlur}
              className={`w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#071311] border text-slate-900 dark:text-slate-100 text-xs transition focus:bg-white dark:focus:bg-[#0c221e] focus:outline-none ${
                lastNameError
                  ? 'border-red-500 bg-red-50/30'
                  : 'border-slate-200 dark:border-teal-800/80 focus:border-blue-500'
              }`}
            />
            {lastNameError && (
              <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">{lastNameError}</p>
            )}
          </div>
        </div>

        {/* Correo y Teléfono */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              required
              placeholder="tu.correo@ejemplo.cl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#071311] border border-slate-200 dark:border-teal-800/80 text-slate-900 dark:text-slate-100 text-xs transition focus:bg-white dark:focus:bg-[#0c221e] focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Teléfono Móvil *
            </label>
            <input
              type="tel"
              required
              placeholder="+56 9 8765 4321"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (phoneError) setPhoneError(null);
              }}
              className={`w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#071311] border text-slate-900 dark:text-slate-100 text-xs font-mono transition focus:bg-white dark:focus:bg-[#0c221e] focus:outline-none ${
                phoneError
                  ? 'border-red-500 bg-red-50/30'
                  : 'border-slate-200 dark:border-teal-800/80 focus:border-blue-500'
              }`}
            />
            {phoneError && (
              <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">{phoneError}</p>
            )}
          </div>
        </div>

        {/* Contraseña y Confirmación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contraseña *
            </label>
            <input
              type="password"
              required
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#071311] border border-slate-200 dark:border-teal-800/80 text-slate-900 dark:text-slate-100 text-xs transition focus:bg-white dark:focus:bg-[#0c221e] focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirmar Contraseña *
            </label>
            <input
              type="password"
              required
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#071311] border border-slate-200 dark:border-teal-800/80 text-slate-900 dark:text-slate-100 text-xs transition focus:bg-white dark:focus:bg-[#0c221e] focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {passwordError && (
          <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{passwordError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
              <span>Registrando y Conectando...</span>
            </>
          ) : (
            'Crear Cuenta y Continuar'
          )}
        </button>
      </form>

      {/* Enlace para volver a iniciar sesión */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-teal-900/60 text-center">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          ¿Ya tienes una cuenta creada?{' '}
          <a
            href={loginLink}
            className="text-blue-600 dark:text-teal-400 hover:underline font-semibold"
          >
            Inicia Sesión aquí
          </a>
        </p>
      </div>
    </div>
  );
}

