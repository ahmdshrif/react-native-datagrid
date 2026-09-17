import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { AnimatedStyle } from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';
import { Checkbox } from './Checkbox';
import { CHECKBOX_COLUMN_WIDTH } from './layout';
import type { GridLayout } from './layout';
import { getCellText, getCellValue } from './cell';
import type { DataGridTheme } from './theme';
import type { CellAlign, DataGridColumn } from './types';

type Props<T> = {
  row: T;
  rowKey: string;
  rowIndex: number;
  selected: boolean;
  layout: GridLayout<T>;
  theme: DataGridTheme;
  rowHeight: number;
  striped: boolean;
  pinnedStyle: AnimatedStyle<ViewStyle>;
  onPress?: (rowKey: string, row: T, rowIndex: number) => void;
  onToggle?: (rowKey: string) => void;
};

function GridRowImpl<T>({
  row,
  rowKey,
  rowIndex,
  selected,
  layout,
  theme,
  rowHeight,
  striped,
  pinnedStyle,
  onPress,
  onToggle,
}: Props<T>) {
  const background = selected
    ? theme.rowSelectedBackground
    : striped && rowIndex % 2 === 1
      ? theme.rowAlternateBackground
      : theme.background;

  // Cell container and text styles depend only on columns and theme, so share them across renders.
  const cellStyles = useMemo(() => {
    const result: Record<string, StyleProp<ViewStyle>> = {};
    for (const column of [...layout.pinned, ...layout.scrolling]) {
      result[column.key] = [
        styles.cell,
        { width: column.width, paddingHorizontal: theme.cellPaddingHorizontal },
        alignStyle(column.align),
      ];
    }
    return result;
  }, [layout, theme]);
  const textStyles = useMemo(
    () => ({
      left: [styles.text, { color: theme.text, fontSize: theme.fontSize }],
      right: [
        styles.text,
        { color: theme.text, fontSize: theme.fontSize },
        styles.tabular,
      ],
    }),
    [theme]
  );

  // Format each cell once; the same text feeds the cell and the row's screen reader label.
  const texts: Record<string, string> = {};
  const labelParts: string[] = [];
  for (const column of [...layout.pinned, ...layout.scrolling]) {
    const text = getCellText(row, column);
    texts[column.key] = text;
    labelParts.push(`${column.title}: ${text}`);
  }
  const accessibilityLabel = labelParts.join(', ');

  const renderCells = (columns: DataGridColumn<T>[]) =>
    columns.map((column) => (
      <View key={column.key} style={cellStyles[column.key]}>
        {column.renderCell ? (
          column.renderCell({
            row,
            rowIndex,
            value: getCellValue(row, column),
            column,
            selected,
          })
        ) : (
          <Text
            numberOfLines={1}
            style={
              column.align === 'right' ? textStyles.right : textStyles.left
            }
          >
            {texts[column.key]}
          </Text>
        )}
      </View>
    ));

  const content = (
    <>
      {layout.pinnedWidth > 0 && (
        <Animated.View
          style={[
            styles.row,
            styles.pinned,
            { width: layout.pinnedWidth, backgroundColor: background },
            pinnedStyle,
          ]}
        >
          {layout.checkbox && (
            <Pressable
              onPress={onToggle ? () => onToggle(rowKey) : undefined}
              style={styles.checkboxCell}
              hitSlop={4}
              accessible={false}
              importantForAccessibility="no-hide-descendants"
            >
              <Checkbox
                state={selected ? 'checked' : 'unchecked'}
                theme={theme}
              />
            </Pressable>
          )}
          {renderCells(layout.pinned)}
          <View
            style={[styles.pinnedEdge, { backgroundColor: theme.pinnedEdge }]}
          />
        </Animated.View>
      )}
      <View style={styles.row}>{renderCells(layout.scrolling)}</View>
    </>
  );

  const toggleActions =
    layout.checkbox && onToggle ? SELECT_ACTIONS : undefined;
  const onAccessibilityAction = toggleActions
    ? () => onToggle?.(rowKey)
    : undefined;

  const rowStyle = [
    styles.row,
    {
      width: layout.totalWidth,
      height: rowHeight,
      backgroundColor: background,
      borderBottomColor: theme.border,
    },
    styles.rowBorder,
  ];

  if (!onPress) {
    return (
      <View
        style={rowStyle}
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityState={layout.checkbox ? { selected } : undefined}
        accessibilityActions={toggleActions}
        onAccessibilityAction={onAccessibilityAction}
      >
        {content}
      </View>
    );
  }
  return (
    <Pressable
      style={rowStyle}
      onPress={() => onPress(rowKey, row, rowIndex)}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      accessibilityActions={toggleActions}
      onAccessibilityAction={onAccessibilityAction}
    >
      {content}
    </Pressable>
  );
}

const SELECT_ACTIONS = [{ name: 'toggleSelection', label: 'Toggle selection' }];

export function alignStyle(align: CellAlign | undefined) {
  if (align === 'right') return styles.alignRight;
  if (align === 'center') return styles.alignCenter;
  return undefined;
}

export const GridRow = memo(GridRowImpl) as typeof GridRowImpl;

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  pinned: { zIndex: 1, height: '100%' },
  pinnedEdge: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth * 2,
  },
  cell: { justifyContent: 'center', height: '100%' },
  checkboxCell: {
    width: CHECKBOX_COLUMN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {},
  tabular: { fontVariant: ['tabular-nums'] },
  alignRight: { alignItems: 'flex-end' },
  alignCenter: { alignItems: 'center' },
});
