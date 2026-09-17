import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { ListRenderItemInfo } from '@shopify/flash-list';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { GridHeader } from './GridHeader';
import { GridRow } from './GridRow';
import { buildSearchIndex, filterRows } from './filter';
import { computeLayout } from './layout';
import { getSelectAllState, toggleAll, toggleSelection } from './selection';
import { nextSort, sortRows } from './sort';
import { darkTheme, lightTheme } from './theme';
import type { DataGridProps, SortState } from './types';

const EMPTY_KEYS: readonly string[] = [];

export function DataGrid<T>({
  data,
  columns,
  keyExtractor,
  rowHeight = 44,
  headerHeight = 40,
  striped = true,
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  searchText,
  columnFilters,
  onFilteredCountChange,
  selectionMode = 'none',
  selectedKeys: selectedKeysProp,
  defaultSelectedKeys = EMPTY_KEYS,
  onSelectionChange,
  onRowPress,
  colorScheme = 'auto',
  theme: themeOverrides,
  emptyText = 'No rows',
  style,
  testID,
}: DataGridProps<T>) {
  const systemScheme = useColorScheme();
  const scheme = colorScheme === 'auto' ? systemScheme : colorScheme;
  const theme = useMemo(
    () => ({
      ...(scheme === 'dark' ? darkTheme : lightTheme),
      ...themeOverrides,
    }),
    [scheme, themeOverrides]
  );

  // Sorting: controlled when `sort` is passed (null counts as controlled).
  const [innerSort, setInnerSort] = useState<SortState | null>(defaultSort);
  const sort = sortProp !== undefined ? sortProp : innerSort;

  // Search index is built lazily on the first search, then reused until data or columns change.
  const searchCache = useRef<{
    data: readonly T[];
    columns: readonly unknown[];
    index: string[];
  } | null>(null);
  const hasSearch = !!searchText && searchText.trim().length > 0;
  const filtered = useMemo(() => {
    let searchIndex: string[] | undefined;
    if (hasSearch) {
      const cache = searchCache.current;
      if (cache && cache.data === data && cache.columns === columns) {
        searchIndex = cache.index;
      } else {
        searchIndex = buildSearchIndex(data, columns);
        searchCache.current = { data, columns, index: searchIndex };
      }
    }
    return filterRows(data, columns, {
      searchText: hasSearch ? searchText : undefined,
      columnFilters,
      searchIndex,
    });
  }, [data, columns, hasSearch, searchText, columnFilters]);

  const filteredCount = filtered.length;
  const onFilteredCountChangeRef = useRef(onFilteredCountChange);
  onFilteredCountChangeRef.current = onFilteredCountChange;
  useEffect(() => {
    onFilteredCountChangeRef.current?.(filteredCount);
  }, [filteredCount]);

  const rows = useMemo(
    () => sortRows(filtered, columns, sort),
    [filtered, columns, sort]
  );

  // Recompute keys whenever rows or keyExtractor change, but keep the previous array when the
  // keys are identical, so an inline keyExtractor doesn't re-render visible rows.
  const previousKeys = useRef<readonly string[]>(EMPTY_KEYS);
  const keys = useMemo(() => {
    const next = rows.map((row, index) => keyExtractor(row, index));
    const prev = previousKeys.current;
    if (
      prev.length === next.length &&
      next.every((key, index) => key === prev[index])
    ) {
      return prev;
    }
    return next;
  }, [rows, keyExtractor]);
  previousKeys.current = keys;

  // Selection: controlled when `selectedKeys` is passed.
  const [innerSelected, setInnerSelected] = useState<ReadonlySet<string>>(
    () => new Set(defaultSelectedKeys)
  );
  const selected = useMemo(
    () => (selectedKeysProp ? new Set(selectedKeysProp) : innerSelected),
    [selectedKeysProp, innerSelected]
  );
  const selectAll = useMemo(
    () =>
      selectionMode === 'multiple' ? getSelectAllState(selected, keys) : 'none',
    [selectionMode, selected, keys]
  );

  const layout = useMemo(
    () => computeLayout(columns, selectionMode === 'multiple'),
    [columns, selectionMode]
  );

  // Latest props for stable callbacks, so memoized rows don't re-render on every parent render.
  const latest = useRef({
    sort,
    sortControlled: sortProp !== undefined,
    onSortChange,
    selected,
    selectionControlled: selectedKeysProp !== undefined,
    onSelectionChange,
    selectionMode,
    onRowPress,
    keys,
  });
  latest.current = {
    sort,
    sortControlled: sortProp !== undefined,
    onSortChange,
    selected,
    selectionControlled: selectedKeysProp !== undefined,
    onSelectionChange,
    selectionMode,
    onRowPress,
    keys,
  };

  const commitSelection = useCallback((next: ReadonlySet<string>) => {
    const l = latest.current;
    if (next === l.selected) return;
    if (!l.selectionControlled) setInnerSelected(next);
    l.onSelectionChange?.([...next]);
  }, []);

  const handleSortPress = useCallback((columnKey: string) => {
    const l = latest.current;
    const next = nextSort(l.sort, columnKey);
    if (!l.sortControlled) setInnerSort(next);
    l.onSortChange?.(next);
  }, []);

  const handleToggle = useCallback(
    (rowKey: string) => {
      const l = latest.current;
      commitSelection(toggleSelection(l.selected, rowKey, l.selectionMode));
    },
    [commitSelection]
  );

  const handleToggleAll = useCallback(() => {
    const l = latest.current;
    commitSelection(toggleAll(l.selected, l.keys));
  }, [commitSelection]);

  const handleRowPress = useCallback(
    (rowKey: string, row: T, rowIndex: number) => {
      const l = latest.current;
      if (
        l.selectionMode === 'single' ||
        (l.selectionMode === 'multiple' && !l.onRowPress)
      ) {
        commitSelection(toggleSelection(l.selected, rowKey, l.selectionMode));
      }
      l.onRowPress?.(row, rowIndex);
    },
    [commitSelection]
  );
  const rowsPressable = selectionMode !== 'none' || onRowPress !== undefined;

  // Horizontal scroll offset drives the header and pinned columns on the UI thread.
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    'worklet';
    scrollX.value = event.contentOffset.x;
  });
  const pinnedStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ translateX: scrollX.value }] };
  });
  const headerScrollStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ translateX: -scrollX.value }] };
  });

  const [bodyHeight, setBodyHeight] = useState(0);
  const onBodyLayout = useCallback((event: LayoutChangeEvent) => {
    setBodyHeight(event.nativeEvent.layout.height);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<T>) => {
      const rowKey = keys[index] ?? String(index);
      return (
        <GridRow
          row={item}
          rowKey={rowKey}
          rowIndex={index}
          selected={selected.has(rowKey)}
          layout={layout}
          theme={theme}
          rowHeight={rowHeight}
          striped={striped}
          pinnedStyle={pinnedStyle}
          onPress={rowsPressable ? handleRowPress : undefined}
          onToggle={handleToggle}
        />
      );
    },
    [
      keys,
      selected,
      layout,
      theme,
      rowHeight,
      striped,
      pinnedStyle,
      rowsPressable,
      handleRowPress,
      handleToggle,
    ]
  );

  const listKeyExtractor = useCallback(
    (_row: T, index: number) => keys[index] ?? String(index),
    [keys]
  );

  return (
    <View
      style={[styles.root, { backgroundColor: theme.background }, style]}
      testID={testID}
    >
      <GridHeader
        layout={layout}
        theme={theme}
        height={headerHeight}
        sort={sort}
        selectAll={selectAll}
        scrollStyle={headerScrollStyle}
        onSortPress={handleSortPress}
        onToggleAll={handleToggleAll}
      />
      <View style={styles.body} onLayout={onBodyLayout}>
        {rows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ color: theme.mutedText, fontSize: theme.fontSize }}>
              {emptyText}
            </Text>
          </View>
        ) : (
          bodyHeight > 0 && (
            <Animated.ScrollView
              horizontal
              bounces={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              testID={testID ? `${testID}-horizontal` : undefined}
            >
              <View style={{ width: layout.totalWidth, height: bodyHeight }}>
                <FlashList
                  data={rows}
                  renderItem={renderItem}
                  keyExtractor={listKeyExtractor}
                  extraData={selected}
                  drawDistance={rowHeight * 6}
                  testID={testID ? `${testID}-list` : undefined}
                />
              </View>
            </Animated.ScrollView>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  body: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
