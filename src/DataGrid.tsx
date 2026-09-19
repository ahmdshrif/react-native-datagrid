import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { ListRenderItemInfo } from '@shopify/flash-list';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDecay,
} from 'react-native-reanimated';
import { GridHeader } from './GridHeader';
import { GridRow } from './GridRow';
import { buildSearchIndex } from './filter';
import { computeLayout } from './layout';
import { getSelectAllState, toggleAll, toggleSelection } from './selection';
import { getVisibleRows } from './rows';
import { nextSort } from './sort';
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
  manualSorting = false,
  searchText,
  columnFilters,
  onFilteredCountChange,
  manualFiltering = false,
  loading = false,
  loadingMore = false,
  refreshing,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 0.5,
  error,
  onRetry,
  loadingText = 'Loading',
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
  const hasSearch =
    !manualFiltering && !!searchText && searchText.trim().length > 0;
  const rows = useMemo(() => {
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
    return getVisibleRows(data, columns, {
      sort,
      manualSorting,
      searchText: hasSearch ? searchText : undefined,
      columnFilters,
      manualFiltering,
      searchIndex,
    });
  }, [
    data,
    columns,
    sort,
    manualSorting,
    hasSearch,
    searchText,
    columnFilters,
    manualFiltering,
  ]);

  const rowCount = rows.length;
  const onFilteredCountChangeRef = useRef(onFilteredCountChange);
  onFilteredCountChangeRef.current = onFilteredCountChange;
  useEffect(() => {
    onFilteredCountChangeRef.current?.(rowCount);
  }, [rowCount]);

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
  // Horizontal scrolling is driven by a pan gesture instead of a ScrollView: the content,
  // header and pinned columns all read this one value in the same frame. A native ScrollView
  // reports its offset a frame late on Android, which made the pinned columns flicker.
  const scrollX = useSharedValue(0);
  const maxScrollX = useSharedValue(0);
  const pinnedStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ translateX: scrollX.value }] };
  });
  const headerScrollStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ translateX: -scrollX.value }] };
  });

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])
        .failOffsetY([-12, 12])
        .onChange((event) => {
          'worklet';
          const next = scrollX.value - event.changeX;
          scrollX.value = Math.min(Math.max(next, 0), maxScrollX.value);
        })
        .onEnd((event) => {
          'worklet';
          scrollX.value = withDecay({
            velocity: -event.velocityX,
            clamp: [0, maxScrollX.value],
          });
        }),
    [scrollX, maxScrollX]
  );
  const contentStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ translateX: -scrollX.value }] };
  });

  const [bodySize, setBodySize] = useState({ width: 0, height: 0 });
  const onBodyLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBodySize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height }
    );
  }, []);
  const bodyHeight = bodySize.height;

  // Keep the offset inside the content when the columns or the viewport change.
  useEffect(() => {
    const max = Math.max(0, layout.totalWidth - bodySize.width);
    maxScrollX.value = max;
    if (scrollX.value > max) scrollX.value = max;
  }, [layout.totalWidth, bodySize.width, maxScrollX, scrollX]);

  const retryButton = onRetry ? (
    <Pressable
      onPress={onRetry}
      style={[styles.retry, { borderColor: theme.accent }]}
      accessibilityRole="button"
    >
      <Text style={[styles.retryText, { color: theme.accent }]}>Retry</Text>
    </Pressable>
  ) : null;

  // Footer spans the visible width and follows horizontal scroll, so it stays on screen.
  const footer =
    loadingMore || error ? (
      <Animated.View
        style={[styles.footer, { width: bodySize.width }, pinnedStyle]}
        accessibilityLiveRegion="polite"
      >
        {loadingMore ? (
          <ActivityIndicator
            color={theme.accent}
            accessibilityLabel="Loading more rows"
          />
        ) : (
          <>
            <Text
              style={[styles.footerText, { color: theme.mutedText }]}
              numberOfLines={2}
            >
              {error}
            </Text>
            {retryButton}
          </>
        )}
      </Animated.View>
    ) : null;

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
          <View style={styles.empty} accessibilityLiveRegion="polite">
            {loading ? (
              <>
                <ActivityIndicator color={theme.accent} />
                <Text style={[styles.stateText, { color: theme.mutedText }]}>
                  {loadingText}
                </Text>
              </>
            ) : error ? (
              <>
                <Text style={[styles.stateText, { color: theme.text }]}>
                  {error}
                </Text>
                {retryButton}
              </>
            ) : (
              <Text
                style={{ color: theme.mutedText, fontSize: theme.fontSize }}
              >
                {emptyText}
              </Text>
            )}
          </View>
        ) : (
          bodyHeight > 0 && (
            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={[
                  { width: layout.totalWidth, height: bodyHeight },
                  contentStyle,
                ]}
                testID={testID ? `${testID}-horizontal` : undefined}
              >
                <FlashList
                  data={rows}
                  renderItem={renderItem}
                  keyExtractor={listKeyExtractor}
                  extraData={selected}
                  drawDistance={rowHeight * 6}
                  ListFooterComponent={footer}
                  onEndReached={onEndReached}
                  onEndReachedThreshold={onEndReachedThreshold}
                  refreshing={onRefresh ? (refreshing ?? false) : undefined}
                  onRefresh={onRefresh}
                  testID={testID ? `${testID}-list` : undefined}
                />
              </Animated.View>
            </GestureDetector>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  body: { flex: 1, overflow: 'hidden' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  stateText: { fontSize: 14, textAlign: 'center' },
  footer: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  footerText: { fontSize: 13, flexShrink: 1 },
  retry: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  retryText: { fontSize: 13, fontWeight: '600' },
});
