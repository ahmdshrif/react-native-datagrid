import { describe, expect, it } from '@jest/globals';
import { compareValues, nextSort, sortRows } from '../sort';
import type { DataGridColumn } from '../types';

type Row = {
  id: string;
  name: string | null;
  amount?: number;
  due?: Date;
  active?: boolean;
};

const columns: DataGridColumn<Row>[] = [
  { key: 'name', title: 'Name', width: 100, sortable: true },
  { key: 'amount', title: 'Amount', width: 80, sortable: true },
  { key: 'due', title: 'Due', width: 80, sortable: true },
  {
    key: 'nameLength',
    title: 'Length',
    width: 80,
    getValue: (r) => r.name?.length,
  },
  {
    key: 'custom',
    title: 'Custom',
    width: 80,
    compare: (a, b) => a.id.localeCompare(b.id),
  },
];

const rows: Row[] = [
  { id: 'c', name: 'Item 10', amount: 5, due: new Date('2026-03-01') },
  { id: 'a', name: 'item 2', amount: 30, due: new Date('2026-01-01') },
  { id: 'd', name: null, amount: 5 },
  { id: 'b', name: 'Apple', amount: undefined, due: new Date('2026-02-01') },
];

const ids = (list: readonly Row[]) => list.map((r) => r.id);

describe('sortRows', () => {
  it('returns the same array when unsorted', () => {
    expect(sortRows(rows, columns, null)).toBe(rows);
    expect(sortRows(rows, columns, undefined)).toBe(rows);
  });

  it('returns the same array for an unknown column', () => {
    expect(
      sortRows(rows, columns, { columnKey: 'missing', direction: 'asc' })
    ).toBe(rows);
  });

  it('does not mutate the input', () => {
    const copy = [...rows];
    sortRows(rows, columns, { columnKey: 'amount', direction: 'desc' });
    expect(rows).toEqual(copy);
  });

  it('sorts strings naturally and ignores case', () => {
    expect(
      ids(sortRows(rows, columns, { columnKey: 'name', direction: 'asc' }))
    ).toEqual(['b', 'a', 'c', 'd']);
  });

  it('keeps empty values last in both directions', () => {
    expect(
      ids(sortRows(rows, columns, { columnKey: 'name', direction: 'desc' }))
    ).toEqual(['c', 'a', 'b', 'd']);
    expect(
      ids(sortRows(rows, columns, { columnKey: 'amount', direction: 'desc' }))
    ).toEqual(['a', 'c', 'd', 'b']);
  });

  it('is stable for equal values', () => {
    expect(
      ids(sortRows(rows, columns, { columnKey: 'amount', direction: 'asc' }))
    ).toEqual(['c', 'd', 'a', 'b']);
  });

  it('sorts dates', () => {
    expect(
      ids(sortRows(rows, columns, { columnKey: 'due', direction: 'asc' }))
    ).toEqual(['a', 'b', 'c', 'd']);
  });

  it('uses getValue', () => {
    expect(
      ids(
        sortRows(rows, columns, { columnKey: 'nameLength', direction: 'asc' })
      )
    ).toEqual(['b', 'a', 'c', 'd']);
  });

  it('uses a custom comparator and reverses it for desc', () => {
    expect(
      ids(sortRows(rows, columns, { columnKey: 'custom', direction: 'desc' }))
    ).toEqual(['d', 'c', 'b', 'a']);
  });
});

describe('compareValues', () => {
  it('orders NaN after numbers', () => {
    expect(compareValues(NaN, 1)).toBeGreaterThan(0);
    expect(compareValues(1, NaN)).toBeLessThan(0);
  });

  it('orders false before true', () => {
    expect(compareValues(false, true)).toBeLessThan(0);
  });
});

describe('nextSort', () => {
  it('cycles asc, desc, unsorted', () => {
    const asc = nextSort(null, 'name');
    expect(asc).toEqual({ columnKey: 'name', direction: 'asc' });
    const desc = nextSort(asc, 'name');
    expect(desc).toEqual({ columnKey: 'name', direction: 'desc' });
    expect(nextSort(desc, 'name')).toBeNull();
  });

  it('starts ascending when switching columns', () => {
    expect(
      nextSort({ columnKey: 'name', direction: 'desc' }, 'amount')
    ).toEqual({ columnKey: 'amount', direction: 'asc' });
  });
});
