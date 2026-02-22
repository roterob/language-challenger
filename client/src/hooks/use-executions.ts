import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Execution,
  ExecutionConfig,
  ExecutionResult,
  UserStats,
} from '@language-challenger/shared';
import { api } from '@/lib/api';

interface ExecutionsResponse {
  executions: Execution[];
  total: number;
  page: number;
  limit: number;
}

interface ExecutionDetail extends Execution {
  results: (ExecutionResult & { resource: any })[];
}

export function useExecutions(params?: Record<string, string | number>) {
  const query = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== '' && v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';

  return useQuery({
    queryKey: ['executions', params],
    queryFn: () => api.get<ExecutionsResponse>(`/executions${query}`),
  });
}

export function useExecution(id: string | undefined) {
  return useQuery({
    queryKey: ['execution', id],
    queryFn: () => api.get<{ execution: ExecutionDetail }>(`/executions/${id}`),
    enabled: !!id,
  });
}

export function useStartExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { listIds: string[] }) =>
      api.post<{ execution: Execution }>('/executions/start', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['executions'] });
      qc.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useStartTemporaryExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { resourceIds: string[] }) =>
      api.post<{ execution: Execution }>('/executions/start-temporary', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['executions'] });
    },
  });
}

export function useSaveExecutionConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, config }: { id: string; config: Partial<ExecutionConfig> }) =>
      api.patch<{ execution: Execution }>(`/executions/${id}/config`, config),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['execution', id] });
    },
  });
}

export function useSaveResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      result,
    }: {
      id: string;
      result: {
        resourceId: string;
        listId?: string | null;
        currentIndex: number;
        result: boolean | null;
      };
    }) => api.patch<{ result: ExecutionResult }>(`/executions/${id}/result`, result),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['execution', id] });
    },
  });
}

export function useRestartExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<{ execution: Execution }>(`/executions/${id}/restart`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['execution', id] });
      qc.invalidateQueries({ queryKey: ['executions'] });
    },
  });
}

export function useFinishExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<{ execution: Execution }>(`/executions/${id}/finish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['executions'] });
      qc.invalidateQueries({ queryKey: ['lists'] });
      qc.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: () => api.get<{ stats: UserStats }>('/auth/me/stats'),
  });
}
