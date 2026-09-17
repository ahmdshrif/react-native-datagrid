# react-native-datagrid

Fast data grid for React Native: pinned columns, sticky header, virtualized rows, sorting and selection.

- **Pinned columns and sticky header** that follow sideways scrolling on the UI thread, so they never lag behind the body
- **Virtualized rows** with [FlashList](https://shopify.github.io/flash-list/), so 10,000 rows cost about the same as 30
- **Sorting**: tap a header to cycle ascending, descending, unsorted. Stable, natural string order, empty values last
- **Selection**: single or multiple, with a pinned checkbox column and select-all
- **Custom cells** through `renderCell`, or plain text through `format`
- **Light and dark themes**, with every color overridable
- Pure JS on top of FlashList and Reanimated: works with Expo, no native code of its own

> Status: early development (v0.1). The API may still change.

## Installation

```sh
npm install react-native-datagrid @shopify/flash-list react-native-reanimated react-native-worklets
```

With Expo:

```sh
npx expo install react-native-datagrid @shopify/flash-list react-native-reanimated react-native-worklets
```

Requires the New Architecture, FlashList 2 and Reanimated 4. If you don't use Expo, follow the [Reanimated setup guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started) to add the worklets Babel plugin.

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

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `readonly T[]` | required | Rows. |
| `columns` | `DataGridColumn<T>[]` | required | Column definitions. Memoize them to avoid re-rendering rows. |
| `keyExtractor` | `(row, index) => string` | required | Stable unique key per row. |
| `rowHeight` | `number` | `44` | Fixed row height. |
| `headerHeight` | `number` | `40` | Header height. |
| `striped` | `boolean` | `true` | Alternate row backgrounds. |
| `sort` | `SortState \| null` | | Controlled sort. |
| `defaultSort` | `SortState \| null` | `null` | Initial sort when uncontrolled. |
| `onSortChange` | `(sort) => void` | | Called when a header is tapped. |
| `selectionMode` | `'none' \| 'single' \| 'multiple'` | `'none'` | `multiple` adds a pinned checkbox column. |
| `selectedKeys` | `string[]` | | Controlled selection. |
| `defaultSelectedKeys` | `string[]` | `[]` | Initial selection when uncontrolled. |
| `onSelectionChange` | `(keys) => void` | | Called with all selected keys. |
| `onRowPress` | `(row, index) => void` | | Row tap. In `multiple` mode, setting this makes row taps call it instead of toggling selection. |
| `colorScheme` | `'auto' \| 'light' \| 'dark'` | `'auto'` | `auto` follows the device. |
| `theme` | `Partial<DataGridTheme>` | | Override theme tokens. |
| `emptyText` | `string` | `'No rows'` | Shown when `data` is empty. |
| `style` | `ViewStyle` | | Container style. |

`sortRows`, `nextSort`, `lightTheme` and `darkTheme` are exported too, for sorting on your own or building a custom theme.

## Performance

Measured on the example app (Release build, 10,000 rows × 13 columns, checkbox column plus 2 pinned columns) during about 12 seconds of fast flings and sideways swipes:

| Platform | UI thread dropped frames | JS thread dropped frames |
| --- | --- | --- |
| iOS 26 simulator | 0 | 0 |
| Android emulator (API 35) | 1 | 21 |

Android emulator runs varied a lot between repeats (host load on the Mac), so treat the Android row as a rough best case. Real low-end Android devices have not been measured yet. The header and pinned columns stay in sync in every run, because they move on the UI thread. Background on the approach is in [docs/spike-results.md](docs/spike-results.md).

## Roadmap

- v0.2: column resizing, inline cell editing, filtering
- Measure on real low-end Android phones and cut JS work per row
- Later: rendering only visible columns for very wide tables, right-pinned columns, row grouping

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT
