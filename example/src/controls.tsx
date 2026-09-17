import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DataGridTheme } from 'react-native-datagrid';

type ChipProps = {
  theme: DataGridTheme;
  label: string;
  on: boolean;
  onPress: () => void;
};

export function Chip({ theme, label, on, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        on
          ? {
              backgroundColor: theme.rowSelectedBackground,
              borderColor: theme.accent,
            }
          : {
              backgroundColor: theme.background,
              borderColor: theme.pinnedEdge,
            },
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
    >
      <Text
        style={[styles.chipText, { color: on ? theme.text : theme.mutedText }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type SegmentedProps = {
  theme: DataGridTheme;
  label: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
};

export function Segmented({
  theme,
  label,
  options,
  value,
  onChange,
}: SegmentedProps) {
  return (
    <View
      style={[styles.segmented, { borderColor: theme.pinnedEdge }]}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
    >
      {options.map((option) => {
        const on = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={[
              styles.segment,
              { backgroundColor: on ? theme.accent : theme.background },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={`${label} ${option.label}`}
          >
            <Text
              style={[
                styles.segmentText,
                { color: on ? theme.onAccent : theme.mutedText },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type SearchBoxProps = {
  theme: DataGridTheme;
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
};

export function SearchBox({
  theme,
  value,
  onChange,
  placeholder,
}: SearchBoxProps) {
  return (
    <View
      style={[
        styles.search,
        { backgroundColor: theme.background, borderColor: theme.pinnedEdge },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.mutedText}
        style={[styles.searchInput, { color: theme.text }]}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        returnKeyType="search"
        accessibilityLabel={placeholder}
        testID="search-input"
      />
    </View>
  );
}

type LinkButtonProps = {
  theme: DataGridTheme;
  label: string;
  onPress: () => void;
};

export function LinkButton({ theme, label, onPress }: LinkButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.link} accessibilityRole="button">
      <Text style={[styles.linkText, { color: theme.accent }]}>{label}</Text>
    </Pressable>
  );
}

export const controlStyles = StyleSheet.create({
  filters: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  subtitle: { fontSize: 12, fontVariant: ['tabular-nums'] },
});

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  segment: { paddingHorizontal: 10, paddingVertical: 6 },
  segmentText: { fontSize: 12, fontWeight: '600' },
  search: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12 },
  searchInput: { height: 38, fontSize: 15 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  link: { paddingHorizontal: 6, paddingVertical: 5 },
  linkText: { fontSize: 12, fontWeight: '600' },
});
