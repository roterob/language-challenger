import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useImportTasks, useActiveTasks, uploadImport } from '@/hooks/use-imports';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@language-challenger/shared';

function ActiveTasks() {
  const { data } = useActiveTasks();
  const tasks = data?.tasks ?? [];

  if (tasks.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Importaciones activas</h2>
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{task.filename}</span>
              <Badge variant={task.status === 'processing' ? 'default' : 'secondary'}>
                {task.status === 'processing' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                {task.status}
              </Badge>
            </div>
            {task.progress !== undefined && task.progress !== null && (
              <Progress value={task.progress} className="h-2" />
            )}
            {task.message && (
              <p className="text-xs text-muted-foreground mt-1">{task.message}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ImportsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { data, isLoading } = useImportTasks({ limit: 50 });
  const tasks = data?.tasks ?? [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await uploadImport(file);
      toast.success('Archivo subido. La importación ha comenzado.');
    } catch (err: any) {
      toast.error(err.message || 'Error al subir archivo');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const statusIcon: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />,
    processing: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
    pending: <Loader2 className="h-4 w-4 text-muted-foreground" />,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Importar recursos</h1>
      </div>

      {/* Upload zone */}
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Subir archivo JSON</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sube un archivo JSON con recursos para importar. Formato Meteor o nuevo formato.
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleUpload}
              className="hidden"
            />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo…
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Seleccionar archivo
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ActiveTasks />

      {/* Historial */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Historial de importaciones</h2>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando…</p>
        ) : tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay importaciones previas</p>
        ) : (
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Archivo</th>
                  <th className="text-left p-3 font-medium">Estado</th>
                  <th className="text-center p-3 font-medium">Creados</th>
                  <th className="text-center p-3 font-medium">Actualizados</th>
                  <th className="text-center p-3 font-medium">Errores</th>
                  <th className="text-left p-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">{t.filename}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {statusIcon[t.status] || null}
                        <span className="capitalize">{t.status}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center text-green-600">{t.created ?? 0}</td>
                    <td className="p-3 text-center text-blue-600">{t.updated ?? 0}</td>
                    <td className="p-3 text-center text-red-600">{t.errors ?? 0}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {t.createdAt ? formatRelativeTime(new Date(t.createdAt)) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
