import { describe, expect, it } from '@jest/globals';
import {
  buildSearchIndex,
  filterRows,
  matchesColumnFilter,
  normalizeSearchText,
} from '../filter';
import type { DataGridColumn } from '../types';

type Row = {
  id: string;
  name: string;
  status: 'Open' | 'Done';
  amount: number | null;
  due: Date;
  secret: string;
};

const columns: DataGridColumn<Row>[] = [
  { key: 'id', title: 'ID', width: 80 },
  { key: 'name', title: 'Name', width: 120 },
  { key: 'status', title: 'Status', width: 80 },
  {
    key: 'amount',
    title: 'Amount',
    width: 80,
    format: (v) => (v == null ? '' : `$${(v as number).toFixed(2)}`),
  },
  {
    key: 'due',
    title: 'Due',
    width: 80,
    format: (v) => (v as Date).toISOString().slice(0, 10),
  },
  { key: 'secret', title: 'Secret', width: 80, searchable: false },
];

const rows: Row[] = [
  {
    id: 'r1',
    name: 'Café Luna',
    status: 'Open',
    amount: 1200,
    due: new Date('2026-01-10'),
    secret: 'zebra',
  },
  {
    id: 'r2',
    name: 'Harbor Dental',
    status: 'Done',
    amount: 45.5,
    due: new Date('2026-02-01'),
    secret: 'lion',
  },
  {
    id: 'r3',
    name: 'Atlas Freight',
    status: 'Open',
    amount: null,
    due: new Date('2026-03-15'),
    secret: 'tiger',
  },
];

const ids = (list: readonly Row[]) => list.map((r) => r.id);
const column = (key: string) => columns.find((c) => c.key === key)!;

describe('normalizeSearchText', () => {
  it('lowercases and strips accents', () => {
    expect(normalizeSearchText('CAFÉ Ñandú')).toBe('cafe nandu');
  });
});

describe('filterRows', () => {
  it('returns the same array when nothing filters', () => {
    expect(filterRows(rows, columns, {})).toBe(rows);
    expect(filterRows(rows, columns, { searchText: '   ' })).toBe(rows);
    expect(filterRows(rows, columns, { columnFilters: { name: null } })).toBe(
      rows
    );
  });

  it('searches shown text across columns, ignoring case and accents', () => {
    expect(ids(filterRows(rows, columns, { searchText: 'cafe' }))).toEqual([
      'r1',
    ]);
    expect(ids(filterRows(rows, columns, { searchText: 'OPEN' }))).toEqual([
      'r1',
      'r3',
    ]);
    expect(ids(filterRows(rows, columns, { searchText: '$45.50' }))).toEqual([
      'r2',
    ]);
    expect(ids(filterRows(rows, columns, { searchText: '2026-03' }))).toEqual([
      'r3',
    ]);
  });

  it('skips columns marked searchable: false', () => {
    expect(ids(filterRows(rows, columns, { searchText: 'zebra' }))).toEqual([]);
  });

  it('uses a prebuilt search index', () => {
    const searchIndex = buildSearchIndex(rows, columns);
    expect(
      ids(filterRows(rows, columns, { searchText: 'atlas', searchIndex }))
    ).toEqual(['r3']);
  });

  it('combines search and column filters', () => {
    expect(
      ids(
        filterRows(rows, columns, {
          searchText: 'a',
          columnFilters: { status: { type: 'values', values: ['Open'] } },
        })
      )
    ).toEqual(['r1', 'r3']);
  });

  it('ignores filters for unknown columns', () => {
    expect(
      filterRows(rows, columns, {
        columnFilters: { missing: { type: 'text', value: 'x' } },
      })
    ).toBe(rows);
  });
});

describe('matchesColumnFilter', () => {
  it('text filter matches shown text', () => {
    const f = { type: 'text' as const, value: 'harbor' };
    expect(matchesColumnFilter(rows[1]!, column('name'), f)).toBe(true);
    expect(matchesColumnFilter(rows[0]!, column('name'), f)).toBe(false);
    expect(
      matchesColumnFilter(rows[0]!, column('name'), { type: 'text', value: '' })
    ).toBe(true);
  });

  it('values filter matches any listed value, including dates', () => {
    expect(
      matchesColumnFilter(rows[1]!, column('status'), {
        type: 'values',
        values: ['Done'],
      })
    ).toBe(true);
    expect(
      matchesColumnFilter(rows[0]!, column('due'), {
        type: 'values',
        values: [new Date('2026-01-10')],
      })
    ).toBe(true);
    expect(
      matchesColumnFilter(rows[0]!, column('status'), {
        type: 'values',
        values: [],
      })
    ).toBe(true);
  });

  it('range filter is inclusive and skips empty cells', () => {
    const amount = column('amount');
    expect(
      matchesColumnFilter(rows[0]!, amount, { type: 'range', min: 1200 })
    ).toBe(true);
    expect(
      matchesColumnFilter(rows[1]!, amount, { type: 'range', min: 100 })
    ).toBe(false);
    expect(
      matchesColumnFilter(rows[2]!, amount, { type: 'range', max: 100 })
    ).toBe(false);
    expect(
      matchesColumnFilter(rows[1]!, column('due'), {
        type: 'range',
        min: new Date('2026-01-15'),
        max: new Date('2026-02-01'),
      })
    ).toBe(true);
  });

  it('range filter rejects cells that are not valid numbers or dates', () => {
    const amount: DataGridColumn<{ v: unknown }> = {
      key: 'v',
      title: 'V',
      width: 50,
    };
    const f = { type: 'range' as const, min: 0, max: 10 };
    expect(matchesColumnFilter({ v: 5 }, amount, f)).toBe(true);
    expect(matchesColumnFilter({ v: NaN }, amount, f)).toBe(false);
    expect(matchesColumnFilter({ v: '5' }, amount, f)).toBe(false);
    expect(matchesColumnFilter({ v: new Date('nope') }, amount, f)).toBe(false);
    expect(matchesColumnFilter({ v: Infinity }, amount, f)).toBe(false);
  });

  it('range filter ignores invalid bounds', () => {
    const amount: DataGridColumn<{ v: unknown }> = {
      key: 'v',
      title: 'V',
      width: 50,
    };
    expect(
      matchesColumnFilter({ v: 5 }, amount, {
        type: 'range',
        min: NaN,
        max: 10,
      })
    ).toBe(true);
    expect(
      matchesColumnFilter({ v: 50 }, amount, {
        type: 'range',
        min: NaN,
        max: 10,
      })
    ).toBe(false);
    expect(
      matchesColumnFilter({ v: null }, amount, {
        type: 'range',
        min: new Date('nope'),
        max: null,
      })
    ).toBe(true);
  });

  it('custom filter calls the test', () => {
    expect(
      matchesColumnFilter(rows[2]!, column('id'), {
        type: 'custom',
        test: (r) => r.amount == null,
      })
    ).toBe(true);
  });
});
