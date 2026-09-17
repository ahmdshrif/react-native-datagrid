import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Grid } from './src/Grid';
import { PerfMonitor } from './src/PerfMonitor';
import { COLUMNS, makeRows } from './src/data';

const ROW_COUNT = 10000;
const PIN_OPTIONS = [0, 1, 2];

export default function App() {
  const rows = useMemo(() => makeRows(ROW_COUNT), []);
  const [pinnedCount, setPinnedCount] = useState(2);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          <StatusBar style="dark" />
          <View style={styles.toolbar}>
            <Text style={styles.title}>
              {ROW_COUNT.toLocaleString()} rows × {COLUMNS.length} cols
            </Text>
            <View style={styles.seg}>
              {PIN_OPTIONS.map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setPinnedCount(n)}
                  style={[styles.segBtn, pinnedCount === n && styles.segOn]}
                  accessibilityRole="button"
                  accessibilityLabel={`Pin ${n} columns`}
                  accessibilityState={{ selected: pinnedCount === n }}
                >
                  <Text style={[styles.segText, pinnedCount === n && styles.segTextOn]}>Pin {n}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <PerfMonitor />
          <Grid key={pinnedCount} rows={rows} columns={COLUMNS} pinnedCount={pinnedCount} />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F3F6F4' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  title: { fontSize: 15, fontWeight: '700', color: '#15201B' },
  seg: { flexDirection: 'row', borderWidth: 1, borderColor: '#C4CEC9', borderRadius: 8, overflow: 'hidden' },
  segBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FFFFFF' },
  segOn: { backgroundColor: '#0A6E60' },
  segText: { fontSize: 12, color: '#5A6862', fontWeight: '500' },
  segTextOn: { color: '#FFFFFF' },
});
