import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { DataGrid } from 'react-native-grid-table';
import type { DataGridTheme, SortState } from 'react-native-grid-table';
import { makeColumns } from './columns';
import { Chip, LinkButton, SearchBox, controlStyles } from './controls';
import { STATUSES } from './data';
import type { WorkOrder, WorkOrderStatus } from './data';
import { fetchOrders } from './fakeServer';

const PAGE_SIZE = 50;

type RequestKind = 'first' | 'more' | 'refresh';
type Props = { theme: DataGridTheme; dark: boolean };

function useDebounced<V>(value: V, ms: number): V {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

/**
 * Rows come from a (fake) server one page at a time. The grid runs with
 * manualSorting and manualFiltering, so it only reports what the user asked for.
 */
export function ServerDemo({ theme, dark }: Props) {
  const columns = useMemo(() => makeColumns(dark), [dark]);
  const [sort, setSort] = useState<SortState | null>({
    columnKey: 'scheduled',
    direction: 'asc',
  });
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounced(searchInput, 300);
  const [statuses, setStatuses] = useState<WorkOrderStatus[]>([]);
  const [failNext, setFailNext] = useState(false);
  const failNextRef = useRef(failNext);
  failNextRef.current = failNext;

  const [rows, setRows] = useState<WorkOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(0);
  const [kind, setKind] = useState<RequestKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const lastRequest = useRef<{ page: number; kind: RequestKind }>({
    page: 0,
    kind: 'first',
  });

  const request = useCallback(
    async (page: number, requestKind: RequestKind) => {
      controller.current?.abort();
      const current = new AbortController();
      controller.current = current;
      lastRequest.current = { page, kind: requestKind };
      setKind(requestKind);
      setError(null);

      const fail = failNextRef.current;
      if (fail) setFailNext(false);
      try {
        const result = await fetchOrders({
          page,
          pageSize: PAGE_SIZE,
          sort,
          search,
          statuses,
          fail,
          signal: current.signal,
        });
        setRows((prev) =>
          page === 0 ? result.rows : [...prev, ...result.rows]
        );
        setTotal(result.total);
        setNextPage(result.nextPage);
      } catch (e) {
        if (current.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Request failed');
      } finally {
        if (controller.current === current) setKind(null);
      }
    },
    [sort, search, statuses]
  );

  // New sort, search or status filter: fetch the first page again, keeping current rows visible.
  useEffect(() => {
    request(0, 'first');
  }, [request]);
  useEffect(() => () => controller.current?.abort(), []);

  const onEndReached = () => {
    if (kind === null && !error && nextPage !== null && rows.length > 0) {
      request(nextPage, 'more');
    }
  };
  const onRetry = () => {
    const { page, kind: lastKind } = lastRequest.current;
    request(page, lastKind === 'refresh' ? 'first' : lastKind);
  };

  const toggleStatus = (status: WorkOrderStatus) =>
    setStatuses((current) =>
      current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status]
    );

  const status =
    kind === 'first' && rows.length > 0
      ? 'Updating…'
      : `${rows.length.toLocaleString()} of ${total.toLocaleString()} loaded`;

  return (
    <>
      <View style={controlStyles.filters}>
        <View style={controlStyles.chips}>
          <Text style={[controlStyles.subtitle, { color: theme.mutedText }]}>
            {status} · page size {PAGE_SIZE} · 700 ms latency
          </Text>
          <Chip
            theme={theme}
            label="Fail next request"
            on={failNext}
            onPress={() => setFailNext((v) => !v)}
          />
        </View>
        <SearchBox
          theme={theme}
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search on the server"
        />
        <View style={controlStyles.chips}>
          {STATUSES.map((s) => (
            <Chip
              key={s}
              theme={theme}
              label={s}
              on={statuses.includes(s)}
              onPress={() => toggleStatus(s)}
            />
          ))}
          {(searchInput.length > 0 || statuses.length > 0) && (
            <LinkButton
              theme={theme}
              label="Clear filters"
              onPress={() => {
                setSearchInput('');
                setStatuses([]);
              }}
            />
          )}
        </View>
      </View>
      <DataGrid
        data={rows}
        columns={columns}
        keyExtractor={(row) => row.id}
        sort={sort}
        onSortChange={setSort}
        manualSorting
        manualFiltering
        loading={kind === 'first'}
        loadingText="Loading work orders"
        loadingMore={kind === 'more'}
        refreshing={kind === 'refresh'}
        onRefresh={() => request(0, 'refresh')}
        onEndReached={onEndReached}
        error={error}
        onRetry={onRetry}
        emptyText="No work orders match these filters"
        colorScheme={dark ? 'dark' : 'light'}
        testID="server-grid"
      />
    </>
  );
}
