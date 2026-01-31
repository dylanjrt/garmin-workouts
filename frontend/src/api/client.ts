import type { Workout, WorkoutSummary, GarminStatus, UploadResult, WorkoutItem } from '../types/workout';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const workoutApi = {
  list: (): Promise<WorkoutSummary[]> => fetchJson('/workouts'),

  get: (id: string): Promise<Workout> => fetchJson(`/workouts/${encodeURIComponent(id)}`),

  create: (data: { name: string; pool_length?: number; steps?: WorkoutItem[] }): Promise<Workout> =>
    fetchJson('/workouts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Workout>): Promise<Workout> =>
    fetchJson(`/workouts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    fetchJson(`/workouts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  duplicate: (id: string): Promise<Workout> =>
    fetchJson(`/workouts/${encodeURIComponent(id)}/duplicate`, {
      method: 'POST',
    }),
};

export const garminApi = {
  getStatus: (): Promise<GarminStatus> => fetchJson('/garmin/status'),

  login: (email: string, password: string): Promise<GarminStatus> =>
    fetchJson('/garmin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: (): Promise<void> =>
    fetchJson('/garmin/logout', {
      method: 'POST',
    }),

  upload: (workoutId: string): Promise<UploadResult> =>
    fetchJson(`/garmin/upload/${encodeURIComponent(workoutId)}`, {
      method: 'POST',
    }),

  sync: (): Promise<WorkoutSummary[]> =>
    fetchJson('/garmin/sync', {
      method: 'POST',
    }),
};
