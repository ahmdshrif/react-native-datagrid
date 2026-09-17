import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DataGrid, darkTheme, lightTheme } from 'react-native-datagrid';
import type { DataGridColumn, DataGridTheme } from 'react-native-datagrid';
import { makeWorkOrders } from './data';
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
              {data.length.toLocaleString()} rows · {selected.length} selected
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
        {showPerf && <PerfMonitor />}
        <DataGrid
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          selectionMode="multiple"
          selectedKeys={selected}
          onSelectionChange={setSelected}
          defaultSort={{ columnKey: 'scheduled', direction: 'asc' }}
          colorScheme={dark ? 'dark' : 'light'}
          testID="work-orders-grid"
        />
      </SafeAreaView>
    </SafeAreaProvider>
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
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillText: { fontSize: 12, fontWeight: '600' },
});
