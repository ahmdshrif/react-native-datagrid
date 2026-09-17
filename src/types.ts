import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { DataGridTheme } from './theme';

export type SortDirection = 'asc' | 'desc';

export type SortState = {
  columnKey: string;
  direction: SortDirection;
};

export type SelectionMode = 'none' | 'single' | 'multiple';

export type CellAlign = 'left' | 'center' | 'right';

export type CellRenderInfo<T> = {
  row: T;
  rowIndex: number;
  value: unknown;
  column: DataGridColumn<T>;
  selected: boolean;
};

export type DataGridColumn<T> = {
  /** Unique column id. Also used to read `row[key]` when `getValue` is not set. */
  key: string;
  /** Text shown in the header. */
  title: string;
  /** Column width in points. */
  width: number;
  /** Keep the column visible on the left while scrolling sideways. */
  pinned?: 'left';
  align?: CellAlign;
  /** Tap the header to cycle ascending → descending → unsorted. */
  sortable?: boolean;
  /** Read the cell value. Defaults to `row[key]`. */
  getValue?: (row: T) => unknown;
  /** Custom sort comparator for ascending order. Defaults to comparing `getValue` results. */
  compare?: (a: T, b: T) => number;
  /** Turn the value into display text. Ignored when `renderCell` is set. */
  format?: (value: unknown, row: T) => string;
  /** Render custom cell content. */
  renderCell?: (info: CellRenderInfo<T>) => ReactNode;
};

export type DataGridProps<T> = {
  data: readonly T[];
  columns: readonly DataGridColumn<T>[];
  /** Returns a stable, unique key for each row. */
  keyExtractor: (row: T, index: number) => string;

  /** Row height in points. Rows have a fixed height. Default 44. */
  rowHeight?: number;
  /** Header height in points. Default 40. */
  headerHeight?: number;
  /** Alternate row background. Default true. */
  striped?: boolean;

  /** Controlled sort. Pass `null` for unsorted. */
  sort?: SortState | null;
  /** Initial sort when uncontrolled. */
  defaultSort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;

  /** `multiple` adds a pinned checkbox column. Default `none`. */
  selectionMode?: SelectionMode;
  /** Controlled selection. */
  selectedKeys?: readonly string[];
  /** Initial selection when uncontrolled. */
  defaultSelectedKeys?: readonly string[];
  onSelectionChange?: (keys: string[]) => void;

  onRowPress?: (row: T, rowIndex: number) => void;

  /** `auto` follows the device setting. Default `auto`. */
  colorScheme?: 'auto' | 'light' | 'dark';
  /** Override individual theme tokens. */
  theme?: Partial<DataGridTheme>;

  /** Shown when `data` is empty. */
  emptyText?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};
