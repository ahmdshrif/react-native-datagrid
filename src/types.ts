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

/** Filter for one column. Rows must match every active column filter. */
export type ColumnFilter<T> =
  /** Cell text contains the value (ignores case and accents). */
  | { type: 'text'; value: string }
  /** Cell value equals one of the values. An empty list matches everything. */
  | { type: 'values'; values: readonly unknown[] }
  /**
   * Numeric or date cell value between min and max, inclusive.
   * Empty, NaN, invalid-date and non-numeric cells never match. Invalid bounds are ignored.
   */
  | { type: 'range'; min?: number | Date | null; max?: number | Date | null }
  /** Your own test. */
  | { type: 'custom'; test: (row: T) => boolean };

/** Column filters by column key. `null` or `undefined` means no filter for that column. */
export type ColumnFilters<T> = Readonly<
  Record<string, ColumnFilter<T> | null | undefined>
>;

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
  /** Include this column in `searchText` matching. Default true. */
  searchable?: boolean;
  /** Text used for search. Defaults to the shown text (`format` or the value). */
  getSearchText?: (row: T) => string;
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

  /**
   * Keep the order of `data`. The header still shows `sort` and taps still call `onSortChange`,
   * so the app can sort (for example on a server) and pass new data.
   */
  manualSorting?: boolean;

  /** Show only rows whose searchable columns contain this text (ignores case and accents). */
  searchText?: string;
  /** Show only rows matching every filter, by column key. */
  columnFilters?: ColumnFilters<T>;
  /** Called after filtering with the number of visible rows. */
  onFilteredCountChange?: (count: number) => void;
  /**
   * Show `data` without applying `searchText` or `columnFilters` locally.
   * Use when the app filters (for example on a server).
   */
  manualFiltering?: boolean;

  /** First load. Shows a loading state only while there are no rows; existing rows stay visible. */
  loading?: boolean;
  /** Loading more rows at the end of the list. Shows a footer spinner. */
  loadingMore?: boolean;
  /** Pull-to-refresh state. */
  refreshing?: boolean;
  /** Enables pull-to-refresh. */
  onRefresh?: () => void;
  /** Called when scrolling near the end, to load the next page. */
  onEndReached?: () => void;
  /** How close to the end `onEndReached` fires, in visible list lengths. Default 0.5. */
  onEndReachedThreshold?: number;
  /** Error message. Replaces the empty state when there are no rows, otherwise shows in the footer. */
  error?: string | null;
  /** Shows a Retry button next to `error`. */
  onRetry?: () => void;
  /** Text under the loading spinner. Default "Loading". */
  loadingText?: string;

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

  /** Shown when there are no rows to show (including when filters hide every row). */
  emptyText?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};
