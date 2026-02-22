import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { List, ListWithStats, Resource } from '@language-challenger/shared';
import { api } from '@/lib/api';

interface ListsResponse {
  lists: ListWithStats[];
  total: number;
  page: number;
  limit: number;
}

export function useLists(params?: Record<string, string | number>) {
  // Convert page-based pagination to offset-based (server uses offset)
  const normalizedParams = params
    ? (() => {
        const { page, limit = 20, ...rest } = params as any;
        const offset = page ? (page - 1) * limit : 0;
        return { limit, offset, ...rest };
      })()
    : undefined;

  const query = normalizedParams
    ? '?' +
      new URLSearchParams(
        Object.entries(normalizedParams)
          .filter(([, v]) => v !== '' && v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';

  return useQuery({
    queryKey: ['lists', params],
    queryFn: () => api.get<ListsResponse>(`/lists${query}`),
  });
}

export function useList(id: string | undefined) {
  return useQuery({
    queryKey: ['list', id],
    queryFn: () => api.get<{ list: ListWithStats }>(`/lists/${id}`),
    enabled: !!id,
  });
}

export function useListResources(id: string | undefined) {
  return useQuery({
    queryKey: ['listResources', id],
    queryFn: () => api.get<{ resources: Resource[] }>(`/lists/${id}/resources`),
    enabled: !!id,
  });
}

export function useSaveList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id?: string; title: string; resourceIds: string[] }) =>
      data.id
        ? api.put<{ list: List }>(`/lists/${data.id}`, data)
        : api.post<{ list: List }>('/lists', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useListTags() {
  return useQuery({
    queryKey: ['listTags'],
    queryFn: () => api.get<{ tags: string[] }>('/lists/tags'),
    staleTime: 5 * 60_000,
  });
}
