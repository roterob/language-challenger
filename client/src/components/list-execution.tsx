import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Settings,
  ArrowRight,
  Volume2,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useExecution,
  useSaveExecutionConfig,
  useSaveResult,
  useRestartExecution,
  useFinishExecution,
} from '@/hooks/use-executions';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TypeBadge } from '@/components/type-badge';
import { AudioPlayer } from '@/components/audio-player';
import { getAudioLink } from '@language-challenger/shared';

type Mode = 'config' | 'run' | 'result';

interface ListExecutionProps {
  executionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ListExecution({ executionId, open, onOpenChange }: ListExecutionProps) {
  const { data, refetch } = useExecution(executionId ?? undefined);
  const execution = data?.execution;

  const saveConfig = useSaveExecutionConfig();
  const saveResult = useSaveResult();
  const restart = useRestartExecution();
  const finish = useFinishExecution();

  const [mode, setMode] = useState<Mode>('config');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [automatic, setAutomatic] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [autoSeconds, setAutoSeconds] = useState(5);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Reset on open
  useEffect(() => {
    if (open && execution) {
      const results = execution.results || [];
      // count all answered (true or false, not null)
      const answeredCount = results.filter(
        (r) => r.result !== null && r.result !== undefined,
      ).length;
      if (!execution.inProgress) {
        setMode('result');
      } else if (answeredCount > 0) {
        // execution already started: resume where it left off
        setMode('run');
        setCurrentIndex(answeredCount);
      } else {
        setMode('config');
      }
      setShowAnswer(false);
      const config = execution.config as any;
      setAutomatic(config?.automaticMode ?? false);
      setShuffle(config?.shuffle ?? false);
    }
  }, [open, execution?.id]);

  const resources =
    execution?.results?.map((r) => ({
      ...r.resource,
      resultId: r.id,
      answered: r.result !== null && r.result !== undefined,
      result: r.result,
    })) ?? [];

  const current = resources[currentIndex];
  const totalResources = resources.length;
  const answeredCount = resources.filter((r) => r.answered).length;
  const okCount = resources.filter((r) => r.result === true).length;
  const failCount = resources.filter((r) => r.result === false).length;
  const progressPercent = totalResources > 0 ? (answeredCount / totalResources) * 100 : 0;

  // Automatic mode timer
  useEffect(() => {
    if (mode !== 'run' || !automatic || showAnswer || !current) return;

    // Auto-play audio
    const audioId = current.audioId;
    if (audioId && audioRef.current) {
      audioRef.current.src = getAudioLink(audioId);
      audioRef.current.play().catch(() => {});
    }

    timerRef.current = setTimeout(() => {
      setShowAnswer(true);
    }, autoSeconds * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mode, automatic, currentIndex, showAnswer, current, autoSeconds]);

  const handleStart = async () => {
    if (!executionId) return;
    try {
      await saveConfig.mutateAsync({
        id: executionId,
        config: { automaticMode: automatic, shuffle },
      });
      await refetch();
      setCurrentIndex(0);
      setShowAnswer(false);
      setMode('run');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAnswer = async (result: 'ok' | 'fail') => {
    if (!executionId || !current) return;
    try {
      await saveResult.mutateAsync({
        id: executionId,
        result: { resourceId: current.id, currentIndex, result: result === 'ok' },
      });
      await refetch();

      if (currentIndex + 1 >= totalResources) {
        // All answered, finish
        await finish.mutateAsync(executionId);
        await refetch();
        setMode('result');
      } else {
        setCurrentIndex((i) => i + 1);
        setShowAnswer(false);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRestart = async () => {
    if (!executionId) return;
    try {
      await restart.mutateAsync(executionId);
      await refetch();
      setCurrentIndex(0);
      setShowAnswer(false);
      setMode('config');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <audio ref={audioRef} />

        {mode === 'config' && (
          <>
            <DialogHeader>
              <DialogTitle>Configuración</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <p className="text-sm text-muted-foreground">
                {execution?.listTitle || 'Ejecución temporal'} — {totalResources} recursos
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="automatic" className="cursor-pointer">
                  Modo automático (muestra respuesta tras {autoSeconds}s)
                </Label>
                <Switch id="automatic" checked={automatic} onCheckedChange={setAutomatic} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="shuffle" className="cursor-pointer">
                  Barajar recursos
                </Label>
                <Switch id="shuffle" checked={shuffle} onCheckedChange={setShuffle} />
              </div>
              <Button className="w-full" onClick={handleStart} disabled={saveConfig.isPending}>
                <Play className="mr-2 h-4 w-4" />
                Comenzar
              </Button>
            </div>
          </>
        )}

        {mode === 'run' && current && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>
                  {currentIndex + 1} / {totalResources}
                </span>
                <div className="flex items-center gap-2 text-sm font-normal">
                  <span className="text-green-600">{okCount} ✓</span>
                  <span className="text-red-600">{failCount} ✗</span>
                </div>
              </DialogTitle>
            </DialogHeader>
            <Progress value={progressPercent} className="h-2" />

            <div className="py-6 text-center space-y-4">
              <TypeBadge type={current.type} />
              <p className="text-xl font-semibold">{current.contentEs}</p>

              {current.audioId && <AudioPlayer audioId={current.audioId} />}

              {showAnswer ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-lg font-medium text-primary">{current.contentEn}</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleAnswer('fail')}
                      disabled={saveResult.isPending}
                    >
                      <XCircle className="mr-2 h-5 w-5" />
                      No lo sabía
                    </Button>
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleAnswer('ok')}
                      disabled={saveResult.isPending}
                    >
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Lo sabía
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="lg" onClick={() => setShowAnswer(true)}>
                  Mostrar respuesta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}

        {mode === 'result' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Resultado
              </DialogTitle>
            </DialogHeader>
            <div className="py-6 text-center space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-green-50 p-4">
                  <div className="text-3xl font-bold text-green-600">{okCount}</div>
                  <div className="text-sm text-muted-foreground">Aciertos</div>
                </div>
                <div className="rounded-lg bg-red-50 p-4">
                  <div className="text-3xl font-bold text-red-600">{failCount}</div>
                  <div className="text-sm text-muted-foreground">Fallos</div>
                </div>
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {totalResources > 0 ? `${Math.round((okCount / totalResources) * 100)}%` : '—'}
                  </div>
                  <div className="text-sm text-muted-foreground">Ratio</div>
                </div>
              </div>

              {/* Detalle por recurso */}
              <div className="max-h-[200px] overflow-y-auto rounded-md border text-left">
                {resources.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-3 py-2 border-b last:border-0 text-sm ${
                      r.result === true ? 'bg-green-50/50' : 'bg-red-50/50'
                    }`}
                  >
                    {r.result === true ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <span className="truncate">{r.contentEs}</span>
                    <span className="ml-auto text-xs text-muted-foreground truncate">
                      {r.contentEn}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleRestart} disabled={restart.isPending}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Repetir
                </Button>
                <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
