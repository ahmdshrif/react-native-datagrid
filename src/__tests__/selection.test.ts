import { describe, expect, it } from '@jest/globals';
import { computeLayout, CHECKBOX_COLUMN_WIDTH } from '../layout';
import { getSelectAllState, toggleAll, toggleSelection } from '../selection';

const sorted = (set: ReadonlySet<string>) => [...set].sort();

describe('toggleSelection', () => {
  it('does nothing when selection is off', () => {
    const selected = new Set(['a']);
    expect(toggleSelection(selected, 'b', 'none')).toBe(selected);
  });

  it('keeps one row in single mode', () => {
    expect(sorted(toggleSelection(new Set(['a']), 'b', 'single'))).toEqual([
      'b',
    ]);
    expect(sorted(toggleSelection(new Set(['a']), 'a', 'single'))).toEqual([]);
  });

  it('adds and removes rows in multiple mode', () => {
    const one = toggleSelection(new Set(['a']), 'b', 'multiple');
    expect(sorted(one)).toEqual(['a', 'b']);
    expect(sorted(toggleSelection(one, 'a', 'multiple'))).toEqual(['b']);
  });
});

describe('select all', () => {
  const keys = ['a', 'b', 'c'];

  it('reports none, some and all', () => {
    expect(getSelectAllState(new Set(), keys)).toBe('none');
    expect(getSelectAllState(new Set(['x']), keys)).toBe('none');
    expect(getSelectAllState(new Set(['a']), keys)).toBe('some');
    expect(getSelectAllState(new Set(keys), keys)).toBe('all');
    expect(getSelectAllState(new Set(['a']), [])).toBe('none');
  });

  it('selects everything, then clears only those keys', () => {
    const all = toggleAll(new Set(['a', 'x']), keys);
    expect(sorted(all)).toEqual(['a', 'b', 'c', 'x']);
    expect(sorted(toggleAll(all, keys))).toEqual(['x']);
  });
});

describe('computeLayout', () => {
  const columns = [
    { key: 'a', title: 'A', width: 100 },
    { key: 'b', title: 'B', width: 50, pinned: 'left' as const },
    { key: 'c', title: 'C', width: 70 },
  ];

  it('moves pinned columns to the front and sums widths', () => {
    const layout = computeLayout(columns, false);
    expect(layout.pinned.map((c) => c.key)).toEqual(['b']);
    expect(layout.scrolling.map((c) => c.key)).toEqual(['a', 'c']);
    expect(layout.pinnedWidth).toBe(50);
    expect(layout.totalWidth).toBe(220);
  });

  it('adds the checkbox column to the pinned width', () => {
    const layout = computeLayout(columns, true);
    expect(layout.pinnedWidth).toBe(50 + CHECKBOX_COLUMN_WIDTH);
    expect(layout.totalWidth).toBe(220 + CHECKBOX_COLUMN_WIDTH);
  });
});
