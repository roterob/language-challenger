import { useState, useEffect } from 'react';

interface PersistedSearchState {
  search: string;
  tagFilter: string[];
  typeFilter?: string;
}

function load(key: string): PersistedSearchState {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { search: '', tagFilter: [], typeFilter: '' };
}

function save(key: string, state: PersistedSearchState) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function usePersistedSearch(storageKey: string, withTypeFilter = false) {
  const initial = load(storageKey);

  const [search, setSearchRaw] = useState(initial.search ?? '');
  const [tagFilter, setTagFilterRaw] = useState<string[]>(initial.tagFilter ?? []);
  const [typeFilter, setTypeFilterRaw] = useState(initial.typeFilter ?? '');

  // Persist on every change
  useEffect(() => {
    save(storageKey, { search, tagFilter, ...(withTypeFilter ? { typeFilter } : {}) });
  }, [search, tagFilter, typeFilter, storageKey, withTypeFilter]);

  const setSearch = (v: string) => setSearchRaw(v);
  const setTagFilter = (v: string[]) => setTagFilterRaw(v);
  const setTypeFilter = (v: string) => setTypeFilterRaw(v);

  return { search, setSearch, tagFilter, setTagFilter, typeFilter, setTypeFilter };
}
