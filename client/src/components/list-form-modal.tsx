import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ListWithStats } from '@language-challenger/shared';
import { toast } from 'sonner';
import { useSaveList, useListResources } from '@/hooks/use-lists';
import { useResources } from '@/hooks/use-resources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { TypeBadge } from '@/components/type-badge';
import { Search, Check } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
});
type FormData = z.infer<typeof formSchema>;

interface ListFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list?: ListWithStats | null;
  existingResourceIds?: string[];
}

export function ListFormModal({
  open,
  onOpenChange,
  list,
  existingResourceIds = [],
}: ListFormProps) {
  const saveList = useSaveList();
  const isEdit = !!list;
  const [search, setSearch] = useState('');

  // Re-sync when the list changes (useState doesn't reinitialize on prop changes)
  useEffect(() => {
    setSelectedIds(existingResourceIds);
    reset({ name: list?.name || '' });
    setSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list?.id]);
  const [selectedIds, setSelectedIds] = useState<string[]>(existingResourceIds);

  // When editing with no search: show only the list's own resources
  // When searching: show all resources matching the search (to add new ones)
  const { data: listResourcesData } = useListResources(isEdit && !search ? list?.id : undefined);
  const { data: searchResourcesData } = useResources(
    search ? { limit: 100, search } : undefined,
  );

  const displayedResources = search
    ? (searchResourcesData?.resources ?? [])
    : (listResourcesData?.resources ?? []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: list?.name || '' },
  });

  const toggleResource = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onSubmit = async (data: FormData) => {
    try {
      await saveList.mutateAsync({
        ...(isEdit ? { id: list.id } : {}),
        name: data.name,
        resources: selectedIds,
        tags: list?.tags ?? [],
      });
      toast.success(isEdit ? 'Lista actualizada' : 'Lista creada');
      reset();
      setSelectedIds([]);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar lista' : 'Nueva lista'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 flex-1 overflow-hidden"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
            <Label>Recursos ({selectedIds.length} seleccionados)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isEdit ? 'Buscar para añadir más recursos…' : 'Buscar recursos…'}
                className="pl-9"
              />
            </div>
            {isEdit && !search && (
              <p className="text-xs text-muted-foreground">
                Mostrando los recursos de esta lista. Busca para añadir más.
              </p>
            )}
            <div className="flex-1 overflow-y-auto border rounded-md max-h-[300px]">
              {displayedResources.map((r) => {
                const isSelected = selectedIds.includes(r.id);
                return (
                  <div
                    key={r.id}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 border-b last:border-0 ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => toggleResource(r.id)}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-input'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <TypeBadge type={r.type as 'phrase' | 'vocabulary' | 'paragraph'} />
                    <span className="text-xs font-mono text-muted-foreground">{r.code}</span>
                    <span className="text-sm truncate">{r.contentEs}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveList.isPending}>
              {saveList.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
