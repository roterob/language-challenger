import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Search, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SearchWithTagsProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  activeTags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags: string[];
  placeholder?: string;
  className?: string;
}

export function SearchWithTags({
  searchValue,
  onSearchChange,
  activeTags,
  onTagsChange,
  availableTags,
  placeholder = 'Buscar…',
  className,
}: SearchWithTagsProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = availableTags.filter(
    (t) =>
      !activeTags.includes(t) &&
      (searchValue === '' || t.toLowerCase().includes(searchValue.toLowerCase())),
  );

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Resetear highlight cuando cambian las sugerencias
  useEffect(() => {
    setHighlighted(-1);
  }, [suggestions.length, open]);

  const addTag = useCallback(
    (tag: string) => {
      onTagsChange([...activeTags, tag]);
      onSearchChange('');
      setOpen(false);
      inputRef.current?.focus();
    },
    [activeTags, onTagsChange, onSearchChange],
  );

  const removeTag = (tag: string) => {
    onTagsChange(activeTags.filter((t) => t !== tag));
  };

  const handleInput = (v: string) => {
    onSearchChange(v);
    setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Backspace' && searchValue === '' && activeTags.length > 0) {
        removeTag(activeTags[activeTags.length - 1]);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      addTag(suggestions[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Backspace' && searchValue === '' && activeTags.length > 0) {
      removeTag(activeTags[activeTags.length - 1]);
    }
  };

  const showDropdown = open && suggestions.length > 0;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Campo combinado */}
      <div
        className={cn(
          'flex flex-wrap gap-1.5 items-center min-h-10 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background cursor-text',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />

        {/* Tags activos */}
        {activeTags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1 shrink-0">
            <Tag className="h-3 w-3" />
            {tag}
            <button
              type="button"
              className="rounded-full hover:bg-secondary-foreground/20 p-0.5 ml-0.5"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              tabIndex={-1}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {/* Input de texto */}
        <input
          ref={inputRef}
          value={searchValue}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={activeTags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Dropdown de sugerencias */}
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <p className="px-3 pt-2 pb-1 text-xs text-muted-foreground font-medium">Tags sugeridos</p>
          <ul className="pb-1 max-h-52 overflow-auto">
            {suggestions.map((tag, i) => (
              <li
                key={tag}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer',
                  i === highlighted ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground',
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(tag);
                }}
                onMouseEnter={() => setHighlighted(i)}
              >
                <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>{tag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
