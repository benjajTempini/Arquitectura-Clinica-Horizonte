/**
 * Cliente HTTP para la API REST de Clínica Horizonte (/api/v1)
 */

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // 1. Variable global inyectada desde Layout.astro / variables de entorno
    if ((window as any).__PUBLIC_API_URL__) {
      const base = ((window as any).__PUBLIC_API_URL__ as string).replace(/\/+$/, '');
      return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
    }
    // 2. Derivación dinámica basada en el host del navegador (ideal para IP pública de AWS EC2 o localhost)
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:3000/api/v1`;
  }
  // En SSR dentro de Docker o servidor
  const serverUrl = process.env.API_URL || 'http://backend:3000';
  const base = serverUrl.replace(/\/+$/, '');
  return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
};

const getAuthHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

let activeRequestsCount = 0;

function resolveEndpointMessage(endpoint: string, method = 'GET'): string {
  if (endpoint.startsWith('/auth/login')) return 'Estamos trabajando para su comodidad y salud. Validando credenciales seguras...';
  if (endpoint.startsWith('/health')) return 'Estamos trabajando para su comodidad y salud. Verificando estado de la red asistencial...';
  if (endpoint.startsWith('/appointments')) {
    if (method === 'POST') return 'Estamos trabajando para su comodidad y salud. Validando ausencia de solapamiento y agendando...';
    if (endpoint.includes('/availability')) return 'Estamos trabajando para su comodidad y salud. Calculando franjas horarias disponibles...';
    return 'Estamos trabajando para su comodidad y salud. Sincronizando agenda médica...';
  }
  if (endpoint.startsWith('/patients')) {
    if (method === 'POST') return 'Estamos trabajando para su comodidad y salud. Registrando ficha del paciente...';
    return 'Estamos trabajando para su comodidad y salud. Consultando registros de pacientes...';
  }
  if (endpoint.startsWith('/clinical-care')) return 'Estamos trabajando para su comodidad y salud. Guardando atención y diagnósticos CIE-10...';
  if (endpoint.startsWith('/payments')) return 'Estamos trabajando para su comodidad y salud. Procesando comprobante y conciliación Fonasa/Isapre...';
  if (endpoint.startsWith('/audit')) return 'Estamos trabajando para su comodidad y salud. Consultando bitácora de trazabilidad sanitaria...';
  return 'Estamos trabajando para su comodidad y salud...';
}

function notifyStart(message: string) {
  if (typeof window !== 'undefined') {
    activeRequestsCount++;
    window.dispatchEvent(new CustomEvent('clinical:loading:start', { detail: { message } }));
  }
}

function notifyEnd() {
  if (typeof window !== 'undefined') {
    activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    if (activeRequestsCount === 0) {
      window.dispatchEvent(new CustomEvent('clinical:loading:end'));
    }
  }
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const method = (options.method || 'GET').toUpperCase();
  notifyStart(resolveEndpointMessage(endpoint, method));

  const config: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Redirigir a login en caso de token expirado o no autorizado
      if (
        response.status === 401 &&
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login')
      ) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = `/login?expired=true&redirect=${encodeURIComponent(window.location.pathname)}`;
      }

      throw {
        statusCode: response.status,
        code: data.code || 'REQUEST_FAILED',
        message: data.message || `Error ${response.status}: Solicitud fallida.`,
        details: data.details || [],
      };
    }

    return data;
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw {
      statusCode: 503,
      code: 'NETWORK_ERROR',
      message: 'No fue posible comunicarse con el servicio backend de Clínica Horizonte.',
      details: [error.message],
    };
  } finally {
    notifyEnd();
  }
}

// -----------------------------------------------------------------------------
// Catálogo de Contingencia y Servicios de Dominio
// -----------------------------------------------------------------------------

export const FALLBACK_SPECIALTIES = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    code: 'MED-GEN',
    name: 'Medicina General',
    description: 'Atención médica primaria integral para adultos y controles de salud.',
    defaultDurationMin: 20,
    price: 14200,
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    code: 'PED-01',
    name: 'Pediatría Integral',
    description: 'Atención integral para niños y adolescentes con control de niño sano.',
    defaultDurationMin: 30,
    price: 18500,
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    code: 'CAR-01',
    name: 'Cardiología Preventiva',
    description: 'Evaluación y seguimiento cardiovascular integral y prevención de infartos.',
    defaultDurationMin: 30,
    price: 28000,
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    code: 'TRA-01',
    name: 'Traumatología Adulto & Infantil',
    description: 'Atención del aparato locomotor, lesiones deportivas y articulares.',
    defaultDurationMin: 20,
    price: 22000,
  },
];

export const FALLBACK_PROFESSIONALS = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    firstName: 'Roberto',
    lastName: 'Morales Soto',
    licenseNumber: 'MED-18942-CH',
    boxNumber: 'Box 01',
    email: 'dr.morales@clinicahorizonte.cl',
    specialties: [
      {
        specialty: {
          id: '11111111-1111-1111-1111-111111111101',
          name: 'Medicina General',
          code: 'MED-GEN',
        },
      },
      {
        specialty: {
          id: '11111111-1111-1111-1111-111111111103',
          name: 'Cardiología Preventiva',
          code: 'CAR-01',
        },
      },
    ],
    schedules: [
      { dayOfWeek: 1, startTime: '08:30', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '08:30', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '08:30', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '08:30', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '08:30', endTime: '17:00' },
    ],
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    firstName: 'Carolina',
    lastName: 'Valenzuela Ríos',
    licenseNumber: 'MED-24819-CH',
    boxNumber: 'Box 03',
    email: 'dra.valenzuela@clinicahorizonte.cl',
    specialties: [
      {
        specialty: {
          id: '11111111-1111-1111-1111-111111111102',
          name: 'Pediatría Integral',
          code: 'PED-01',
        },
      },
    ],
    schedules: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:30' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:30' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:30' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:30' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '16:00' },
    ],
  },
  {
    id: '22222222-2222-2222-2222-222222222203',
    firstName: 'Matías',
    lastName: 'Albornoz Castro',
    licenseNumber: 'MED-31055-CH',
    boxNumber: 'Box 04',
    email: 'dr.albornoz@clinicahorizonte.cl',
    specialties: [
      {
        specialty: {
          id: '11111111-1111-1111-1111-111111111104',
          name: 'Traumatología Adulto & Infantil',
          code: 'TRA-01',
        },
      },
    ],
    schedules: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '16:30' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '16:30' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '16:30' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '16:30' },
      { dayOfWeek: 5, startTime: '08:00', endTime: '15:00' },
    ],
  },
];

export const FALLBACK_PATIENTS = [
  {
    id: '33333333-3333-3333-3333-333333333301',
    nationalId: '15.824.912-K',
    firstName: 'Sofía',
    lastName: 'Contreras Díaz',
    birthDate: '1992-05-14T00:00:00.000Z',
    gender: 'FEMENINO',
    phone: '+56 9 8123 4567',
    email: 'paciente.demo@clinicahorizonte.cl',
    address: 'Av. Providencia 2040, Depto 502, Providencia',
    emergencyContact: 'Carlos Contreras (+56 9 8765 4321)',
  },
  {
    id: '33333333-3333-3333-3333-333333333302',
    nationalId: '12.345.678-5',
    firstName: 'Juan Pablo',
    lastName: 'González Muñoz',
    birthDate: '1985-11-20T00:00:00.000Z',
    gender: 'MASCULINO',
    phone: '+56 9 7654 3210',
    email: 'juan.gonzalez@gmail.com',
    address: 'Los Leones 123, Providencia',
    emergencyContact: 'María Muñoz (+56 9 1234 5678)',
  },
  {
    id: '33333333-3333-3333-3333-333333333303',
    nationalId: '18.765.432-1',
    firstName: 'Valentina',
    lastName: 'Rojas Silva',
    birthDate: '1998-03-08T00:00:00.000Z',
    gender: 'FEMENINO',
    phone: '+56 9 6543 2109',
    email: 'valentina.rojas@gmail.com',
    address: 'Manuel Montt 456, Providencia',
    emergencyContact: 'Pedro Rojas (+56 9 9876 5432)',
  },
];

function generateFallbackAvailability(professionalId: string, date: string) {
  const prof = FALLBACK_PROFESSIONALS.find((p) => p.id === professionalId) || FALLBACK_PROFESSIONALS[0];
  const slots = [
    { startTime: `${date}T09:00:00.000Z`, endTime: `${date}T09:20:00.000Z`, isAvailable: true },
    { startTime: `${date}T09:20:00.000Z`, endTime: `${date}T09:40:00.000Z`, isAvailable: true },
    { startTime: `${date}T10:00:00.000Z`, endTime: `${date}T10:20:00.000Z`, isAvailable: false, reason: 'OCCUPIED' },
    { startTime: `${date}T10:20:00.000Z`, endTime: `${date}T10:40:00.000Z`, isAvailable: true },
    { startTime: `${date}T11:00:00.000Z`, endTime: `${date}T11:20:00.000Z`, isAvailable: true },
    { startTime: `${date}T11:20:00.000Z`, endTime: `${date}T11:40:00.000Z`, isAvailable: true },
    { startTime: `${date}T14:00:00.000Z`, endTime: `${date}T14:20:00.000Z`, isAvailable: true },
    { startTime: `${date}T14:20:00.000Z`, endTime: `${date}T14:40:00.000Z`, isAvailable: true },
    { startTime: `${date}T15:00:00.000Z`, endTime: `${date}T15:20:00.000Z`, isAvailable: true },
  ];
  return {
    professionalId: prof.id,
    professionalName: `${prof.firstName} ${prof.lastName}`,
    boxNumber: prof.boxNumber,
    date,
    slots,
  };
}

export const authService = {
  login: (credentials: { email: string; password: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
};

export const healthService = {
  check: () => apiRequest('/health'),
};

export const patientsService = {
  list: async (search?: string) => {
    try {
      const res = await apiRequest(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      if (res && Array.isArray(res.items)) return res;
      return { total: FALLBACK_PATIENTS.length, limit: 50, offset: 0, items: FALLBACK_PATIENTS };
    } catch {
      const filtered = search
        ? FALLBACK_PATIENTS.filter(
            (p) =>
              p.nationalId.toLowerCase().includes(search.toLowerCase()) ||
              p.firstName.toLowerCase().includes(search.toLowerCase()) ||
              p.lastName.toLowerCase().includes(search.toLowerCase())
          )
        : FALLBACK_PATIENTS;
      return { total: filtered.length, limit: 50, offset: 0, items: filtered };
    }
  },
  getById: (id: string) => apiRequest(`/patients/${id}`),
  create: (patient: any) =>
    apiRequest('/patients', { method: 'POST', body: JSON.stringify(patient) }),
  update: (id: string, data: any) =>
    apiRequest(`/patients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const professionalsService = {
  list: async () => {
    try {
      const res = await apiRequest('/professionals');
      if (Array.isArray(res) && res.length > 0) return res;
      return FALLBACK_PROFESSIONALS;
    } catch {
      return FALLBACK_PROFESSIONALS;
    }
  },
  getAvailability: async (id: string, date: string) => {
    try {
      const res = await apiRequest(`/professionals/${id}/availability?date=${date}`);
      if (res && res.slots) return res;
      return generateFallbackAvailability(id, date);
    } catch {
      return generateFallbackAvailability(id, date);
    }
  },
};

export const specialtiesService = {
  list: async () => {
    try {
      const res = await apiRequest('/specialties');
      if (Array.isArray(res) && res.length > 0) return res;
      return FALLBACK_SPECIALTIES;
    } catch {
      return FALLBACK_SPECIALTIES;
    }
  },
};

export const appointmentsService = {
  list: async (params: { date?: string; professionalId?: string; patientId?: string; status?: string } = {}) => {
    try {
      const query = new URLSearchParams(params as any).toString();
      const res = await apiRequest(`/appointments${query ? `?${query}` : ''}`);
      if (res && Array.isArray(res.items)) return res;
      return { total: 0, limit: 50, offset: 0, items: [] };
    } catch {
      return { total: 0, limit: 50, offset: 0, items: [] };
    }
  },
  getById: (id: string) => apiRequest(`/appointments/${id}`),
  create: (appointment: any) =>
    apiRequest('/appointments', { method: 'POST', body: JSON.stringify(appointment) }),
  reschedule: (id: string, data: { startTime: string; endTime: string; reason?: string }) =>
    apiRequest(`/appointments/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    apiRequest(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const paymentsService = {
  getByAppointment: (appointmentId: string) =>
    apiRequest(`/appointments/${appointmentId}/payments`),
  create: (appointmentId: string, payment: any) =>
    apiRequest(`/appointments/${appointmentId}/payments`, { method: 'POST', body: JSON.stringify(payment) }),
  updateStatus: (paymentId: string, data: { status: string; notes?: string }) =>
    apiRequest(`/payments/${paymentId}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const clinicalCareService = {
  create: (appointmentId: string, data: any) =>
    apiRequest(`/appointments/${appointmentId}/clinical-care`, { method: 'POST', body: JSON.stringify(data) }),
  getPatientHistory: (patientId: string) =>
    apiRequest(`/patients/${patientId}/clinical-history`),
};

export const auditService = {
  list: (limit = 50, resource?: string) =>
    apiRequest(`/audit-events?limit=${limit}${resource ? `&resource=${resource}` : ''}`),
};
