import { getCellValue } from './cell';
import type { DataGridColumn, SortState } from './types';

const collator =
  typeof Intl !== 'undefined' && typeof Intl.Collator === 'function'
    ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
    : null;

/** Ascending comparison for non-null cell values. */
export function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') {
    if (Number.isNaN(a)) return Number.isNaN(b) ? 0 : 1;
    if (Number.isNaN(b)) return -1;
    return a - b;
  }
  if (typeof a === 'bigint' && typeof b === 'bigint') {
    return a < b ? -1 : a > b ? 1 : 0;
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b ? 0 : a ? 1 : -1;
  }
  const sa = String(a);
  const sb = String(b);
  if (collator) return collator.compare(sa, sb);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

/**
 * Returns a new sorted array, or `data` itself when there is nothing to sort.
 * Stable, and empty values (null / undefined) always go last.
 */
export function sortRows<T>(
  data: readonly T[],
  columns: readonly DataGridColumn<T>[],
  sort: SortState | null | undefined
): readonly T[] {
  if (!sort) return data;
  const column = columns.find((c) => c.key === sort.columnKey);
  if (!column) return data;

  const dir = sort.direction === 'asc' ? 1 : -1;
  const compare = column.compare;
  const entries = data.map((row, index) => ({
    row,
    index,
    value: compare ? undefined : getCellValue(row, column),
  }));

  entries.sort((x, y) => {
    let result: number;
    if (compare) {
      result = compare(x.row, y.row) * dir;
    } else {
      const xEmpty = x.value == null;
      const yEmpty = y.value == null;
      if (xEmpty || yEmpty) {
        if (xEmpty && yEmpty) return x.index - y.index;
        return xEmpty ? 1 : -1;
      }
      result = compareValues(x.value, y.value) * dir;
    }
    return result || x.index - y.index;
  });

  return entries.map((e) => e.row);
}

/** Header tap cycle: unsorted → ascending → descending → unsorted. */
export function nextSort(
  current: SortState | null | undefined,
  columnKey: string
): SortState | null {
  if (!current || current.columnKey !== columnKey) {
    return { columnKey, direction: 'asc' };
  }
  if (current.direction === 'asc') return { columnKey, direction: 'desc' };
  return null;
}
