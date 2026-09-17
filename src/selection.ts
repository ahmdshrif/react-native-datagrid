import type { SelectionMode } from './types';

export type SelectAllState = 'none' | 'some' | 'all';

export function toggleSelection(
  selected: ReadonlySet<string>,
  key: string,
  mode: SelectionMode
): ReadonlySet<string> {
  if (mode === 'none') return selected;
  if (mode === 'single') {
    return selected.has(key) ? new Set() : new Set([key]);
  }
  const next = new Set(selected);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

export function getSelectAllState(
  selected: ReadonlySet<string>,
  keys: readonly string[]
): SelectAllState {
  if (keys.length === 0 || selected.size === 0) return 'none';
  let count = 0;
  for (const key of keys) {
    if (selected.has(key)) count++;
  }
  if (count === 0) return 'none';
  return count === keys.length ? 'all' : 'some';
}

/** Selects every key, or clears them when all are already selected. Keys outside `keys` are kept. */
export function toggleAll(
  selected: ReadonlySet<string>,
  keys: readonly string[]
): ReadonlySet<string> {
  const next = new Set(selected);
  if (getSelectAllState(selected, keys) === 'all') {
    for (const key of keys) next.delete(key);
  } else {
    for (const key of keys) next.add(key);
  }
  return next;
}
