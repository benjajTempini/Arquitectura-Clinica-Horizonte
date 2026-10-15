/**
 * Utilidades para validación y normalización de RUT (Rol Único Tributario) chileno
 * y documentos oficiales de identidad para pacientes y profesionales.
 */

export function cleanRut(rut: string): string {
  if (!rut || typeof rut !== 'string') return '';
  return rut.replace(/[^0-9kK]/g, '').toUpperCase().trim();
}

export function formatRut(rut: string): string {
  const clean = cleanRut(rut);
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return `${body}-${dv}`;
}

export function isValidRutPattern(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^(\d{1,2})\.(\d{3})\.(\d{3})-([\dkK])$/.test(value.trim());
}

export function isValidRutFormat(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const clean = cleanRut(value);
  // Un RUT chileno estándar tiene entre 7 y 8 dígitos de cuerpo más 1 dígito verificador
  return /^\d{7,8}[0-9K]$/.test(clean);
}

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

export function isValidRutDv(rut: string): boolean {
  if (!isValidRutFormat(rut)) return false;
  const clean = cleanRut(rut);
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return calculateRutDv(body) === dv;
}

export function isValidNationalId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  // Si contiene puntos o guión o parece un RUT chileno
  if (trimmed.includes('.') || trimmed.includes('-') || /^\d+[0-9kK]$/i.test(trimmed)) {
    // Si incluye puntos, debe cumplir exactamente el formato [1 o 2 dígitos].[3 dígitos].[3 dígitos]-[0-9 o K]
    if (trimmed.includes('.') && !isValidRutPattern(trimmed)) {
      return false;
    }
    const clean = cleanRut(trimmed);
    if (!isValidRutFormat(clean)) return false;
    return isValidRutDv(clean);
  }
  // Si es pasaporte o documento extranjero oficial (5 a 20 caracteres alfanuméricos sin puntos)
  return /^[A-Za-z0-9-]{5,20}$/.test(trimmed);
}

export function normalizeNationalId(id: string): string {
  if (!id || typeof id !== 'string') return '';
  const trimmed = id.trim();
  if (isValidRutFormat(trimmed)) {
    return formatRut(trimmed);
  }
  return trimmed.toUpperCase();
}
