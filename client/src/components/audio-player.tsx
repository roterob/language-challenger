import { useState, useRef, useCallback } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAudioLink } from '@language-challenger/shared';

interface AudioPlayerProps {
  audioId: string | undefined | null;
  compact?: boolean;
}

export function AudioPlayer({ audioId, compact = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const url = audioId ? getAudioLink(audioId) : null;

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !url) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.src = url;
      audio.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  }, [playing, url]);

  const handleEnded = () => setPlaying(false);

  if (!url) return null;

  return (
    <>
      <audio ref={audioRef} onEnded={handleEnded} />
      <Button
        type="button"
        variant="ghost"
        size={compact ? 'icon' : 'sm'}
        onClick={toggle}
        className={compact ? 'h-8 w-8' : ''}
        title="Reproducir audio"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        {!compact && <span className="ml-1">Audio</span>}
      </Button>
    </>
  );
}
