/**
 * Cliente HTTP para la API REST de Clínica Horizonte (/api/v1)
 */

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // En el navegador, conectarse al backend en localhost:3000
    return (window as any).__PUBLIC_API_URL__ || 'http://localhost:3000/api/v1';
  }
  // En SSR dentro de Docker o servidor
  return process.env.API_URL ? `${process.env.API_URL}/api/v1` : 'http://localhost:3000/api/v1';
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

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

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
  }
}

// -----------------------------------------------------------------------------
// Servicios de Dominio
// -----------------------------------------------------------------------------

export const authService = {
  login: (credentials: { email: string; password: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
};

export const healthService = {
  check: () => apiRequest('/health'),
};

export const patientsService = {
  list: (search?: string) =>
    apiRequest(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getById: (id: string) => apiRequest(`/patients/${id}`),
  create: (patient: any) =>
    apiRequest('/patients', { method: 'POST', body: JSON.stringify(patient) }),
  update: (id: string, data: any) =>
    apiRequest(`/patients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const professionalsService = {
  list: () => apiRequest('/professionals'),
  getAvailability: (id: string, date: string) =>
    apiRequest(`/professionals/${id}/availability?date=${date}`),
};

export const specialtiesService = {
  list: () => apiRequest('/specialties'),
};

export const appointmentsService = {
  list: (params: { date?: string; professionalId?: string; patientId?: string; status?: string } = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest(`/appointments${query ? `?${query}` : ''}`);
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
