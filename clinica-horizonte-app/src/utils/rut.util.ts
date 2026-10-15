/**
 * Utilidades para validación y formateo de RUT chileno y datos personales en el Frontend.
 * Formato oficial requerido: [uno o dos dígitos].[tres dígitos].[tres dígitos]-[dígito verificador 0-9 o K]
 * Ejemplo: 12.345.678-5 o 9.876.543-K
 */

export function cleanRut(rut: string): string {
  if (!rut || typeof rut !== 'string') return '';
  return rut.replace(/[^0-9kK]/g, '').toUpperCase().trim();
}

/**
 * Formatea un RUT con puntos y guion: XX.XXX.XXX-Y o X.XXX.XXX-Y
 */
export function formatRut(rut: string): string {
  const clean = cleanRut(rut);
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${dv}`;
}

/**
 * Valida que el string cumpla exactamente la estructura requerida:
 * [uno o dos digitos][punto][3 digitos][punto][3 digitos][guion][numero del 0-9+k]
 */
export function isValidRutPattern(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^(\d{1,2})\.(\d{3})\.(\d{3})-([\dkK])$/.test(value.trim());
}

/**
 * Valida el cuerpo numérico y longitud (7 u 8 dígitos de cuerpo más 1 dígito verificador)
 */
export function isValidRutFormat(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const clean = cleanRut(value);
  return /^\d{7,8}[0-9K]$/.test(clean);
}

/**
 * Calcula el dígito verificador con el algoritmo Módulo 11
 */
export function calculateRutDv(body: string): string {
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const rem = 11 - (sum % 11);
  if (rem === 11) return '0';
  if (rem === 10) return 'K';
  return rem.toString();
}

/**
 * Comprueba si el dígito verificador es matemáticamente correcto
 */
export function isValidRutDv(rut: string): boolean {
  const clean = cleanRut(rut);
  if (!isValidRutFormat(clean)) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return calculateRutDv(body) === dv;
}

/**
 * Validación completa y estricta de RUT chileno:
 * 1. Formato requerido: [1 o 2 dígitos].[3 dígitos].[3 dígitos]-[0-9 o K]
 * 2. Dígito verificador módulo 11 matemáticamente válido.
 */
export function validateChileanRut(rut: string): { valid: boolean; error?: string } {
  if (!rut || !rut.trim()) {
    return { valid: false, error: 'El RUT es obligatorio.' };
  }

  const trimmed = rut.trim();

  // Rechaza formatos inválidos como 11.111111.11111-2 o RUTs sin puntos/guion
  if (!isValidRutPattern(trimmed)) {
    return {
      valid: false,
      error: 'El formato del RUT debe ser [uno o dos dígitos].[3 dígitos].[3 dígitos]-[0-9 o K] (ej: 12.345.678-5 o 9.876.543-K).',
    };
  }

  const clean = cleanRut(trimmed);
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);

  if (calculateRutDv(body) !== dv) {
    return {
      valid: false,
      error: 'El dígito verificador del RUT es incorrecto.',
    };
  }

  return { valid: true };
}

/**
 * Valida nombres de personas:
 * - No permite números bajo ninguna circunstancia.
 * - Solo acepta letras (incluyendo tildes y eñes), espacios y apóstrofes.
 * - Longitud entre 2 y 100 caracteres.
 */
export function validatePersonName(name: string): { valid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: 'El nombre es obligatorio.' };
  }

  const trimmed = name.trim();

  if (/\d/.test(trimmed)) {
    return { valid: false, error: 'El nombre no puede contener números.' };
  }

  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(trimmed)) {
    return { valid: false, error: 'El nombre solo puede contener letras y espacios (sin números ni caracteres especiales).' };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: 'El nombre debe tener al menos 2 caracteres.' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'El nombre no puede superar los 100 caracteres.' };
  }

  return { valid: true };
}

/**
 * Validador para compatibilidad con identificadores generales
 */
export function isValidNationalId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (trimmed.includes('.') || trimmed.includes('-') || /^\d+[0-9kK]$/i.test(trimmed)) {
    const clean = cleanRut(trimmed);
    if (!isValidRutFormat(clean)) return false;
    return isValidRutDv(clean);
  }
  return /^[A-Za-z0-9-]{5,20}$/.test(trimmed);
}
