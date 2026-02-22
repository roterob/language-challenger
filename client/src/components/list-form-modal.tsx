import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saveListSchema } from '@language-challenger/shared';
import type { ListWithStats, Resource } from '@language-challenger/shared';
import type { z } from 'zod';
import { toast } from 'sonner';
import { useSaveList } from '@/hooks/use-lists';
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
import { Search, X, Check } from 'lucide-react';

type FormData = z.infer<typeof saveListSchema>;

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
    reset({
      title: list?.title || '',
      resourceIds: existingResourceIds,
    });
    setSearch('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list?.id]);
  const [selectedIds, setSelectedIds] = useState<string[]>(existingResourceIds);

  const { data: resourcesData } = useResources({ limit: 200, ...(search && { search }) });
  const allResources = resourcesData?.resources ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(saveListSchema),
    defaultValues: {
      title: list?.title || '',
      resourceIds: existingResourceIds,
    },
  });

  const toggleResource = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onSubmit = async (data: FormData) => {
    try {
      await saveList.mutateAsync({
        ...(isEdit ? { id: list.id } : {}),
        title: data.title,
        resourceIds: selectedIds,
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
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
            <Label>Recursos ({selectedIds.length} seleccionados)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar recursos…"
                className="pl-9"
              />
            </div>
            <div className="flex-1 overflow-y-auto border rounded-md max-h-[300px]">
              {allResources.map((r) => {
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
