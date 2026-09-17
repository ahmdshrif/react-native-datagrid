import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';

// Counts frame callback intervals longer than 25 ms (1.5x a 60 Hz frame).
// One long interval can hide several missed display frames, so this is a rough
// jank signal, not a dropped-frame count. Use platform profilers for real numbers.
const JANK_MS = 25;

type Stats = { fps: number; jank: number; worst: number };

export function PerfMonitor() {
  const uiFrames = useSharedValue(0);
  const uiJank = useSharedValue(0);
  const uiWorst = useSharedValue(0);

  useFrameCallback((info) => {
    'worklet';
    const dt = info.timeSincePreviousFrame;
    if (dt == null) return;
    uiFrames.value += 1;
    if (dt > JANK_MS) uiJank.value += 1;
    if (dt > uiWorst.value) uiWorst.value = dt;
  });

  const js = useRef({ frames: 0, jank: 0, worst: 0, last: 0 });
  useEffect(() => {
    let id = 0;
    const loop = (t: number) => {
      const s = js.current;
      if (s.last) {
        const dt = t - s.last;
        s.frames += 1;
        if (dt > JANK_MS) s.jank += 1;
        if (dt > s.worst) s.worst = dt;
      }
      s.last = t;
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  const [ui, setUi] = useState<Stats>({ fps: 0, jank: 0, worst: 0 });
  const [jsStats, setJs] = useState<Stats>({ fps: 0, jank: 0, worst: 0 });
  const prev = useRef({ ui: 0, js: 0, t: Date.now() });

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const sec = (now - prev.current.t) / 1000;
      const uiF = uiFrames.value;
      const jsF = js.current.frames;
      const nextUi = {
        fps: Math.round((uiF - prev.current.ui) / sec),
        jank: uiJank.value,
        worst: Math.round(uiWorst.value),
      };
      const nextJs = {
        fps: Math.round((jsF - prev.current.js) / sec),
        jank: js.current.jank,
        worst: Math.round(js.current.worst),
      };
      prev.current = { ui: uiF, js: jsF, t: now };
      setUi(nextUi);
      setJs(nextJs);
      console.log(
        `[perf] ui=${nextUi.fps}fps uiLong=${nextUi.jank} uiWorst=${nextUi.worst}ms js=${nextJs.fps}fps jsLong=${nextJs.jank} jsWorst=${nextJs.worst}ms`
      );
    }, 1000);
    return () => clearInterval(id);
  }, [uiFrames, uiJank, uiWorst]);

  const reset = () => {
    uiJank.value = 0;
    uiWorst.value = 0;
    js.current.jank = 0;
    js.current.worst = 0;
    console.log('[perf] reset');
  };

  return (
    <View style={styles.bar} testID="perf-monitor">
      <Text style={styles.text}>
        UI {ui.fps}fps · long intervals {ui.jank} · worst {ui.worst}ms
      </Text>
      <Text style={styles.text}>
        JS {jsStats.fps}fps · long intervals {jsStats.jank} · worst{' '}
        {jsStats.worst}ms
      </Text>
      <Pressable
        onPress={reset}
        style={styles.btn}
        accessibilityRole="button"
        accessibilityLabel="Reset perf counters"
      >
        <Text style={styles.btnText}>Reset</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#15201B',
  },
  text: { color: '#E3EAE6', fontSize: 12, fontVariant: ['tabular-nums'] },
  btn: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#45C7AF',
  },
  btnText: { color: '#06201B', fontWeight: '600', fontSize: 12 },
});
