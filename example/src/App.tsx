import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DataGrid, darkTheme, lightTheme } from 'react-native-datagrid';
import type {
  ColumnFilters,
  DataGridColumn,
  DataGridTheme,
} from 'react-native-datagrid';
import { STATUSES, makeWorkOrders } from './data';
import type { WorkOrder, WorkOrderStatus } from './data';
import { PerfMonitor } from './PerfMonitor';

const ROW_COUNTS = [100, 10000] as const;

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});
const shortDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

const STATUS_COLORS: Record<
  WorkOrderStatus,
  { light: [string, string]; dark: [string, string] }
> = {
  'Scheduled': { light: ['#DBE7F7', '#1C5AAB'], dark: ['#162941', '#8AB7F6'] },
  'In progress': {
    light: ['#FAEACD', '#8F5400'],
    dark: ['#33260F', '#F1BA5E'],
  },
  'Done': { light: ['#DCF1E2', '#1C7439'], dark: ['#142E1D', '#6FD592'] },
  'Blocked': { light: ['#FBE0DC', '#B42318'], dark: ['#381916', '#FF8C7F'] },
  'Cancelled': { light: ['#E6EBE8', '#5F6B66'], dark: ['#222A26', '#A1ADA7'] },
};

function makeColumns(dark: boolean): DataGridColumn<WorkOrder>[] {
  return [
    { key: 'id', title: 'Order', width: 96, pinned: 'left', sortable: true },
    {
      key: 'customer',
      title: 'Customer',
      width: 170,
      pinned: 'left',
      sortable: true,
    },
    {
      key: 'status',
      title: 'Status',
      width: 120,
      sortable: true,
      renderCell: ({ value }) => {
        const status = value as WorkOrderStatus;
        const [bg, fg] = STATUS_COLORS[status][dark ? 'dark' : 'light'];
        return (
          <View style={[styles.pill, { backgroundColor: bg }]}>
            <Text style={[styles.pillText, { color: fg }]}>{status}</Text>
          </View>
        );
      },
    },
    { key: 'priority', title: 'Priority', width: 90, sortable: true },
    { key: 'region', title: 'Region', width: 96, sortable: true },
    { key: 'technician', title: 'Technician', width: 140, sortable: true },
    {
      key: 'scheduled',
      title: 'Scheduled',
      width: 100,
      sortable: true,
      format: (v) => shortDate.format(v as Date),
    },
    {
      key: 'hours',
      title: 'Hours',
      width: 72,
      align: 'right',
      sortable: true,
      format: (v) => (v as number).toFixed(1),
    },
    {
      key: 'amount',
      title: 'Amount',
      width: 110,
      align: 'right',
      sortable: true,
      format: (v) => money.format(v as number),
    },
    { key: 'site', title: 'Site', width: 80 },
    {
      key: 'visits',
      title: 'Visits',
      width: 72,
      align: 'right',
      sortable: true,
    },
    {
      key: 'rating',
      title: 'Rating',
      width: 76,
      align: 'right',
      sortable: true,
      format: (v) => (v == null ? '—' : (v as number).toFixed(1)),
    },
    { key: 'notes', title: 'Notes', width: 230 },
  ];
}

export default function App() {
  const systemScheme = useColorScheme();
  const [darkOverride, setDarkOverride] = useState<boolean | null>(null);
  const dark = darkOverride ?? systemScheme === 'dark';
  const theme: DataGridTheme = dark ? darkTheme : lightTheme;

  const [rowCount, setRowCount] = useState<(typeof ROW_COUNTS)[number]>(10000);
  const data = useMemo(() => makeWorkOrders(rowCount), [rowCount]);
  const columns = useMemo(() => makeColumns(dark), [dark]);
  const [selected, setSelected] = useState<string[]>([]);
  const [showPerf, setShowPerf] = useState(true);

  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState<WorkOrderStatus[]>([]);
  const [overThousand, setOverThousand] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const columnFilters = useMemo<ColumnFilters<WorkOrder>>(
    () => ({
      status: statuses.length ? { type: 'values', values: statuses } : null,
      amount: overThousand ? { type: 'range', min: 1000 } : null,
    }),
    [statuses, overThousand]
  );
  const toggleStatus = (status: WorkOrderStatus) =>
    setStatuses((current) =>
      current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status]
    );
  const filtersActive =
    search.length > 0 || statuses.length > 0 || overThousand;

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.flex, { backgroundColor: theme.headerBackground }]}
        edges={['top', 'bottom']}
      >
        <StatusBar style={dark ? 'light' : 'dark'} />
        <View style={styles.toolbar}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: theme.text }]}>
              Work orders
            </Text>
            <Text style={[styles.subtitle, { color: theme.mutedText }]}>
              {visibleCount.toLocaleString()} of {data.length.toLocaleString()}{' '}
              rows · {selected.length} selected
            </Text>
          </View>
          <Segmented
            theme={theme}
            label="Rows"
            options={ROW_COUNTS.map((n) => ({
              key: String(n),
              label: n >= 1000 ? `${n / 1000}k` : String(n),
            }))}
            value={String(rowCount)}
            onChange={(key) => {
              setRowCount(Number(key) as (typeof ROW_COUNTS)[number]);
              setSelected([]);
            }}
          />
          <Segmented
            theme={theme}
            label="Theme"
            options={[
              { key: 'light', label: 'Light' },
              { key: 'dark', label: 'Dark' },
            ]}
            value={dark ? 'dark' : 'light'}
            onChange={(key) => setDarkOverride(key === 'dark')}
          />
          <Segmented
            theme={theme}
            label="Perf"
            options={[
              { key: 'on', label: 'FPS' },
              { key: 'off', label: 'Off' },
            ]}
            value={showPerf ? 'on' : 'off'}
            onChange={(key) => setShowPerf(key === 'on')}
          />
        </View>
        <View style={styles.filters}>
          <View
            style={[
              styles.search,
              {
                backgroundColor: theme.background,
                borderColor: theme.pinnedEdge,
              },
            ]}
          >
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search orders, customers, notes"
              placeholderTextColor={theme.mutedText}
              style={[styles.searchInput, { color: theme.text }]}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
              returnKeyType="search"
              accessibilityLabel="Search work orders"
              testID="search-input"
            />
          </View>
          <View style={styles.chips}>
            {STATUSES.map((status) => (
              <Chip
                key={status}
                theme={theme}
                label={status}
                on={statuses.includes(status)}
                onPress={() => toggleStatus(status)}
              />
            ))}
            <Chip
              theme={theme}
              label="Over $1,000"
              on={overThousand}
              onPress={() => setOverThousand((v) => !v)}
            />
            {filtersActive && (
              <Pressable
                onPress={() => {
                  setSearch('');
                  setStatuses([]);
                  setOverThousand(false);
                }}
                style={styles.clear}
                accessibilityRole="button"
              >
                <Text style={[styles.clearText, { color: theme.accent }]}>
                  Clear filters
                </Text>
              </Pressable>
            )}
          </View>
        </View>
        {showPerf && <PerfMonitor />}
        <DataGrid
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          selectionMode="multiple"
          selectedKeys={selected}
          onSelectionChange={setSelected}
          defaultSort={{ columnKey: 'scheduled', direction: 'asc' }}
          searchText={search}
          columnFilters={columnFilters}
          onFilteredCountChange={setVisibleCount}
          emptyText="No work orders match these filters"

          colorScheme={dark ? 'dark' : 'light'}
          testID="work-orders-grid"
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

type ChipProps = {
  theme: DataGridTheme;
  label: string;
  on: boolean;
  onPress: () => void;
};

function Chip({ theme, label, on, onPress }: ChipProps) {
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
      accessibilityLabel={`Filter ${label}`}
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

function Segmented({ theme, label, options, value, onChange }: SegmentedProps) {
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  titleBlock: { flexBasis: '100%' },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 12, fontVariant: ['tabular-nums'] },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  segment: { paddingHorizontal: 10, paddingVertical: 6 },
  segmentText: { fontSize: 12, fontWeight: '600' },
  filters: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  search: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12 },
  searchInput: { height: 38, fontSize: 15 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  clear: { paddingHorizontal: 6, paddingVertical: 5 },
  clearText: { fontSize: 12, fontWeight: '600' },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillText: { fontSize: 12, fontWeight: '600' },
});
