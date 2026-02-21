import { useState, useMemo } from 'react';
import { Plus, PlayCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useLists, useListResources, useListTags } from '@/hooks/use-lists';
import { useStartExecution } from '@/hooks/use-executions';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ListFormModal } from '@/components/list-form-modal';
import { ListExecution } from '@/components/list-execution';
import type { ListWithStats } from '@language-challenger/shared';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

export function ListsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingList, setEditingList] = useState<ListWithStats | null>(null);
  const [loadResourcesForId, setLoadResourcesForId] = useState<string>();
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [executionOpen, setExecutionOpen] = useState(false);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(search && { search }),
      ...(tagFilter.length > 0 && { tags: tagFilter.join(',') }),
    }),
    [page, search, tagFilter],
  );

  const { data, isLoading } = useLists(params);
  const { data: tagsData } = useListTags();
  const availableTags = tagsData?.tags ?? [];
  const { data: existingRes } = useListResources(loadResourcesForId);
  const startExecution = useStartExecution();

  const lists = data?.lists ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleNew = () => {
    setEditingList(null);
    setLoadResourcesForId(undefined);
    setFormOpen(true);
  };

  const handleEdit = (l: ListWithStats) => {
    setEditingList(l);
    setLoadResourcesForId(l.id);
    setFormOpen(true);
  };

  const handleStart = async (listId: string) => {
    try {
      const res = await startExecution.mutateAsync({ listIds: [listId] });
      setExecutionId((res as any).execution.id);
      setExecutionOpen(true);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Listas</h1>
        {user?.isAdmin && (
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" /> Nueva lista
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar listas…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground font-medium">Tags:</span>
            {availableTags.map((tag) => (
              <Badge
                key={tag}
                variant={tagFilter.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer select-none"
                onClick={() => {
                  setTagFilter((prev) =>
                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                  );
                  setPage(1);
                }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground col-span-full text-center py-8">Cargando…</p>
        ) : lists.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">No hay listas</p>
        ) : (
          lists.map((l) => (
            <div
              key={l.id}
              className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3"
              onClick={() => handleEdit(l)}
            >
              {/* Header: nombre + contador */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-tight">{l.name}</h3>
                <Badge variant="secondary" className="shrink-0">
                  {l.resources?.length ?? 0} recursos
                </Badge>
              </div>

              {/* Tags */}
              {l.tags && l.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {l.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Stats */}
              {l.stats && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded bg-green-50 dark:bg-green-950 p-1">
                    <div className="font-bold text-green-600">{l.stats.correct ?? 0}</div>
                    <div className="text-muted-foreground">OK</div>
                  </div>
                  <div className="rounded bg-red-50 dark:bg-red-950 p-1">
                    <div className="font-bold text-red-600">{l.stats.incorrect ?? 0}</div>
                    <div className="text-muted-foreground">Fail</div>
                  </div>
                  <div className="rounded bg-blue-50 dark:bg-blue-950 p-1">
                    <div className="font-bold text-blue-600">{l.stats.executions ?? 0}</div>
                    <div className="text-muted-foreground">Ejecuciones</div>
                  </div>
                </div>
              )}

              {/* Botón practicar */}
              <Button
                size="sm"
                className="w-full mt-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStart(l.id);
                }}
                disabled={startExecution.isPending}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Practicar
              </Button>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} listas — Página {page} de {totalPages}
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

      <ListFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        list={editingList}
        existingResourceIds={existingRes?.resources?.map((r) => r.id) ?? []}
      />

      <ListExecution
        executionId={executionId}
        open={executionOpen}
        onOpenChange={setExecutionOpen}
      />
    </div>
  );
}
