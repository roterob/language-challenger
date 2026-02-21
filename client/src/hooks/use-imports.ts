import { useQuery } from '@tanstack/react-query';
import type { ImportTask } from '@language-challenger/shared';
import { api } from '@/lib/api';

interface TasksResponse {
  tasks: ImportTask[];
  total: number;
}

export function useImportTasks(params?: Record<string, string | number>) {
  const query = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== '' && v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';

  return useQuery({
    queryKey: ['importTasks', params],
    queryFn: () => api.get<TasksResponse>(`/imports${query}`),
  });
}

export function useActiveTasks() {
  return useQuery({
    queryKey: ['activeTasks'],
    queryFn: () => api.get<{ tasks: ImportTask[] }>('/imports/active'),
    refetchInterval: 3000,
  });
}

export function useImportTask(id: string | undefined) {
  return useQuery({
    queryKey: ['importTask', id],
    queryFn: () => api.get<{ task: ImportTask }>(`/imports/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const task = query.state.data?.task;
      if (task && (task.status === 'pending' || task.status === 'processing')) {
        return 2000;
      }
      return false;
    },
  });
}

export async function uploadImport(file: File): Promise<{ task: ImportTask }> {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/imports/upload', formData);
}
