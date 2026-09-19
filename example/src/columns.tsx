import { StyleSheet, Text, View } from 'react-native';
import type { DataGridColumn } from 'react-native-grid-table';
import type { WorkOrder, WorkOrderStatus } from './data';

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

export function makeColumns(dark: boolean): DataGridColumn<WorkOrder>[] {
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

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillText: { fontSize: 12, fontWeight: '600' },
});
