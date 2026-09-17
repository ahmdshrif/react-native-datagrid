import { createContext, memo, useCallback, useContext, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import type { Column, Row } from './data';

const ROW_H = 44;
const HEAD_H = 40;

type Props = {
  rows: Row[];
  columns: Column[];
  pinnedCount: number;
};

// One animated style shared by every pinned cell group, so rows don't each create a worklet.
const PinnedStyleContext = createContext<ReturnType<typeof useAnimatedStyle> | null>(null);

export function Grid({ rows, columns, pinnedCount }: Props) {
  const scrollX = useSharedValue(0);
  const [bodyHeight, setBodyHeight] = useState(0);
  const [sortDir, setSortDir] = useState<0 | 1 | -1>(0);

  const pinned = columns.slice(0, pinnedCount);
  const rest = columns.slice(pinnedCount);
  const pinnedWidth = pinned.reduce((s, c) => s + c.width, 0);
  const totalWidth = columns.reduce((s, c) => s + c.width, 0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });
  const pinnedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: scrollX.value }] }));
  const headerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -scrollX.value }] }));

  const data = useMemo(() => {
    if (!sortDir) return rows;
    return [...rows].sort((a, b) => (a.amount - b.amount) * sortDir);
  }, [rows, sortDir]);

  const renderItem = useCallback(
    ({ item, index }: { item: Row; index: number }) => (
      <GridRow row={item} index={index} pinned={pinned} rest={rest} pinnedCount={pinnedCount} width={totalWidth} />
    ),
    // columns are static for the spike
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pinnedCount, totalWidth],
  );

  const onBodyLayout = (e: LayoutChangeEvent) => setBodyHeight(e.nativeEvent.layout.height);
  const amountIdx = columns.findIndex((c) => c.key === 'amount');

  return (
    <PinnedStyleContext.Provider value={pinnedStyle}>
      <View style={styles.root}>
        <View style={styles.header}>
          {pinnedCount > 0 && (
            <View style={[styles.row, styles.pinnedGroup, styles.headerPinned, { width: pinnedWidth }]}>
              {pinned.map((c) => (
                <HeaderCell key={c.key} col={c} />
              ))}
              <View style={styles.pinnedEdge} />
            </View>
          )}
          <View style={styles.headerClip}>
            <Animated.View style={[styles.row, styles.headerTrack, headerStyle]}>
              {rest.map((c, i) => (
                <HeaderCell
                  key={c.key}
                  col={c}
                  sort={i + pinnedCount === amountIdx ? sortDir : 0}
                  onPress={
                    i + pinnedCount === amountIdx
                      ? () => setSortDir((d) => (d === 0 ? 1 : d === 1 ? -1 : 0))
                      : undefined
                  }
                />
              ))}
            </Animated.View>
          </View>
        </View>

        <View style={styles.body} onLayout={onBodyLayout}>
          {bodyHeight > 0 && (
            <Animated.ScrollView
              horizontal
              bounces={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator
              testID="grid-horizontal-scroll"
            >
              <View style={{ width: totalWidth, height: bodyHeight }}>
                <FlashList
                  data={data}
                  renderItem={renderItem}
                  keyExtractor={(r) => r.id}
                  drawDistance={ROW_H * 6}
                  testID="grid-vertical-list"
                />
              </View>
            </Animated.ScrollView>
          )}
        </View>
      </View>
    </PinnedStyleContext.Provider>
  );
}

function HeaderCell({ col, sort = 0, onPress }: { col: Column; sort?: 0 | 1 | -1; onPress?: () => void }) {
  const label = `${col.title}${sort === 1 ? ' ▲' : sort === -1 ? ' ▼' : ''}`;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.headCell, { width: col.width }, col.align === 'right' && styles.right]}
      accessibilityRole={onPress ? 'button' : 'header'}
      accessibilityLabel={onPress ? `Sort by ${col.title}` : col.title}
    >
      <Text style={styles.headText} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

type RowProps = {
  row: Row;
  index: number;
  pinned: Column[];
  rest: Column[];
  pinnedCount: number;
  width: number;
};

const GridRow = memo(function GridRow({ row, index, pinned, rest, pinnedCount, width }: RowProps) {
  const pinnedStyle = useContext(PinnedStyleContext);
  const bg = index % 2 ? styles.odd : styles.even;
  return (
    <View style={[styles.row, styles.bodyRow, { width }]}>
      {pinnedCount > 0 && (
        <Animated.View style={[styles.row, styles.pinnedGroup, bg, pinnedStyle, { width: pinnedWidthOf(pinned) }]}>
          {pinned.map((c, i) => (
            <Cell key={c.key} col={c} value={row.cells[i]} />
          ))}
          <View style={styles.pinnedEdge} />
        </Animated.View>
      )}
      <View style={[styles.row, bg]}>
        {rest.map((c, i) => (
          <Cell key={c.key} col={c} value={row.cells[i + pinnedCount]} />
        ))}
      </View>
    </View>
  );
});

function pinnedWidthOf(cols: Column[]) {
  return cols.reduce((s, c) => s + c.width, 0);
}

function Cell({ col, value }: { col: Column; value: string }) {
  return (
    <View style={[styles.cell, { width: col.width }, col.align === 'right' && styles.right]}>
      <Text style={[styles.cellText, col.align === 'right' && styles.mono]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  row: { flexDirection: 'row' },
  header: { flexDirection: 'row', height: HEAD_H, backgroundColor: '#EDF2EF', borderBottomWidth: 1, borderBottomColor: '#C4CEC9' },
  headerClip: { flex: 1, overflow: 'hidden' },
  headerTrack: { height: '100%' },
  headCell: { justifyContent: 'center', paddingHorizontal: 10, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: '#DDE4E0' },
  headText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, color: '#5A6862', textTransform: 'uppercase' },
  body: { flex: 1 },
  bodyRow: { height: ROW_H, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DDE4E0' },
  pinnedGroup: { zIndex: 1, backgroundColor: '#FFFFFF' },
  headerPinned: { backgroundColor: '#EDF2EF' },
  pinnedEdge: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, backgroundColor: '#C4CEC9' },
  even: { backgroundColor: '#FFFFFF' },
  odd: { backgroundColor: '#F6F9F7' },
  cell: { justifyContent: 'center', paddingHorizontal: 10 },
  cellText: { fontSize: 14, color: '#15201B' },
  mono: { fontVariant: ['tabular-nums'] },
  right: { alignItems: 'flex-end' },
});
