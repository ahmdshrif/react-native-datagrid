import type { DataGridColumn } from './types';

export const CHECKBOX_COLUMN_WIDTH = 44;

export type GridLayout<T> = {
  /** Pinned data columns, in their original order. */
  pinned: DataGridColumn<T>[];
  /** Columns that scroll sideways. */
  scrolling: DataGridColumn<T>[];
  /** Whether the built-in checkbox column is shown (always pinned, always first). */
  checkbox: boolean;
  pinnedWidth: number;
  totalWidth: number;
};

export function computeLayout<T>(
  columns: readonly DataGridColumn<T>[],
  checkbox: boolean
): GridLayout<T> {
  const pinned: DataGridColumn<T>[] = [];
  const scrolling: DataGridColumn<T>[] = [];
  for (const column of columns) {
    if (column.pinned === 'left') pinned.push(column);
    else scrolling.push(column);
  }
  const sum = (cols: DataGridColumn<T>[]) =>
    cols.reduce((total, c) => total + c.width, 0);
  const pinnedWidth = sum(pinned) + (checkbox ? CHECKBOX_COLUMN_WIDTH : 0);
  return {
    pinned,
    scrolling,
    checkbox,
    pinnedWidth,
    totalWidth: pinnedWidth + sum(scrolling),
  };
}
