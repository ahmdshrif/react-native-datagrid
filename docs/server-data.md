# Server-driven data

When a server sorts, filters or pages the data, turn off local processing and let the grid report what the user asked for. Your app owns fetching, pagination, retries and cancellation; the grid owns the states it shows.

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

## What each flag means

| Prop | Behaviour |
| --- | --- |
| `manualSorting` | The grid keeps the order of `data`. The header still shows the sort arrow and taps still call `onSortChange`, so you can refetch. |
| `manualFiltering` | The grid shows `data` as it is. `searchText` and `columnFilters` are ignored locally; use them to build your request. |
| `loading` | Shown **only when there are no rows**. When rows are already on screen, they stay visible while the next result loads. |
| `loadingMore` | A spinner below the last row. |
| `error` | Replaces the empty state when there are no rows; otherwise appears below the last row so the loaded rows stay usable. |

## States to handle

- **First load:** `loading` true, no rows. The grid shows a spinner and `loadingText`.
- **Changing sort or filters with rows on screen:** keep the old rows, set `loading` true. The grid keeps showing them, so the screen doesn't flash empty.
- **Loading a page:** `loadingMore` true. Do nothing else; the rows stay put.
- **Failure:** set `error`, and `onRetry` to repeat the last request. Keep the rows you already have.
- **Empty result:** clear `loading` and `error` and pass an empty array; the grid shows `emptyText`.

## Cancelling in-flight requests

Sorting and typing produce overlapping requests. Cancel the previous one so a slow response can't overwrite a newer one:

```tsx
const controller = useRef<AbortController | null>(null);

const load = useCallback(async (page: number) => {
  controller.current?.abort();
  const current = new AbortController();
  controller.current = current;
  try {
    const result = await fetchRows({ page, sort, search, signal: current.signal });
    setRows((prev) => (page === 0 ? result.rows : [...prev, ...result.rows]));
  } catch (e) {
    if (!current.signal.aborted) setError(String(e));
  }
}, [sort, search]);
```

## Known rough edge

After a new sort or filter, the list keeps its scroll position, so a deep scroll can call `onEndReached` immediately. A scroll-reset option is on the roadmap. Until then, you can remount the grid with a `key` that changes with the query.

A complete working version of all of this, with a fake paged API and a switch that makes the next request fail, is in the example app's **Server** tab: [`example/src/ServerDemo.tsx`](../example/src/ServerDemo.tsx).
