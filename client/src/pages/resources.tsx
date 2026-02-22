import { useState, useMemo } from 'react';
import { Plus, Trash2, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import {
  useResources,
  useDeleteResource,
  useToggleFavourite,
  useResourceTags,
} from '@/hooks/use-resources';
import { usePersistedSearch } from '@/hooks/use-persisted-search';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TypeBadge } from '@/components/type-badge';
import { AudioPlayer } from '@/components/audio-player';
import { ResourceFormModal } from '@/components/resource-form-modal';
import { SearchWithTags } from '@/components/search-with-tags';
import type { Resource } from '@language-challenger/shared';

const PAGE_SIZE = 20;

export function ResourcesPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { search, setSearch, tagFilter, setTagFilter, typeFilter, setTypeFilter } =
    usePersistedSearch('resources-search', true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(search && { search }),
      ...(typeFilter && { type: typeFilter }),
      ...(tagFilter.length > 0 && { tags: tagFilter.join(',') }),
    }),
    [page, search, typeFilter, tagFilter],
  );

  const { data, isLoading } = useResources(params);
  const { data: tagsData } = useResourceTags();
  const availableTags = tagsData?.tags ?? [];
  const deleteResource = useDeleteResource();
  const toggleFav = useToggleFavourite();

  const resources = data?.resources ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleDelete = async (r: Resource) => {
    if (!confirm(`¿Eliminar recurso "${r.code}"?`)) return;
    try {
      await deleteResource.mutateAsync(r.id);
      toast.success('Recurso eliminado');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleEdit = (r: Resource) => {
    setEditingResource(r);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingResource(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recursos</h1>
        {user?.isAdmin && (
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo recurso
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-start">
        <SearchWithTags
          searchValue={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          activeTags={tagFilter}
          onTagsChange={(tags) => {
            setTagFilter(tags);
            setPage(1);
          }}
          availableTags={availableTags}
          placeholder="Buscar por contenido, código o tag…"
          className="flex-1 min-w-[240px]"
        />
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="phrase">Phrase</SelectItem>
            <SelectItem value="vocabulary">Vocabulary</SelectItem>
            <SelectItem value="paragraph">Paragraph</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Tabla */}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Código</th>
              <th className="text-left p-3 font-medium">Tipo</th>
              <th className="text-left p-3 font-medium">Español</th>
              <th className="text-left p-3 font-medium">Inglés</th>
              <th className="text-left p-3 font-medium">Tags</th>
              <th className="text-center p-3 font-medium w-20">Audio</th>
              <th className="text-center p-3 font-medium w-28">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-muted-foreground">
                  Cargando…
                </td>
              </tr>
            ) : resources.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-muted-foreground">
                  No hay recursos
                </td>
              </tr>
            ) : (
              resources.map((r) => (
                <tr
                  key={r.id}
                  className="border-b hover:bg-muted/30 cursor-pointer"
                  onClick={() => handleEdit(r)}
                >
                  <td className="p-3 font-mono text-xs">{r.code}</td>
                  <td className="p-3">
                    <TypeBadge type={r.type as 'phrase' | 'vocabulary' | 'paragraph'} />
                  </td>
                  <td className="p-3 max-w-[200px] truncate">{r.contentEs}</td>
                  <td className="p-3 max-w-[200px] truncate">{r.contentEn}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(r.tags || []).slice(0, 3).map((t) => (
                        <span key={t} className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                          {t}
                        </span>
                      ))}
                      {(r.tags || []).length > 3 && (
                        <span className="text-xs text-muted-foreground">+{r.tags!.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <AudioPlayer audioId={r.audioId} compact />
                  </td>
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleFav.mutate(r.id)}
                        title="Favorito"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            r.favourite
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </Button>
                      {user?.isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
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

      <ResourceFormModal open={formOpen} onOpenChange={setFormOpen} resource={editingResource} />
    </div>
  );
}
