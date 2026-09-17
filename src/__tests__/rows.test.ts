import { describe, expect, it } from '@jest/globals';
import { getVisibleRows } from '../rows';
import type { DataGridColumn } from '../types';

type Row = { id: string; name: string; amount: number };

const columns: DataGridColumn<Row>[] = [
  { key: 'name', title: 'Name', width: 100, sortable: true },
  { key: 'amount', title: 'Amount', width: 80, sortable: true },
];
const data: Row[] = [
  { id: 'a', name: 'Zed', amount: 5 },
  { id: 'b', name: 'Amy', amount: 50 },
  { id: 'c', name: 'Max', amount: 500 },
];
const ids = (rows: readonly Row[]) => rows.map((r) => r.id);
const sort = { columnKey: 'name', direction: 'asc' as const };
const columnFilters = { amount: { type: 'range' as const, min: 10 } };

describe('getVisibleRows', () => {
  it('filters then sorts locally by default', () => {
    expect(
      ids(
        getVisibleRows(data, columns, { sort, searchText: 'm', columnFilters })
      )
    ).toEqual(['b', 'c']);
  });

  it('keeps supplied order with manualSorting', () => {
    expect(
      ids(getVisibleRows(data, columns, { sort, manualSorting: true }))
    ).toEqual(['a', 'b', 'c']);
  });

  it('shows supplied rows with manualFiltering but still sorts locally', () => {
    expect(
      ids(
        getVisibleRows(data, columns, {
          sort,
          searchText: 'zzz',
          columnFilters,
          manualFiltering: true,
        })
      )
    ).toEqual(['b', 'c', 'a']);
  });

  it('returns data untouched when both are manual', () => {
    expect(
      getVisibleRows(data, columns, {
        sort,
        manualSorting: true,
        searchText: 'm',
        manualFiltering: true,
      })
    ).toBe(data);
  });
});
