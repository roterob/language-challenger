import { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Volume2,
  Trophy,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useExecution,
  useSaveExecutionConfig,
  useSaveResult,
  useRestartExecution,
  useFinishExecution,
  useStartTemporaryExecution,
} from '@/hooks/use-executions';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TypeBadge } from '@/components/type-badge';
import { getAudioLink } from '@language-challenger/shared';

type Mode = 'config' | 'run' | 'result' | 'review';

interface ListExecutionProps {
  executionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ListExecution({ executionId, open, onOpenChange }: ListExecutionProps) {
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(executionId);

  // sync when parent changes executionId
  useEffect(() => {
    setActiveExecutionId(executionId);
  }, [executionId]);

  const { data, refetch } = useExecution(activeExecutionId ?? undefined);
  const execution = data?.execution;

  const saveConfig = useSaveExecutionConfig();
  const saveResult = useSaveResult();
  const restart = useRestartExecution();
  const finish = useFinishExecution();
  const startTemporary = useStartTemporaryExecution();

  const [mode, setMode] = useState<Mode>('config');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [automatic, setAutomatic] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [questionLang, setQuestionLang] = useState<'es' | 'en'>('es');
  const [playQuestion, setPlayQuestion] = useState(false);
  const [playAnswer, setPlayAnswer] = useState(false);
  const [autoSeconds, setAutoSeconds] = useState(5);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const audioRef = useRef<HTMLAudioElement>(null);
  const reviewModeRef = useRef(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open && execution) {
      if (reviewModeRef.current) {
        reviewModeRef.current = false;
        setMode('review');
        setCurrentIndex(0);
        setShowAnswer(false);
        return;
      }
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
      setQuestionLang(config?.questionLang ?? 'es');
      setPlayQuestion(config?.playQuestion ?? false);
      setPlayAnswer(config?.playAnswer ?? false);
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

  // Auto-play question audio when playQuestion is enabled (manual mode)
  useEffect(() => {
    if (mode !== 'run' || automatic || !playQuestion) return;
    const audioId = questionLang === 'es' ? current?.contentEsAudio : current?.contentEnAudio;
    if (!audioId) return;
    if (audioRef.current) {
      audioRef.current.src = getAudioLink(audioId);
      audioRef.current.play().catch(() => {});
    }
  }, [mode, currentIndex, automatic, playQuestion, questionLang]);

  // Automatic mode timer
  useEffect(() => {
    if (mode !== 'run' || !automatic || showAnswer || !current) return;

    // Auto-play question audio in automatic mode
    const audioId = questionLang === 'es' ? current.contentEsAudio : current.contentEnAudio;
    if (audioId && audioRef.current && playQuestion) {
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
    if (!activeExecutionId) return;
    try {
      await saveConfig.mutateAsync({
        id: activeExecutionId,
        config: { automaticMode: automatic, shuffle, questionLang, playQuestion, playAnswer },
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
    if (!activeExecutionId || !current) return;

    // Play next question audio synchronously within user gesture context
    if (playQuestion && currentIndex + 1 < totalResources) {
      const next = resources[currentIndex + 1];
      const nextAudio = questionLang === 'es' ? next?.contentEsAudio : next?.contentEnAudio;
      if (nextAudio && audioRef.current) {
        audioRef.current.src = getAudioLink(nextAudio);
        audioRef.current.play().catch(() => {});
      }
    }

    try {
      await saveResult.mutateAsync({
        id: activeExecutionId,
        result: { resourceId: current.id, currentIndex, result: result === 'ok' },
      });
      await refetch();

      if (currentIndex + 1 >= totalResources) {
        await finish.mutateAsync(activeExecutionId);
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
    if (!activeExecutionId) return;
    try {
      await restart.mutateAsync(activeExecutionId);
      await refetch();
      setCurrentIndex(0);
      setShowAnswer(false);
      setMode('config');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const playAudio = (audioId: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newSrc = getAudioLink(audioId);
    // Si ya está reproduciendo el mismo, lo detiene (toggle)
    if (isAudioPlaying && audio.src.endsWith(newSrc)) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }
    audio.src = newSrc;
    audio.play().catch(() => {});
  };

  const handleReviewFailures = async () => {
    const failedIds = resources.filter((r) => r.result === false).map((r) => r.id);
    if (failedIds.length === 0) return;
    try {
      const res = await startTemporary.mutateAsync({
        name: `Repaso fallos — ${execution?.name ?? ''}`,
        tags: (execution as any)?.tags ?? [],
        resourceIds: failedIds,
      });
      const newExecId = (res as any).execution?.id;
      if (newExecId) {
        reviewModeRef.current = true;
        setActiveExecutionId(newExecId);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <audio
          ref={audioRef}
          onPlay={() => setIsAudioPlaying(true)}
          onEnded={() => setIsAudioPlaying(false)}
          onPause={() => setIsAudioPlaying(false)}
        />

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
              <div className="flex items-center justify-between">
                <Label htmlFor="playQuestion" className="cursor-pointer">
                  Reproducir audio de la pregunta automáticamente
                </Label>
                <Switch
                  id="playQuestion"
                  checked={playQuestion}
                  onCheckedChange={setPlayQuestion}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="playAnswer" className="cursor-pointer">
                  Reproducir audio al mostrar la respuesta
                </Label>
                <Switch id="playAnswer" checked={playAnswer} onCheckedChange={setPlayAnswer} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="cursor-pointer">Idioma de la pregunta</Label>
                <div className="flex rounded-md border overflow-hidden text-sm">
                  <button
                    type="button"
                    className={`px-4 py-1.5 transition-colors ${
                      questionLang === 'es'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted'
                    }`}
                    onClick={() => setQuestionLang('es')}
                  >
                    🇪🇸 Español
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-1.5 transition-colors ${
                      questionLang === 'en'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted'
                    }`}
                    onClick={() => setQuestionLang('en')}
                  >
                    🇬🇧 Inglés
                  </button>
                </div>
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
              <p className="text-xl font-semibold">
                {questionLang === 'es' ? current.contentEs : current.contentEn}
              </p>

              {(questionLang === 'es' ? current.contentEsAudio : current.contentEnAudio) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    playAudio(
                      (questionLang === 'es' ? current.contentEsAudio : current.contentEnAudio)!,
                    )
                  }
                  className="gap-2"
                >
                  {isAudioPlaying ? (
                    <>
                      <span className="animate-pulse h-2 w-2 rounded-full bg-primary inline-block" />{' '}
                      Reproduciendo…
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" /> Audio pregunta
                    </>
                  )}
                </Button>
              )}

              {showAnswer ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted p-4 space-y-2">
                    <p className="text-lg font-medium text-primary">
                      {questionLang === 'es' ? current.contentEn : current.contentEs}
                    </p>
                    {(questionLang === 'es' ? current.contentEnAudio : current.contentEsAudio) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          playAudio(
                            (questionLang === 'es'
                              ? current.contentEnAudio
                              : current.contentEsAudio)!,
                          )
                        }
                        className="gap-2 text-muted-foreground"
                      >
                        {isAudioPlaying ? (
                          <>
                            <span className="animate-pulse h-2 w-2 rounded-full bg-primary inline-block" />{' '}
                            Reproduciendo…
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-4 w-4" /> Audio respuesta
                          </>
                        )}
                      </Button>
                    )}
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
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setShowAnswer(true);
                    if (playAnswer && current?.contentEnAudio && audioRef.current) {
                      audioRef.current.src = getAudioLink(current.contentEnAudio);
                      audioRef.current.play().catch(() => {});
                    }
                  }}
                >
                  Mostrar respuesta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}

        {mode === 'review' && current && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>
                  Repaso — {currentIndex + 1} / {totalResources}
                </span>
              </DialogTitle>
            </DialogHeader>
            <Progress value={((currentIndex + 1) / totalResources) * 100} className="h-2" />

            <div className="py-4 text-center space-y-4">
              <TypeBadge type={current.type} />
              <p className="text-xl font-semibold">{current.contentEs}</p>
              {current.contentEsAudio && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playAudio(current.contentEsAudio!)}
                  className="gap-2"
                >
                  {isAudioPlaying ? (
                    <>
                      <span className="animate-pulse h-2 w-2 rounded-full bg-primary inline-block" />{' '}
                      Reproduciendo…
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" /> Audio pregunta
                    </>
                  )}
                </Button>
              )}
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-lg font-medium text-primary">{current.contentEn}</p>
                {current.contentEnAudio && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => playAudio(current.contentEnAudio!)}
                    className="gap-2 text-muted-foreground"
                  >
                    {isAudioPlaying ? (
                      <>
                        <span className="animate-pulse h-2 w-2 rounded-full bg-primary inline-block" />{' '}
                        Reproduciendo…
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4" /> Audio respuesta
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => i - 1)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                {currentIndex + 1 < totalResources ? (
                  <Button size="lg" onClick={() => setCurrentIndex((i) => i + 1)}>
                    Siguiente
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Button size="lg" onClick={() => onOpenChange(false)}>
                    Cerrar
                  </Button>
                )}
              </div>
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

              <div className="flex gap-3 justify-center flex-wrap">
                <Button variant="outline" onClick={handleRestart} disabled={restart.isPending}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Repetir
                </Button>
                {failCount > 0 && (
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={handleReviewFailures}
                    disabled={startTemporary.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Repasar fallos ({failCount})
                  </Button>
                )}
                <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
