import { getCellText, getCellValue } from './cell';
import type { ColumnFilter, ColumnFilters, DataGridColumn } from './types';

const hasNormalize = typeof ''.normalize === 'function';

/** Lowercase and strip accents, so "cafe" matches "Café". */
export function normalizeSearchText(text: string): string {
  const lower = text.toLowerCase();
  if (!hasNormalize) return lower;
  return lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * One searchable string per row, built from what each column shows.
 * Build it once per `data`/`columns` change; searching then only scans strings.
 */
export function buildSearchIndex<T>(
  data: readonly T[],
  columns: readonly DataGridColumn<T>[]
): string[] {
  const searchable = columns.filter((c) => c.searchable !== false);
  return data.map((row) => {
    let text = '';
    for (const column of searchable) {
      const part = column.getSearchText
        ? column.getSearchText(row)
        : getCellText(row, column);
      if (part) text += (text ? '\n' : '') + part;
    }
    return normalizeSearchText(text);
  });
}

function toComparable(value: unknown): unknown {
  return value instanceof Date ? value.getTime() : value;
}

/** A finite number for range checks, or undefined for anything else (NaN, invalid dates, strings). */
function toRangeNumber(value: unknown): number | undefined {
  const comparable = toComparable(value);
  return typeof comparable === 'number' && Number.isFinite(comparable)
    ? comparable
    : undefined;
}

export function matchesColumnFilter<T>(
  row: T,
  column: DataGridColumn<T>,
  filter: ColumnFilter<T>
): boolean {
  switch (filter.type) {
    case 'text': {
      const query = normalizeSearchText(filter.value.trim());
      if (!query) return true;
      return normalizeSearchText(getCellText(row, column)).includes(query);
    }
    case 'values': {
      if (filter.values.length === 0) return true;
      const value = toComparable(getCellValue(row, column));
      return filter.values.some((v) => Object.is(toComparable(v), value));
    }
    case 'range': {
      // Bounds that are not valid numbers or dates are ignored.
      // Cells that are not valid numbers or dates never match.
      const min = toRangeNumber(filter.min);
      const max = toRangeNumber(filter.max);
      if (min === undefined && max === undefined) return true;
      const value = toRangeNumber(getCellValue(row, column));
      if (value === undefined) return false;
      if (min !== undefined && value < min) return false;
      if (max !== undefined && value > max) return false;
      return true;
    }
    case 'custom':
      return filter.test(row);
  }
}

export type FilterOptions<T> = {
  searchText?: string;
  columnFilters?: ColumnFilters<T>;
  /** Result of `buildSearchIndex` for the same data and columns. Built on demand when omitted. */
  searchIndex?: readonly string[];
};

/**
 * Keeps rows that match the search text and every column filter.
 * Returns `data` itself when nothing filters.
 */
export function filterRows<T>(
  data: readonly T[],
  columns: readonly DataGridColumn<T>[],
  { searchText, columnFilters, searchIndex }: FilterOptions<T>
): readonly T[] {
  const query = searchText ? normalizeSearchText(searchText.trim()) : '';
  const active: [DataGridColumn<T>, ColumnFilter<T>][] = [];
  if (columnFilters) {
    for (const column of columns) {
      const filter = columnFilters[column.key];
      if (filter) active.push([column, filter]);
    }
  }
  if (!query && active.length === 0) return data;

  const index = query ? (searchIndex ?? buildSearchIndex(data, columns)) : null;
  const result: T[] = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i] as T;
    if (index && !(index[i] ?? '').includes(query)) continue;
    let keep = true;
    for (const [column, filter] of active) {
      if (!matchesColumnFilter(row, column, filter)) {
        keep = false;
        break;
      }
    }
    if (keep) result.push(row);
  }
  return result;
}
