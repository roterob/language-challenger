import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Trash2,
} from 'lucide-react';
import { useExecutions, useUserStats, useDeleteExecution } from '@/hooks/use-executions';
import { useResourceStats } from '@/hooks/use-resources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TypeBadge } from '@/components/type-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ListExecution } from '@/components/list-execution';
import { formatRelativeTime } from '@language-challenger/shared';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

function UserStatsCards() {
  const { data, isLoading } = useUserStats();
  const stats = data?.stats;

  if (isLoading || !stats) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Ejecuciones</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.executions ?? 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Aciertos</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.correct ?? 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Fallos</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.incorrect ?? 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Ratio</CardTitle>
          <BarChart3 className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.correct && stats.incorrect
              ? `${Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100)}%`
              : '—'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExecutionsTab() {
  const [page, setPage] = useState(1);
  const [stateFilter, setStateFilter] = useState('');
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [executionOpen, setExecutionOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const deleteExecution = useDeleteExecution();
  const params = useMemo(
    () => ({ page, limit: PAGE_SIZE, ...(stateFilter && { state: stateFilter }) }),
    [page, stateFilter],
  );
  const { data, isLoading } = useExecutions(params);
  const executions = data?.executions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const stateColor: Record<string, string> = {
    'in-progress': 'bg-blue-100 text-blue-800',
    finished: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  const handleRowClick = (id: string) => {
    setSelectedExecutionId(id);
    setExecutionOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select
          value={stateFilter}
          onValueChange={(v) => {
            setStateFilter(v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="in-progress">En progreso</SelectItem>
            <SelectItem value="finished">Finalizadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Lista</th>
              <th className="text-left p-3 font-medium">Estado</th>
              <th className="text-center p-3 font-medium">OK</th>
              <th className="text-center p-3 font-medium">Fail</th>
              <th className="text-center p-3 font-medium">Total</th>
              <th className="text-left p-3 font-medium">Fecha</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-muted-foreground">
                  Cargando…
                </td>
              </tr>
            ) : executions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-muted-foreground">
                  No hay ejecuciones
                </td>
              </tr>
            ) : (
              executions.map((ex) => {
                const state = ex.inProgress ? 'in-progress' : 'finished';
                const total =
                  (ex.counters?.correct ?? 0) +
                  (ex.counters?.incorrect ?? 0) +
                  (ex.counters?.noExecuted ?? 0);
                return (
                  <tr
                    key={ex.id}
                    className="border-b hover:bg-muted/30 cursor-pointer"
                    onClick={() => handleRowClick(ex.id)}
                  >
                    <td className="p-3 font-medium">{ex.name || 'Temporal'}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${stateColor[state] || ''}`}
                      >
                        {state === 'in-progress' ? 'En progreso' : 'Finalizada'}
                      </span>
                    </td>
                    <td className="p-3 text-center text-green-600 font-medium">
                      {ex.counters?.correct ?? 0}
                    </td>
                    <td className="p-3 text-center text-red-600 font-medium">
                      {ex.counters?.incorrect ?? 0}
                    </td>
                    <td className="p-3 text-center">{total}</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {ex.createdAt ? formatRelativeTime(new Date(ex.createdAt)) : '—'}
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteConfirmId(ex.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} ejecuciones — Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ListExecution
        executionId={selectedExecutionId}
        open={executionOpen}
        onOpenChange={setExecutionOpen}
      />

      <Dialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Eliminar ejecución</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Seguro que quieres eliminar esta ejecución? Esta acción no se puede deshacer.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteExecution.isPending}
              onClick={async () => {
                if (!deleteConfirmId) return;
                try {
                  await deleteExecution.mutateAsync(deleteConfirmId);
                  toast.success('Ejecución eliminada');
                } catch {
                  toast.error('Error al eliminar la ejecución');
                } finally {
                  setDeleteConfirmId(null);
                }
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResourceStatsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const params = useMemo(
    () => ({ page, limit: PAGE_SIZE, ...(search && { search }) }),
    [page, search],
  );
  const { data, isLoading } = useResourceStats(params);
  const stats = data?.stats ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar recurso…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Código</th>
              <th className="text-left p-3 font-medium">Tipo</th>
              <th className="text-left p-3 font-medium">Contenido</th>
              <th className="text-center p-3 font-medium">OK</th>
              <th className="text-center p-3 font-medium">Fail</th>
              <th className="text-center p-3 font-medium">Total</th>
              <th className="text-center p-3 font-medium">Ratio</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-muted-foreground">
                  Cargando…
                </td>
              </tr>
            ) : stats.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-muted-foreground">
                  No hay estadísticas
                </td>
              </tr>
            ) : (
              stats.map((s: any) => {
                const total = (s.correct ?? 0) + (s.incorrect ?? 0);
                const ratio = total > 0 ? Math.round((s.correct / total) * 100) : 0;
                return (
                  <tr key={s.resourceId || s.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{s.resource?.code || '—'}</td>
                    <td className="p-3">
                      {s.resource?.type && <TypeBadge type={s.resource.type} />}
                    </td>
                    <td className="p-3 max-w-[200px] truncate">{s.resource?.contentEs || '—'}</td>
                    <td className="p-3 text-center text-green-600 font-medium">{s.correct ?? 0}</td>
                    <td className="p-3 text-center text-red-600 font-medium">{s.incorrect ?? 0}</td>
                    <td className="p-3 text-center">{total}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`font-medium ${
                          ratio >= 70
                            ? 'text-green-600'
                            : ratio >= 40
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {total > 0 ? `${ratio}%` : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} recursos — Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ExecutionsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ejecuciones</h1>
      <UserStatsCards />
      <Tabs defaultValue="executions">
        <TabsList>
          <TabsTrigger value="executions">Historial</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas por recurso</TabsTrigger>
        </TabsList>
        <TabsContent value="executions">
          <ExecutionsTab />
        </TabsContent>
        <TabsContent value="stats">
          <ResourceStatsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
