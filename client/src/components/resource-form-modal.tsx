import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saveResourceSchema } from '@language-challenger/shared';
import type { Resource } from '@language-challenger/shared';
import type { z } from 'zod';
import { toast } from 'sonner';
import { useSaveResource } from '@/hooks/use-resources';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FormData = z.infer<typeof saveResourceSchema>;

interface ResourceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: Resource | null;
}

export function ResourceFormModal({ open, onOpenChange, resource }: ResourceFormProps) {
  const save = useSaveResource();
  const isEdit = !!resource;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(saveResourceSchema),
    defaultValues: resource
      ? {
          type: resource.type as 'phrase' | 'vocabulary' | 'paragraph',
          contentEs: resource.contentEs,
          contentEn: resource.contentEn,
          tags: resource.tags || [],
          audioId: resource.audioId || undefined,
        }
      : {
          type: 'phrase',
          contentEs: '',
          contentEn: '',
          tags: [],
        },
  });

  const [tagInput, setTagInput] = useState('');
  const tags = watch('tags') || [];

  const onSubmit = async (data: FormData) => {
    try {
      await save.mutateAsync({
        ...(isEdit ? { id: resource.id } : {}),
        ...data,
      });
      toast.success(isEdit ? 'Recurso actualizado' : 'Recurso creado');
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setValue('tags', [...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setValue(
      'tags',
      tags.filter((t) => t !== tag),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar recurso' : 'Nuevo recurso'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={watch('type')}
              onValueChange={(v) => setValue('type', v as 'phrase' | 'vocabulary' | 'paragraph')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phrase">Phrase</SelectItem>
                <SelectItem value="vocabulary">Vocabulary</SelectItem>
                <SelectItem value="paragraph">Paragraph</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentEs">Contenido (Español)</Label>
            <Input id="contentEs" {...register('contentEs')} />
            {errors.contentEs && (
              <p className="text-xs text-destructive">{errors.contentEs.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentEn">Contenido (Inglés)</Label>
            <Input id="contentEn" {...register('contentEn')} />
            {errors.contentEn && (
              <p className="text-xs text-destructive">{errors.contentEn.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="audioId">Audio ID (Google Drive)</Label>
            <Input id="audioId" {...register('audioId')} placeholder="Opcional" />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Añadir tag…"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                +
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs cursor-pointer hover:bg-destructive/20"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
