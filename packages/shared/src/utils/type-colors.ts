export const typeColors: Record<string, string> = {
  phrase: '#61bd4f',
  vocabulary: '#f2d600',
  paragraph: '#ff9f1a',
};

export const getTypeColor = (type: string): string => {
  return typeColors[type] ?? '#999999';
};
