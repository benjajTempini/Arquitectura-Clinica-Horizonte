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
  if (endpoint.startsWith('/auth/register')) return 'Estamos trabajando para su comodidad y salud. Creando cuenta de paciente...';
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

      const validationMsg =
        Array.isArray(data.details) && data.details.length > 0
          ? data.details.join('. ')
          : data.message || `Error ${response.status}: Solicitud fallida.`;

      throw {
        statusCode: response.status,
        code: data.code || 'REQUEST_FAILED',
        message: validationMsg,
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
// Servicios de Dominio
// -----------------------------------------------------------------------------

export const authService = {
  login: (credentials: { email: string; password: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (patientData: {
    nationalId: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    birthDate?: string;
    gender?: string;
  }) =>
    apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(patientData) }),
};

export const healthService = {
  check: () => apiRequest('/health'),
};

export const patientsService = {
  list: async (search?: string) => {
    try {
      const res = await apiRequest(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      if (res && Array.isArray(res.items)) return res;
      return { total: 0, limit: 50, offset: 0, items: [] };
    } catch {
      return { total: 0, limit: 50, offset: 0, items: [] };
    }
  },
  getById: (id: string) => apiRequest(`/patients/${id}`),
  create: (patient: any) =>
    apiRequest('/patients', { method: 'POST', body: JSON.stringify(patient) }),
  update: (id: string, data: any) =>
    apiRequest(`/patients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const professionalsService = {
  list: async (includeInactive = false) => {
    try {
      const res = await apiRequest(`/professionals${includeInactive ? '?includeInactive=true' : ''}`);
      if (Array.isArray(res)) return res;
      return [];
    } catch {
      return [];
    }
  },
  getAvailability: async (id: string, date: string) => {
    try {
      const res = await apiRequest(`/professionals/${id}/availability?date=${date}`);
      if (res && res.slots) return res;
      return { professionalId: id, date, slots: [] };
    } catch {
      return { professionalId: id, date, slots: [] };
    }
  },
  create: (data: {
    licenseNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialtyId: string;
    box?: string;
    password?: string;
  }) =>
    apiRequest('/professionals', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, isActive: boolean) =>
    apiRequest(`/professionals/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
};

export const specialtiesService = {
  list: async () => {
    try {
      const res = await apiRequest('/specialties');
      if (Array.isArray(res)) return res;
      return [];
    } catch {
      return [];
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
