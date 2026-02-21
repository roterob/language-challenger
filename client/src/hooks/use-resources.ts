import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Resource, ResourceWithStats, ResourceStats } from '@language-challenger/shared';
import { api } from '@/lib/api';

interface ResourcesResponse {
  resources: Resource[];
  total: number;
  page: number;
  limit: number;
}

interface ResourceStatsResponse {
  stats: ResourceStats[];
  total: number;
  page: number;
  limit: number;
}

export function useResources(params?: Record<string, string | number>) {
  const query = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== '' && v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';

  return useQuery({
    queryKey: ['resources', params],
    queryFn: () => api.get<ResourcesResponse>(`/resources${query}`),
  });
}

export function useResource(id: string | undefined) {
  return useQuery({
    queryKey: ['resource', id],
    queryFn: () => api.get<{ resource: ResourceWithStats }>(`/resources/${id}`),
    enabled: !!id,
  });
}

export function useResourceStats(params?: Record<string, string | number>) {
  const query = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== '' && v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';

  return useQuery({
    queryKey: ['resourceStats', params],
    queryFn: () => api.get<ResourceStatsResponse>(`/resources/stats/all${query}`),
  });
}

export function useSaveResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Resource>) =>
      data.id
        ? api.put<{ resource: Resource }>(`/resources/${data.id}`, data)
        : api.post<{ resource: Resource }>('/resources', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/resources/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useToggleFavourite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<{ favourite: boolean }>(`/resources/${id}/favourite`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useResourceTags() {
  return useQuery({
    queryKey: ['resourceTags'],
    queryFn: () => api.get<{ tags: string[] }>('/resources/tags'),
    staleTime: 5 * 60_000,
  });
}
