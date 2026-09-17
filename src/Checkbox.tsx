import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DataGridTheme } from './theme';

type Props = {
  state: 'checked' | 'unchecked' | 'mixed';
  theme: DataGridTheme;
};

function CheckboxImpl({ state, theme }: Props) {
  const on = state !== 'unchecked';
  return (
    <View
      style={[
        styles.box,
        on
          ? { borderColor: theme.accent, backgroundColor: theme.accent }
          : { borderColor: theme.mutedText },
      ]}
    >
      {on && (
        <Text style={[styles.mark, { color: theme.onAccent }]}>
          {state === 'mixed' ? '–' : '✓'}
        </Text>
      )}
    </View>
  );
}

export const Checkbox = memo(CheckboxImpl);

const styles = StyleSheet.create({
  box: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
  },
});
