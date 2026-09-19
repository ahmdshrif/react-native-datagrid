import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import type { AnimatedStyle } from 'react-native-reanimated';
import { Checkbox } from './Checkbox';
import { alignStyle } from './GridRow';
import { CHECKBOX_COLUMN_WIDTH } from './layout';
import type { GridLayout } from './layout';
import type { SelectAllState } from './selection';
import type { DataGridTheme } from './theme';
import type { DataGridColumn, SortState } from './types';

type Props<T> = {
  layout: GridLayout<T>;
  theme: DataGridTheme;
  height: number;
  sort: SortState | null;
  selectAll: SelectAllState;
  scrollStyle: AnimatedStyle<ViewStyle>;
  onSortPress: (columnKey: string) => void;
  onToggleAll: () => void;
};

function GridHeaderImpl<T>({
  layout,
  theme,
  height,
  sort,
  selectAll,
  scrollStyle,
  onSortPress,
  onToggleAll,
}: Props<T>) {
  const renderCells = (columns: DataGridColumn<T>[]) =>
    columns.map((column) => {
      const direction =
        sort?.columnKey === column.key ? sort.direction : undefined;
      const arrow =
        direction === 'asc' ? ' ▲' : direction === 'desc' ? ' ▼' : '';
      const sortLabel =
        direction === 'asc'
          ? ', sorted ascending'
          : direction === 'desc'
            ? ', sorted descending'
            : '';
      return (
        <Pressable
          key={column.key}
          disabled={!column.sortable}
          onPress={() => onSortPress(column.key)}
          style={[
            styles.cell,
            {
              width: column.width,
              paddingHorizontal: theme.cellPaddingHorizontal,
              borderRightColor: theme.border,
            },
            alignStyle(column.align),
          ]}
          accessibilityRole={column.sortable ? 'button' : 'header'}
          accessibilityLabel={`${column.title}${sortLabel}`}
          accessibilityHint={column.sortable ? 'Changes sorting' : undefined}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              {
                color: direction ? theme.text : theme.headerText,
                fontSize: theme.headerFontSize,
              },
            ]}
          >
            {column.title.toUpperCase()}
            <Text style={{ color: theme.accent }}>{arrow}</Text>
          </Text>
        </Pressable>
      );
    });

  return (
    <View
      style={[
        styles.header,
        {
          height,
          backgroundColor: theme.headerBackground,
          borderBottomColor: theme.pinnedEdge,
        },
      ]}
    >
      {layout.pinnedWidth > 0 && <View style={{ width: layout.pinnedWidth }} />}
      <View style={styles.clip}>
        <Animated.View
          style={[
            styles.row,
            styles.track,
            { width: layout.totalWidth - layout.pinnedWidth },
            scrollStyle,
          ]}
        >
          {renderCells(layout.scrolling)}
        </Animated.View>
      </View>
      {/* Drawn last so it covers the scrolling header without zIndex (see GridRow). */}
      {layout.pinnedWidth > 0 && (
        <View
          style={[
            styles.row,
            styles.pinned,
            {
              width: layout.pinnedWidth,
              backgroundColor: theme.headerBackground,
            },
          ]}
        >
          {layout.checkbox && (
            <Pressable
              onPress={onToggleAll}
              style={styles.checkboxCell}
              hitSlop={4}
              accessibilityRole="checkbox"
              accessibilityState={{
                checked: selectAll === 'some' ? 'mixed' : selectAll === 'all',
              }}
              accessibilityLabel="Select all rows"
            >
              <Checkbox
                state={
                  selectAll === 'all'
                    ? 'checked'
                    : selectAll === 'some'
                      ? 'mixed'
                      : 'unchecked'
                }
                theme={theme}
              />
            </Pressable>
          )}
          {renderCells(layout.pinned)}
          <View
            style={[styles.pinnedEdge, { backgroundColor: theme.pinnedEdge }]}
          />
        </View>
      )}
    </View>
  );
}

export const GridHeader = memo(GridHeaderImpl) as typeof GridHeaderImpl;

const styles = StyleSheet.create({
  header: { flexDirection: 'row', borderBottomWidth: 1 },
  row: { flexDirection: 'row' },
  pinned: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  pinnedEdge: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth * 2,
  },
  clip: { flex: 1, overflow: 'hidden' },
  track: { height: '100%' },
  cell: {
    height: '100%',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  checkboxCell: {
    width: CHECKBOX_COLUMN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '600', letterSpacing: 0.5 },
});
