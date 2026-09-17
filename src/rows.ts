import { filterRows } from './filter';
import { sortRows } from './sort';
import type { ColumnFilters, DataGridColumn, SortState } from './types';

export type VisibleRowsOptions<T> = {
  sort?: SortState | null;
  /** Keep `data` order; the app sorts (for example on a server). */
  manualSorting?: boolean;
  searchText?: string;
  columnFilters?: ColumnFilters<T>;
  /** Show `data` as is; the app filters (for example on a server). */
  manualFiltering?: boolean;
  searchIndex?: readonly string[];
};

/** Rows the grid shows: filtered, then sorted, unless the app handles either step. */
export function getVisibleRows<T>(
  data: readonly T[],
  columns: readonly DataGridColumn<T>[],
  {
    sort,
    manualSorting = false,
    searchText,
    columnFilters,
    manualFiltering = false,
    searchIndex,
  }: VisibleRowsOptions<T>
): readonly T[] {
  const filtered = manualFiltering
    ? data
    : filterRows(data, columns, { searchText, columnFilters, searchIndex });
  return manualSorting ? filtered : sortRows(filtered, columns, sort);
}
