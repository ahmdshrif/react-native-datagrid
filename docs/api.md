# API

## `<DataGrid />`

The grid fills its parent (`flex: 1`), so give the parent a height.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `readonly T[]` | required | Rows. |
| `columns` | `DataGridColumn<T>[]` | required | Column definitions. Memoize them, or every row re-renders. |
| `keyExtractor` | `(row, index) => string` | required | Unique key per row. Use a stable ID from the row, not the index. |
| `rowHeight` | `number` | `44` | Fixed row height. |
| `headerHeight` | `number` | `40` | Header height. |
| `striped` | `boolean` | `true` | Alternate row backgrounds. |
| `sort` | `SortState \| null` | | Controlled sort. |
| `defaultSort` | `SortState \| null` | `null` | Initial sort when uncontrolled. |
| `onSortChange` | `(sort) => void` | | Called when a header is tapped. |
| `manualSorting` | `boolean` | `false` | Keep the order of `data`; the header still shows `sort` and taps still call `onSortChange`. |
| `searchText` | `string` | | Show rows whose searchable columns contain this text. |
| `columnFilters` | `ColumnFilters<T>` | | Show rows matching every filter, by column key. |
| `manualFiltering` | `boolean` | `false` | Show `data` without applying `searchText` or `columnFilters`. |
| `onFilteredCountChange` | `(count) => void` | | Number of rows left after filtering. |
| `selectionMode` | `'none' \| 'single' \| 'multiple'` | `'none'` | `multiple` adds a pinned checkbox column. |
| `selectedKeys` | `readonly string[]` | | Controlled selection. |
| `defaultSelectedKeys` | `readonly string[]` | `[]` | Initial selection when uncontrolled. |
| `onSelectionChange` | `(keys: string[]) => void` | | Called with all selected keys. |
| `onRowPress` | `(row, index) => void` | | Row tap. In `multiple` mode, setting this makes row taps call it instead of toggling selection. |
| `loading` | `boolean` | `false` | First load. Shows a spinner only while there are no rows. |
| `loadingText` | `string` | `'Loading'` | Text under the first-load spinner. |
| `loadingMore` | `boolean` | `false` | Shows a spinner below the last row. |
| `refreshing` | `boolean` | | Pull-to-refresh state. |
| `onRefresh` | `() => void` | | Enables pull-to-refresh. |
| `onEndReached` | `() => void` | | Called near the end of the list, to load the next page. |
| `onEndReachedThreshold` | `number` | `0.5` | How far from the end `onEndReached` fires, in visible list lengths. |
| `error` | `string \| null` | | Error message. Replaces the empty state when there are no rows, otherwise shows below the last row. |
| `onRetry` | `() => void` | | Shows a Retry button next to `error`. |
| `colorScheme` | `'auto' \| 'light' \| 'dark'` | `'auto'` | `auto` follows the device. |
| `theme` | `Partial<DataGridTheme>` | | Override theme tokens. See [theming](theming.md). |
| `emptyText` | `string` | `'No rows'` | Shown when there are no rows to show. |
| `style` | `StyleProp<ViewStyle>` | | Container style. |
| `testID` | `string` | | Also sets `${testID}-list` and `${testID}-horizontal`. |

## `DataGridColumn<T>`

| Option | Type | Description |
| --- | --- | --- |
| `key` | `string` | Unique id. Also reads `row[key]` when `getValue` is not set. |
| `title` | `string` | Header text. |
| `width` | `number` | Width in points. |
| `pinned` | `'left'` | Keep the column visible while scrolling sideways. Pinned columns move to the front. |
| `align` | `'left' \| 'center' \| 'right'` | Cell alignment. Default `left`. Right-aligned cells use tabular figures. |
| `sortable` | `boolean` | Let users sort by tapping the header. |
| `getValue` | `(row) => unknown` | Read the value used for display and sorting. |
| `compare` | `(a, b) => number` | Custom ascending comparator. Reversed automatically for descending. |
| `format` | `(value, row) => string` | Display text. Ignored when `renderCell` is set. |
| `renderCell` | `(info) => ReactNode` | Custom cell content. `info` is `{ row, rowIndex, value, column, selected }`. |
| `searchable` | `boolean` | Include in `searchText` matching. Default `true`. |
| `getSearchText` | `(row) => string` | Text used for search. Defaults to the shown text. |

## Sorting

Tapping a sortable header cycles ascending → descending → unsorted.

Sorting is stable, and empty values (`null`, `undefined`) always go last, in both directions. Numbers compare numerically, dates by time, booleans false-first, and strings with `Intl.Collator` using natural number order and no case or accent sensitivity, so `Item 2` comes before `Item 10`.

```tsx
const [sort, setSort] = useState<SortState | null>({
  columnKey: 'amount',
  direction: 'desc',
});

<DataGrid sort={sort} onSortChange={setSort} /* ... */ />;
```

## Filters

| Filter | Matches |
| --- | --- |
| `{ type: 'text', value }` | Shown cell text contains `value`, ignoring case and accents. |
| `{ type: 'values', values }` | Cell value equals one of `values` (dates compare by time). An empty list matches everything. |
| `{ type: 'range', min?, max? }` | Number or date between `min` and `max`, inclusive. Cells that aren't valid numbers or dates never match; invalid bounds are ignored. |
| `{ type: 'custom', test }` | `test(row)` returns true. |

`searchText` matches against every column with `searchable !== false`, using what the cell shows (`format` output), so `$1,114.00` matches a search for `1,114`.

The grid has no built-in filter controls; render your own search box and chips, as the example app does.

## Exported helpers

These are plain functions, usable without the component:

| Function | Purpose |
| --- | --- |
| `sortRows(data, columns, sort)` | Returns a sorted copy, or `data` itself when nothing sorts. |
| `nextSort(current, columnKey)` | The header-tap cycle: ascending → descending → `null`. |
| `filterRows(data, columns, options)` | Applies `searchText` and `columnFilters`. |
| `buildSearchIndex(data, columns)` | One searchable string per row; pass it back to `filterRows` to skip rebuilding. |
| `matchesColumnFilter(row, column, filter)` | Tests one filter against one row. |
| `getCellValue(row, column)` / `getCellText(row, column)` | The value and the shown text for a cell. |
| `lightTheme` / `darkTheme` | The built-in theme token sets. |

## Types

`DataGridProps`, `DataGridColumn`, `CellRenderInfo`, `CellAlign`, `SortState`, `SortDirection`, `SelectionMode`, `ColumnFilter`, `ColumnFilters`, `DataGridTheme`.
