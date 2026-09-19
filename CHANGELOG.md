# Changelog

## 0.1.0-beta.0

First public beta. The API may still change before 0.1.0.

### Added

- `DataGrid` component: fixed-height rows virtualized with FlashList, sticky header, and columns pinned to the left.
- Sorting: tap a header to cycle ascending, descending, unsorted. Stable, natural string order, empty values last. Custom `compare` per column.
- Selection: `single` and `multiple`, with a pinned checkbox column, select-all, and controlled or uncontrolled state.
- Search and filters: `searchText` that ignores case and accents, plus `text`, `values`, `range` and `custom` column filters. The search index is built on the first search and reused until `data` or `columns` change.
- Server-driven data: `manualSorting`, `manualFiltering`, `loading`, `loadingMore`, pull-to-refresh, `onEndReached`, and `error` with retry.
- Custom cells through `renderCell`, display text through `format`.
- Light and dark themes, with every color overridable, following the device by default.
- Row-level accessibility labels in visual column order, with a selection action.
- Exported helpers: `sortRows`, `nextSort`, `filterRows`, `buildSearchIndex`, `matchesColumnFilter`, `getCellText`, `getCellValue`, `lightTheme`, `darkTheme`.

### Known limitations

- Every mounted row renders every column. Rendering only visible columns is planned for wide tables.
- Sorting, filtering and key generation process the whole dataset in JS.
- No column resizing or inline editing yet.
- No native horizontal scrollbar or overscroll bounce: sideways scrolling is driven by a pan gesture so the header and pinned columns stay in sync ([#3](https://github.com/ahmdshrif/react-native-datagrid/issues/3)).
- Performance has been measured on the iOS simulator and an Android emulator only. Physical low-end Android devices are not measured yet.
