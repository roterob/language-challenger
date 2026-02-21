import { parseDate } from './date-helpers';

export interface FilterField {
  name: string;
  type: 'select' | 'date';
  options: string[];
}

export interface ParsedFilters {
  type?: string;
  from?: Date;
  inProgress?: boolean;
  automatic?: boolean;
  favourite?: boolean;
  lastResult?: boolean;
  tags: string[];
}

const filterFields: FilterField[] = [
  { name: 'type', type: 'select', options: ['phrase', 'vocabulary', 'paragraph'] },
  { name: 'from', type: 'date', options: ['2 hours ago', 'yesterday', 'last month'] },
  { name: 'state', type: 'select', options: ['in progress', 'finished'] },
  { name: 'automatic', type: 'select', options: ['yes', 'no'] },
  { name: 'favourite', type: 'select', options: ['yes', 'no'] },
  { name: 'result', type: 'select', options: ['failed', 'correct'] },
];

/**
 * Parse an array of tag strings into structured filters.
 * Supports format "key:value" for special filters and plain strings for tag matching.
 */
export const buildFilters = (tags: string[]): ParsedFilters => {
  const normalTags: string[] = [];
  const result: ParsedFilters = { tags: [] };

  if (!tags || tags.length === 0) {
    return result;
  }

  for (const tag of tags) {
    if (tag.includes(':')) {
      const colonIndex = tag.indexOf(':');
      const name = tag.substring(0, colonIndex).trim();
      const value = tag.substring(colonIndex + 1).trim();

      switch (name) {
        case 'type':
          if (['phrase', 'vocabulary', 'paragraph'].includes(value)) {
            result.type = value;
          }
          break;
        case 'from': {
          const date = parseDate(value);
          if (date) {
            result.from = date;
          }
          break;
        }
        case 'state':
          result.inProgress = value === 'in progress';
          break;
        case 'automatic':
          result.automatic = value === 'yes';
          break;
        case 'favourite':
          result.favourite = value === 'yes';
          break;
        case 'result':
          result.lastResult = value === 'correct';
          break;
      }
    } else {
      normalTags.push(tag);
    }
  }

  result.tags = normalTags;
  return result;
};

export { filterFields };
