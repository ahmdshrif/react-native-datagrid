# react-native-datagrid

Fast data grid for React Native: pinned columns, sticky header, virtualized rows, sorting and selection.

- **Pinned columns and sticky header** that follow sideways scrolling on the UI thread, so they never lag behind the body
- **Virtualized rows** with [FlashList](https://shopify.github.io/flash-list/): only rows on screen are mounted. Sorting, filtering and key generation still process the whole dataset in JS
- **Sorting**: tap a header to cycle ascending, descending, unsorted. Stable, natural string order, empty values last
- **Server-driven data**: manual sorting and filtering, loading, pull-to-refresh, load more, and error states with retry
- **Search and filters**: quick search that ignores case and accents, plus text, value, range and custom column filters
- **Selection**: single or multiple, with a pinned checkbox column and select-all
- **Custom cells** through `renderCell`, or plain text through `format`
- **Light and dark themes**, with every color overridable
- Pure JS on top of FlashList, Reanimated and Gesture Handler: works with Expo, no native code of its own

[![npm](https://img.shields.io/npm/v/react-native-datagrid/beta?label=npm%20beta)](https://www.npmjs.com/package/react-native-datagrid)
[![CI](https://github.com/ahmdshrif/react-native-datagrid/actions/workflows/ci.yml/badge.svg)](https://github.com/ahmdshrif/react-native-datagrid/actions/workflows/ci.yml)

> **Beta.** The API may still change before 0.1.0. Feedback from real apps is what decides what lands next — please [open an issue](https://github.com/ahmdshrif/react-native-datagrid/issues).

## Installation

```sh
npm install react-native-datagrid@beta @shopify/flash-list react-native-reanimated react-native-worklets react-native-gesture-handler
```

With Expo:

```sh
npx expo install react-native-datagrid@beta @shopify/flash-list react-native-reanimated react-native-worklets react-native-gesture-handler
```

Requires the New Architecture, FlashList 2, Reanimated 4 and Gesture Handler 2. If you don't use Expo, follow the [Reanimated setup guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started) to add the worklets Babel plugin.

On Expo, install the peers with `expo install` so they match your SDK. Installing the library first can pull a Reanimated version that requires a newer React Native than your SDK ships.

Wrap your app in `GestureHandlerRootView` once, near the root:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return <GestureHandlerRootView style={{ flex: 1 }}>{/* ... */}</GestureHandlerRootView>;
}
```

Sideways scrolling uses a pan gesture rather than a `ScrollView`, so the header and pinned columns move in the same frame as the rows. A `ScrollView` reports its offset a frame late on Android, which makes pinned columns flicker.

## Usage

```tsx
import { DataGrid } from 'react-native-datagrid';
import type { DataGridColumn } from 'react-native-datagrid';

type Order = { id: string; customer: string; status: string; amount: number };

const columns: DataGridColumn<Order>[] = [
  { key: 'id', title: 'Order', width: 96, pinned: 'left', sortable: true },
  { key: 'customer', title: 'Customer', width: 170, sortable: true },
  { key: 'status', title: 'Status', width: 120 },
  {
    key: 'amount',
    title: 'Amount',
    width: 110,
    align: 'right',
    sortable: true,
    format: (value) => `$${(value as number).toFixed(2)}`,
  },
];

export function Orders({ orders }: { orders: Order[] }) {
  return (
    <DataGrid
      data={orders}
      columns={columns}
      keyExtractor={(row) => row.id}
      selectionMode="multiple"
      onSelectionChange={(keys) => console.log(keys)}
    />
  );
}
```

The grid fills its parent (`flex: 1`), so give the parent a height.

## Columns

| Option | Type | Description |
| --- | --- | --- |
| `key` | `string` | Unique id. Also reads `row[key]` when `getValue` is not set. |
| `title` | `string` | Header text. |
| `width` | `number` | Width in points. |
| `pinned` | `'left'` | Keep the column visible while scrolling sideways. Pinned columns move to the front. |
| `align` | `'left' \| 'center' \| 'right'` | Cell alignment. Default `left`. |
| `sortable` | `boolean` | Let users sort by tapping the header. |
| `getValue` | `(row) => unknown` | Read the value used for display and sorting. |
| `compare` | `(a, b) => number` | Custom ascending comparator. |
| `format` | `(value, row) => string` | Display text. Ignored when `renderCell` is set. |
| `renderCell` | `({ row, rowIndex, value, column, selected }) => ReactNode` | Custom cell content. |
| `searchable` | `boolean` | Include in `searchText` matching. Default `true`. |
| `getSearchText` | `(row) => string` | Text used for search. Defaults to the shown text. |

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `readonly T[]` | required | Rows. |
| `columns` | `DataGridColumn<T>[]` | required | Column definitions. Memoize them to avoid re-rendering rows. |
| `keyExtractor` | `(row, index) => string` | required | Unique key per row. Use a stable ID from the row, not the index. |
| `rowHeight` | `number` | `44` | Fixed row height. |
| `headerHeight` | `number` | `40` | Header height. |
| `striped` | `boolean` | `true` | Alternate row backgrounds. |
| `sort` | `SortState \| null` | | Controlled sort. |
| `defaultSort` | `SortState \| null` | `null` | Initial sort when uncontrolled. |
| `onSortChange` | `(sort) => void` | | Called when a header is tapped. |
| `searchText` | `string` | | Show rows whose searchable columns contain this text. |
| `columnFilters` | `Record<string, ColumnFilter>` | | Show rows matching every filter, by column key. |
| `onFilteredCountChange` | `(count) => void` | | Number of rows left after filtering. |
| `manualSorting` | `boolean` | `false` | Keep the order of `data`. The header still shows `sort` and taps still call `onSortChange`. |
| `manualFiltering` | `boolean` | `false` | Show `data` without applying `searchText` or `columnFilters`. |
| `loading` | `boolean` | `false` | First load. Shows a spinner only while there are no rows. |
| `loadingText` | `string` | `'Loading'` | Text under the first-load spinner. |
| `loadingMore` | `boolean` | `false` | Shows a spinner below the last row. |
| `refreshing` | `boolean` | | Pull-to-refresh state. |
| `onRefresh` | `() => void` | | Enables pull-to-refresh. |
| `onEndReached` | `() => void` | | Called near the end of the list, to load the next page. |
| `onEndReachedThreshold` | `number` | `0.5` | How far from the end `onEndReached` fires, in visible list lengths. |
| `error` | `string \| null` | | Error message. Replaces the empty state when there are no rows, otherwise shows below the last row. |
| `onRetry` | `() => void` | | Shows a Retry button next to `error`. |
| `selectionMode` | `'none' \| 'single' \| 'multiple'` | `'none'` | `multiple` adds a pinned checkbox column. |
| `selectedKeys` | `string[]` | | Controlled selection. |
| `defaultSelectedKeys` | `string[]` | `[]` | Initial selection when uncontrolled. |
| `onSelectionChange` | `(keys) => void` | | Called with all selected keys. |
| `onRowPress` | `(row, index) => void` | | Row tap. In `multiple` mode, setting this makes row taps call it instead of toggling selection. |
| `colorScheme` | `'auto' \| 'light' \| 'dark'` | `'auto'` | `auto` follows the device. |
| `theme` | `Partial<DataGridTheme>` | | Override theme tokens. |
| `emptyText` | `string` | `'No rows'` | Shown when `data` is empty. |
| `style` | `ViewStyle` | | Container style. |

`sortRows`, `nextSort`, `filterRows`, `lightTheme` and `darkTheme` are exported too, for sorting on your own or building a custom theme.

## Search and filters

```tsx
const [search, setSearch] = useState('');
const [statuses, setStatuses] = useState<string[]>([]);

const columnFilters = useMemo<ColumnFilters<Order>>(
  () => ({
    status: statuses.length ? { type: 'values', values: statuses } : null,
    amount: { type: 'range', min: 1000 },
  }),
  [statuses]
);

<DataGrid
  data={orders}
  columns={columns}
  keyExtractor={(row) => row.id}
  searchText={search}
  columnFilters={columnFilters}
/>;
```

| Filter | Matches |
| --- | --- |
| `{ type: 'text', value }` | Shown cell text contains `value`, ignoring case and accents. |
| `{ type: 'values', values }` | Cell value equals one of `values` (dates compare by time). An empty list matches everything. |
| `{ type: 'range', min?, max? }` | Number or date between `min` and `max`, inclusive. Cells that aren't valid numbers or dates never match; invalid bounds are ignored. |
| `{ type: 'custom', test }` | `test(row)` returns true. |

The grid has no built-in filter controls yet, so you render your own search box and chips (see the example app). `filterRows`, `buildSearchIndex` and `matchesColumnFilter` are exported for filtering outside the grid.

## Server-driven data

When a server sorts, filters or pages the data, turn off local processing and let the grid report what the user asked for. Your app owns fetching, pagination, retries and request cancellation; the grid only shows the states.

```tsx
<DataGrid
  data={rows}
  columns={columns}
  keyExtractor={(row) => row.id}
  sort={sort}
  onSortChange={setSort} // refetch page 1 with the new sort
  manualSorting
  manualFiltering
  loading={isFirstLoad} // spinner only while there are no rows
  loadingMore={isLoadingNextPage} // footer spinner, rows stay visible
  refreshing={isRefreshing}
  onRefresh={refetchFirstPage}
  onEndReached={loadNextPage}
  error={errorMessage}
  onRetry={retryLastRequest}
/>
```

When a new sort or filter is loading and rows are already on screen, those rows stay visible until the new page arrives. The example app's **Server** tab shows a complete flow with a fake paged API, including a switch that makes the next request fail.

## Tested with

These are the versions the library is developed and tested against. Other versions within the peer ranges may work but are unverified.

| Package | Tested | Peer range |
| --- | --- | --- |
| react-native | 0.83.10 | `*` (New Architecture required) |
| react | 19.2.0 | `*` |
| expo | SDK 55 | not required |
| @shopify/flash-list | 2.0.2 | `>=2.0.0` |
| react-native-reanimated | 4.2.1 | `>=4.0.0` |
| react-native-worklets | 0.7.4 | `>=0.5.0` |
| react-native-gesture-handler | 2.30.0 | `>=2.20.0` |

Checked on the iOS 26 simulator and an Android API 35 emulator, in Release builds, plus a clean install into a fresh Expo app.

## Performance

Early measurements on the example app (Release build, 10,000 rows × 13 columns, checkbox column plus 2 pinned columns, about 12 seconds of fast flings and sideways swipes). The numbers are frame callback intervals longer than 25 ms, a rough jank signal rather than a dropped-frame count:

| Platform | UI thread long intervals | JS thread long intervals |
| --- | --- | --- |
| iOS 26 simulator (Mac) | 0 | 0 |
| Android emulator, API 35 (Mac) | 1 | 21 |

**Not yet measured on physical devices.** Emulator runs varied a lot with host load, so these results say nothing reliable about low-end Android phones. Device benchmarks with platform profiling are planned before a stable release. Background on the approach is in [docs/spike-results.md](docs/spike-results.md).

What scales with the full dataset: sorting (once per sort change), key generation, and the search index (built on the first search, reused until `data` or `columns` change). Pass stable `data`, `columns` and `keyExtractor` references to avoid repeating that work.

## Roadmap

- Server-driven data: manual sorting and filtering, loading, refresh and load-more
- Beta feedback decides what comes next (column resizing and inline editing are candidates)
- Measure on real low-end Android phones and cut JS work per row
- A `scrollToTop` option, so a new sort or filter resets the scroll position
- Later: rendering only visible columns for very wide tables, right-pinned columns, row grouping

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT
