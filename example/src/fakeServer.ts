import { buildSearchIndex, filterRows, sortRows } from 'react-native-datagrid';
import type { SortState } from 'react-native-datagrid';
import { makeColumns } from './columns';
import { makeWorkOrders } from './data';
import type { WorkOrder, WorkOrderStatus } from './data';

// Stand-in for a real backend: sorts, searches and pages 5,000 orders after a delay.
const ALL = makeWorkOrders(5000);
const COLUMNS = makeColumns(false);
const SEARCH_INDEX = buildSearchIndex(ALL, COLUMNS);
const LATENCY_MS = 700;

export type OrdersQuery = {
  page: number;
  pageSize: number;
  sort: SortState | null;
  search: string;
  statuses: WorkOrderStatus[];
  /** Make this request fail, to show error handling. */
  fail?: boolean;
  signal?: AbortSignal;
};

export type OrdersPage = {
  rows: WorkOrder[];
  total: number;
  nextPage: number | null;
};

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new Error('Request cancelled'));
    });
  });
}

export async function fetchOrders(query: OrdersQuery): Promise<OrdersPage> {
  await wait(LATENCY_MS, query.signal);
  if (query.fail) {
    throw new Error('Could not load work orders. Check your connection.');
  }
  const filtered = filterRows(ALL, COLUMNS, {
    searchText: query.search,
    searchIndex: SEARCH_INDEX,
    columnFilters: {
      status: query.statuses.length
        ? { type: 'values', values: query.statuses }
        : null,
    },
  });
  const sorted = sortRows(filtered, COLUMNS, query.sort);
  const start = query.page * query.pageSize;
  const rows = sorted.slice(start, start + query.pageSize);
  const hasMore = start + query.pageSize < sorted.length;
  return {
    rows,
    total: sorted.length,
    nextPage: hasMore ? query.page + 1 : null,
  };
}
