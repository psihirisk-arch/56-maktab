import type {
  AdminUser,
  BellScheduleData,
  LoginResponse,
  NewsItem,
  SiteSettings,
  StaffMember,
  Teacher,
} from '../types';

export class ApiAuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'ApiAuthError';
  }
}

export class ApiRequestError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
  }
}

async function parseErrorBody(response: Response): Promise<{ message: string; error?: string }> {
  try {
    const data = (await response.json()) as { message?: string; error?: string };
    return {
      message: data.message || `HTTP ${response.status}`,
      error: data.error,
    };
  } catch {
    return { message: `HTTP ${response.status}` };
  }
}

async function requestJson<T>(
  url: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const err = await parseErrorBody(response);
    throw new ApiAuthError(err.message);
  }

  if (!response.ok) {
    const err = await parseErrorBody(response);
    throw new ApiRequestError(err.message, err.error);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// --- Public APIs ---

export function fetchNews(): Promise<NewsItem[]> {
  return requestJson<NewsItem[]>('/api/news');
}

export function fetchNewsById(id: string): Promise<NewsItem> {
  return requestJson<NewsItem>(`/api/news/${id}`);
}

export function fetchStaff(): Promise<StaffMember[]> {
  return requestJson<StaffMember[]>('/api/staff');
}

export function fetchTeachers(): Promise<Teacher[]> {
  return requestJson<Teacher[]>('/api/teachers');
}

export function fetchSchedule(): Promise<BellScheduleData> {
  return requestJson<BellScheduleData>('/api/schedule');
}

export function fetchSettings(): Promise<SiteSettings> {
  return requestJson<SiteSettings>('/api/settings');
}

// --- Auth APIs ---

export function loginAdmin(username: string, password: string): Promise<LoginResponse> {
  return requestJson<LoginResponse>('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export function fetchCurrentAdmin(token: string): Promise<{ admin: AdminUser }> {
  return requestJson<{ admin: AdminUser }>('/api/me', {}, token);
}

// --- Admin Management APIs ---

export function fetchAdmins(token: string): Promise<AdminUser[]> {
  return requestJson<AdminUser[]>('/api/admins', {}, token);
}

export function createAdminAccount(
  payload: { username: string; password: string; full_name: string },
  token: string
): Promise<AdminUser> {
  return requestJson<AdminUser>(
    '/api/admins',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    token
  );
}

export function deleteAdminAccount(id: string, token: string): Promise<void> {
  return requestJson<void>(`/api/admins/${id}`, { method: 'DELETE' }, token);
}

// --- Protected Content APIs ---

export function createNews(formData: FormData, token: string): Promise<NewsItem> {
  return requestJson<NewsItem>('/api/news', { method: 'POST', body: formData }, token);
}

export function updateNews(
  id: number | string,
  formData: FormData,
  token: string
): Promise<NewsItem> {
  return requestJson<NewsItem>(`/api/news/${id}`, { method: 'PUT', body: formData }, token);
}

export function deleteNews(id: number | string, token: string): Promise<void> {
  return requestJson<void>(`/api/news/${id}`, { method: 'DELETE' }, token);
}

export function createStaff(formData: FormData, token: string): Promise<StaffMember> {
  return requestJson<StaffMember>('/api/staff', { method: 'POST', body: formData }, token);
}

export function updateStaff(
  id: number | string,
  formData: FormData,
  token: string
): Promise<StaffMember> {
  return requestJson<StaffMember>(`/api/staff/${id}`, { method: 'PUT', body: formData }, token);
}

export function deleteStaff(id: number | string, token: string): Promise<void> {
  return requestJson<void>(`/api/staff/${id}`, { method: 'DELETE' }, token);
}

export function createTeacher(formData: FormData, token: string): Promise<Teacher> {
  return requestJson<Teacher>('/api/teachers', { method: 'POST', body: formData }, token);
}

export function updateTeacher(
  id: number | string,
  formData: FormData,
  token: string
): Promise<Teacher> {
  return requestJson<Teacher>(`/api/teachers/${id}`, { method: 'PUT', body: formData }, token);
}

export function deleteTeacher(id: number | string, token: string): Promise<void> {
  return requestJson<void>(`/api/teachers/${id}`, { method: 'DELETE' }, token);
}

export function saveSchedule(schedule: BellScheduleData, token: string): Promise<BellScheduleData> {
  return requestJson<BellScheduleData>(
    '/api/schedule',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    },
    token
  );
}

export function saveSettings(settings: SiteSettings, token: string): Promise<SiteSettings> {
  return requestJson<SiteSettings>(
    '/api/settings',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    },
    token
  );
}
