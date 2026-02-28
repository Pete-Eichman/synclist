const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface List {
  id: string;
  name: string;
  join_code: string;
  created_by: string;
  created_at: string;
}

export interface ListItem {
  id: string;
  list_id: string;
  text: string;
  checked: boolean;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ListWithItems extends List {
  items: ListItem[];
}

export const api = {
  createList: (name: string, deviceId: string) =>
    request<List>('/lists', {
      method: 'POST',
      body: JSON.stringify({ name, deviceId }),
    }),

  getList: (id: string) => request<ListWithItems>(`/lists/${id}`),

  joinList: (joinCode: string, deviceId: string) =>
    request<List>('/lists/join', {
      method: 'POST',
      body: JSON.stringify({ joinCode, deviceId }),
    }),
};
