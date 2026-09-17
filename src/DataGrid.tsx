import { useCallback, useMemo, useRef, useState } from 'react';
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
  const rows = useMemo(
    () => sortRows(data, columns, sort),
    [data, columns, sort]
  );

  const keys = useMemo(
    () => rows.map((row, index) => keyExtractor(row, index)),
    // keyExtractor is usually an inline function; keys only change with rows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows]
  );

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
