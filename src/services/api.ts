import type {
  BellScheduleData,
  LoginResponse,
  NewsItem,
  SiteSettings,
  StaffMember,
} from '../types';

export class ApiUnavailableError extends Error {
  constructor(message = 'Backend API is not reachable') {
    super(message);
    this.name = 'ApiUnavailableError';
  }
}

export class ApiAuthError extends Error {
  constructor(message = 'Invalid credentials') {
    super(message);
    this.name = 'ApiAuthError';
  }
}

function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type') || '';
  return contentType.toLowerCase().includes('application/json');
}

async function handlePublicGet<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
  } catch {
    throw new ApiUnavailableError();
  }

  if (
    response.status === 404 ||
    response.status === 502 ||
    response.status === 503 ||
    !isJsonResponse(response)
  ) {
    throw new ApiUnavailableError();
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

async function handleAuthorizedMutation<T>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  token: string,
  body?: FormData | string,
  isJsonBody = false
): Promise<T> {
  let response: Response;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (isJsonBody) {
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
  }

  try {
    response = await fetch(url, {
      method,
      headers,
      body,
    });
  } catch {
    throw new ApiUnavailableError();
  }

  if (
    response.status === 404 ||
    response.status === 502 ||
    response.status === 503 ||
    (method !== 'DELETE' && !isJsonResponse(response))
  ) {
    throw new ApiUnavailableError();
  }

  if (response.status === 401 || response.status === 403) {
    throw new ApiAuthError();
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (method === 'DELETE' || response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function fetchNews(): Promise<NewsItem[]> {
  return handlePublicGet<NewsItem[]>('/api/news');
}

export async function fetchStaff(): Promise<StaffMember[]> {
  return handlePublicGet<StaffMember[]>('/api/staff');
}

export async function fetchSchedule(): Promise<BellScheduleData> {
  return handlePublicGet<BellScheduleData>('/api/schedule');
}

export async function fetchSettings(): Promise<SiteSettings> {
  return handlePublicGet<SiteSettings>('/api/settings');
}

export async function loginAdmin(username: string, password: string): Promise<LoginResponse> {
  let response: Response;
  try {
    response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new ApiUnavailableError();
  }

  if (
    response.status === 404 ||
    response.status === 502 ||
    response.status === 503 ||
    !isJsonResponse(response)
  ) {
    throw new ApiUnavailableError();
  }

  if (response.status === 401 || response.status === 403) {
    const errBody = await response.json().catch(() => ({}));
    throw new ApiAuthError(errBody?.message || 'Unauthorized');
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()) as LoginResponse;
}

export async function createNews(formData: FormData, token: string): Promise<NewsItem> {
  return handleAuthorizedMutation<NewsItem>('/api/news', 'POST', token, formData);
}

export async function updateNews(
  id: number | string,
  formData: FormData,
  token: string
): Promise<NewsItem> {
  return handleAuthorizedMutation<NewsItem>(`/api/news/${id}`, 'PUT', token, formData);
}

export async function deleteNews(id: number | string, token: string): Promise<void> {
  return handleAuthorizedMutation<void>(`/api/news/${id}`, 'DELETE', token);
}

export async function createStaff(formData: FormData, token: string): Promise<StaffMember> {
  return handleAuthorizedMutation<StaffMember>('/api/staff', 'POST', token, formData);
}

export async function updateStaff(
  id: number | string,
  formData: FormData,
  token: string
): Promise<StaffMember> {
  return handleAuthorizedMutation<StaffMember>(`/api/staff/${id}`, 'PUT', token, formData);
}

export async function deleteStaff(id: number | string, token: string): Promise<void> {
  return handleAuthorizedMutation<void>(`/api/staff/${id}`, 'DELETE', token);
}

export async function saveSchedule(
  schedule: BellScheduleData,
  token: string
): Promise<BellScheduleData> {
  return handleAuthorizedMutation<BellScheduleData>(
    '/api/schedule',
    'PUT',
    token,
    JSON.stringify(schedule),
    true
  );
}

export async function saveSettings(
  settings: SiteSettings,
  token: string
): Promise<SiteSettings> {
  return handleAuthorizedMutation<SiteSettings>(
    '/api/settings',
    'PUT',
    token,
    JSON.stringify(settings),
    true
  );
}
