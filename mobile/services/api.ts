import { Platform } from 'react-native';
import { AssistanceRequest, Mechanic, RequestMessage, RequestStatus, Review, User, UserRole } from './types';

// Default to 10.0.2.2 for Android emulator, localhost for web/iOS
const DEFAULT_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api';

let apiBaseUrl = DEFAULT_URL;
let cachedCsrfToken: string | null = null;
let savedCookie: string | null = null;

export const setApiBaseUrl = (url: string) => {
  apiBaseUrl = url.replace(/\/+$/, '');
};

export const getApiBaseUrl = () => apiBaseUrl;

export const fetchCsrfToken = async (): Promise<string> => {
  if (cachedCsrfToken) return cachedCsrfToken;
  try {
    const res = await fetch(`${apiBaseUrl}/auth/csrf/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    // Capture session cookies if sent
    const cookieHeader = res.headers.get('set-cookie');
    if (cookieHeader) {
      savedCookie = cookieHeader;
    }

    if (res.ok) {
      const data = await res.json();
      cachedCsrfToken = data.csrfToken;
      return data.csrfToken;
    }
  } catch (err) {
    console.warn('Could not fetch CSRF token:', err);
  }
  return '';
};

const getHeaders = async (includeCsrf = true): Promise<HeadersInit> => {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  if (includeCsrf) {
    const token = await fetchCsrfToken();
    if (token) {
      headers['X-CSRFToken'] = token;
      // In web/react native, some environments need the cookie header set explicitly
      if (Platform.OS !== 'web' && token) {
        headers['Cookie'] = `csrftoken=${token}${savedCookie ? `; ${savedCookie}` : ''}`;
      }
    }
  }

  return headers;
};

// --- AUTH API ---
export const apiLogin = async (email: string, password: string): Promise<{ user: User; csrfToken: string }> => {
  const headers = await getHeaders(true);
  const res = await fetch(`${apiBaseUrl}/auth/login/`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const cookieHeader = res.headers.get('set-cookie');
  if (cookieHeader) savedCookie = cookieHeader;

  const data = await res.json();
  if (!res.ok) {
    const msg = data.detail || (typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Login failed');
    throw new Error(msg);
  }

  if (data.csrfToken) cachedCsrfToken = data.csrfToken;
  return data;
};

export const apiRegister = async (
  name: string,
  email: string,
  password: string,
  role: UserRole
): Promise<{ user: User; csrfToken: string }> => {
  const headers = await getHeaders(true);
  const res = await fetch(`${apiBaseUrl}/auth/register/`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ name, email, password, role }),
  });

  const cookieHeader = res.headers.get('set-cookie');
  if (cookieHeader) savedCookie = cookieHeader;

  const data = await res.json();
  if (!res.ok) {
    const msg = data.detail || (typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Registration failed');
    throw new Error(msg);
  }

  if (data.csrfToken) cachedCsrfToken = data.csrfToken;
  return data;
};

export const apiLogout = async (): Promise<void> => {
  try {
    const headers = await getHeaders(true);
    await fetch(`${apiBaseUrl}/auth/logout/`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });
  } finally {
    cachedCsrfToken = null;
    savedCookie = null;
  }
};

export const apiGetMe = async (): Promise<User> => {
  const headers = await getHeaders(false);
  const res = await fetch(`${apiBaseUrl}/auth/me/`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to fetch current user');
  }
  return data;
};

// --- MECHANICS API ---
export interface MechanicFilterParams {
  service?: string;
  available?: boolean;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export const apiGetMechanics = async (params?: MechanicFilterParams): Promise<Mechanic[]> => {
  const query = new URLSearchParams();
  if (params?.service) query.append('service', params.service);
  if (params?.available !== undefined) query.append('available', String(params.available));
  if (params?.latitude !== undefined && params?.longitude !== undefined) {
    query.append('latitude', String(params.latitude));
    query.append('longitude', String(params.longitude));
    if (params?.radius) query.append('radius', String(params.radius));
  }

  const url = `${apiBaseUrl}/mechanics/${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to fetch mechanics');
  }
  return data;
};

export const apiGetMechanicReviews = async (mechanicId: number): Promise<Review[]> => {
  const res = await fetch(`${apiBaseUrl}/mechanics/${mechanicId}/reviews/`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to fetch reviews');
  }
  return data;
};

// --- REQUESTS API ---
export interface CreateRequestPayload {
  mechanic: number;
  issue: string;
  notes?: string;
  latitude: number;
  longitude: number;
}

export const apiGetRequests = async (): Promise<AssistanceRequest[]> => {
  const headers = await getHeaders(false);
  const res = await fetch(`${apiBaseUrl}/requests/`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to fetch assistance requests');
  }
  return data;
};

export const apiCreateRequest = async (payload: CreateRequestPayload): Promise<AssistanceRequest> => {
  const headers = await getHeaders(true);
  const res = await fetch(`${apiBaseUrl}/requests/`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data.detail || (typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Request failed');
    throw new Error(msg);
  }
  return data;
};

export const apiUpdateRequestStatus = async (requestId: number, status: RequestStatus): Promise<AssistanceRequest> => {
  const headers = await getHeaders(true);
  const res = await fetch(`${apiBaseUrl}/requests/${requestId}/status/`, {
    method: 'PATCH',
    headers,
    credentials: 'include',
    body: JSON.stringify({ status }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.status || 'Failed to update request status');
  }
  return data;
};

export const apiGetRequestMessages = async (requestId: number): Promise<RequestMessage[]> => {
  const headers = await getHeaders(false);
  const res = await fetch(`${apiBaseUrl}/requests/${requestId}/messages/`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to fetch messages');
  }
  return data;
};

export const apiSendRequestMessage = async (requestId: number, message: string): Promise<RequestMessage> => {
  const headers = await getHeaders(true);
  const res = await fetch(`${apiBaseUrl}/requests/${requestId}/messages/`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ message }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to send message');
  }
  return data;
};

export const apiSubmitReview = async (requestId: number, rating: number, comment: string): Promise<Review> => {
  const headers = await getHeaders(true);
  const res = await fetch(`${apiBaseUrl}/requests/${requestId}/review/`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ rating, comment }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to submit review');
  }
  return data;
};

// --- SINGLE ITEM HELPERS ---
export const apiGetMechanic = async (mechanicId: number): Promise<Mechanic | null> => {
  const mechanics = await apiGetMechanics();
  const found = mechanics.find((m) => m.id === mechanicId);
  return found || null;
};

export const apiGetRequest = async (requestId: number): Promise<AssistanceRequest | null> => {
  const requests = await apiGetRequests();
  const found = requests.find((r) => r.id === requestId);
  return found || null;
};

// --- MECHANIC PROFILE MANAGEMENT ---
export const apiGetMechanicProfile = async (): Promise<Mechanic | null> => {
  const headers = await getHeaders(false);
  const res = await fetch(`${apiBaseUrl}/mechanic/profile/`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (res.status === 404 || res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to fetch provider profile');
  }
  return data;
};

export const apiUpdateMechanicProfile = async (data: Partial<Mechanic>): Promise<Mechanic> => {
  const headers = await getHeaders(true);
  const res = await fetch(`${apiBaseUrl}/mechanic/profile/`, {
    method: 'PATCH',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const resData = await res.json();
  if (!res.ok) {
    const msg = resData.detail || (typeof resData === 'object' ? Object.values(resData).flat().join(' ') : 'Update failed');
    throw new Error(msg);
  }
  return resData;
};

export const apiCreateMechanicProfile = async (data: Partial<Mechanic>): Promise<Mechanic> => {
  const headers = await getHeaders(true);
  const res = await fetch(`${apiBaseUrl}/mechanic/profile/`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const resData = await res.json();
  if (!res.ok) {
    const msg = resData.detail || (typeof resData === 'object' ? Object.values(resData).flat().join(' ') : 'Profile creation failed');
    throw new Error(msg);
  }
  return resData;
};

// --- HEALTH CHECK ---
export const apiHealthCheck = async (): Promise<{ status: string; service: string }> => {
  const res = await fetch(`${apiBaseUrl}/health/`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }
  return await res.json();
};
