import type { DataGridColumn } from './types';

export function getCellValue<T>(row: T, column: DataGridColumn<T>): unknown {
  if (column.getValue) return column.getValue(row);
  return (row as Record<string, unknown>)[column.key];
}

/** The text a cell shows: `format` when set, otherwise the value as a string. */
export function getCellText<T>(row: T, column: DataGridColumn<T>): string {
  const value = getCellValue(row, column);
  if (column.format) return column.format(value, row);
  return value == null ? '' : String(value);
}
