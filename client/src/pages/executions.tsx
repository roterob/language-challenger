import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
} from 'lucide-react';
import { useExecutions, useUserStats } from '@/hooks/use-executions';
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
import { formatRelativeTime } from '@language-challenger/shared';

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
          <div className="text-2xl font-bold">{stats.totalExecutions ?? 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Aciertos</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.totalOk ?? 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Fallos</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.totalFail ?? 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Ratio</CardTitle>
          <BarChart3 className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalOk && stats.totalFail
              ? `${Math.round((stats.totalOk / (stats.totalOk + stats.totalFail)) * 100)}%`
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

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select
          value={stateFilter}
          onValueChange={(v) => { setStateFilter(v === 'all' ? '' : v); setPage(1); }}
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
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center p-8 text-muted-foreground">Cargando…</td>
              </tr>
            ) : executions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-8 text-muted-foreground">
                  No hay ejecuciones
                </td>
              </tr>
            ) : (
              executions.map((ex) => (
                <tr key={ex.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{ex.listTitle || 'Temporal'}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stateColor[ex.state] || ''}`}>
                      {ex.state === 'in-progress' ? 'En progreso' : ex.state === 'finished' ? 'Finalizada' : ex.state}
                    </span>
                  </td>
                  <td className="p-3 text-center text-green-600 font-medium">
                    {ex.counters?.ok ?? 0}
                  </td>
                  <td className="p-3 text-center text-red-600 font-medium">
                    {ex.counters?.fail ?? 0}
                  </td>
                  <td className="p-3 text-center">{ex.counters?.total ?? 0}</td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {ex.createdAt ? formatRelativeTime(new Date(ex.createdAt)) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} ejecuciones — Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
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
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
                <td colSpan={7} className="text-center p-8 text-muted-foreground">Cargando…</td>
              </tr>
            ) : stats.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-muted-foreground">
                  No hay estadísticas
                </td>
              </tr>
            ) : (
              stats.map((s: any) => {
                const total = (s.ok ?? 0) + (s.fail ?? 0);
                const ratio = total > 0 ? Math.round((s.ok / total) * 100) : 0;
                return (
                  <tr key={s.resourceId || s.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{s.resourceCode || s.code || '—'}</td>
                    <td className="p-3">
                      {s.resourceType && <TypeBadge type={s.resourceType} />}
                    </td>
                    <td className="p-3 max-w-[200px] truncate">{s.resourceContentEs || s.contentEs || '—'}</td>
                    <td className="p-3 text-center text-green-600 font-medium">{s.ok ?? 0}</td>
                    <td className="p-3 text-center text-red-600 font-medium">{s.fail ?? 0}</td>
                    <td className="p-3 text-center">{total}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`font-medium ${
                          ratio >= 70 ? 'text-green-600' : ratio >= 40 ? 'text-yellow-600' : 'text-red-600'
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
          <span>{total} recursos — Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
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
