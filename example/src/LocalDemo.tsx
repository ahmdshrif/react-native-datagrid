import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { DataGrid } from 'react-native-datagrid';
import type { ColumnFilters, DataGridTheme } from 'react-native-datagrid';
import { makeColumns } from './columns';
import {
  Chip,
  LinkButton,
  SearchBox,
  Segmented,
  controlStyles,
} from './controls';
import { STATUSES, makeWorkOrders } from './data';
import type { WorkOrder, WorkOrderStatus } from './data';

const ROW_COUNTS = [100, 10000] as const;

type Props = { theme: DataGridTheme; dark: boolean };

/** All rows in memory; the grid sorts, searches and filters locally. */
export function LocalDemo({ theme, dark }: Props) {
  const [rowCount, setRowCount] = useState<(typeof ROW_COUNTS)[number]>(10000);
  const data = useMemo(() => makeWorkOrders(rowCount), [rowCount]);
  const columns = useMemo(() => makeColumns(dark), [dark]);
  const [selected, setSelected] = useState<string[]>([]);

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
    <>
      <View style={controlStyles.filters}>
        <View style={controlStyles.chips}>
          <Text style={[controlStyles.subtitle, { color: theme.mutedText }]}>
            {visibleCount.toLocaleString()} of {data.length.toLocaleString()}{' '}
            rows · {selected.length} selected
          </Text>
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
        </View>
        <SearchBox
          theme={theme}
          value={search}
          onChange={setSearch}
          placeholder="Search orders, customers, notes"
        />
        <View style={controlStyles.chips}>
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
            <LinkButton
              theme={theme}
              label="Clear filters"
              onPress={() => {
                setSearch('');
                setStatuses([]);
                setOverThousand(false);
              }}
            />
          )}
        </View>
      </View>
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
    </>
  );
}
