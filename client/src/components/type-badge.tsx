import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { typeColors } from '@language-challenger/shared';

const typeBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      type: {
        phrase: '',
        vocabulary: '',
        paragraph: '',
      },
    },
  },
);

interface TypeBadgeProps {
  type: 'phrase' | 'vocabulary' | 'paragraph';
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const color = typeColors[type];
  return (
    <span
      className={cn(typeBadgeVariants({ type }), className)}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {type}
    </span>
  );
}
