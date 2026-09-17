import { useState } from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { darkTheme, lightTheme } from 'react-native-datagrid';
import type { DataGridTheme } from 'react-native-datagrid';
import { Segmented } from './controls';
import { LocalDemo } from './LocalDemo';
import { PerfMonitor } from './PerfMonitor';
import { ServerDemo } from './ServerDemo';

type Mode = 'local' | 'server';

export default function App() {
  const systemScheme = useColorScheme();
  const [darkOverride, setDarkOverride] = useState<boolean | null>(null);
  const dark = darkOverride ?? systemScheme === 'dark';
  const theme: DataGridTheme = dark ? darkTheme : lightTheme;
  const [mode, setMode] = useState<Mode>('local');
  const [showPerf, setShowPerf] = useState(false);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.flex, { backgroundColor: theme.headerBackground }]}
        edges={['top', 'bottom']}
      >
        <StatusBar style={dark ? 'light' : 'dark'} />
        <View style={styles.toolbar}>
          <Text style={[styles.title, { color: theme.text }]}>Work orders</Text>
          <View style={styles.controls}>
            <Segmented
              theme={theme}
              label="Data"
              options={[
                { key: 'local', label: 'Local' },
                { key: 'server', label: 'Server' },
              ]}
              value={mode}
              onChange={(key) => setMode(key as Mode)}
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
        </View>
        {showPerf && <PerfMonitor />}
        {mode === 'local' ? (
          <LocalDemo theme={theme} dark={dark} />
        ) : (
          <ServerDemo theme={theme} dark={dark} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  toolbar: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
