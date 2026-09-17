# Scroll spike results

**Question:** can a pure-JS data grid (FlashList + Reanimated + normal views) scroll smoothly in both directions with a sticky header and pinned columns?

**Answer:** yes on both platforms in these tests. Continue with the views approach; no need for a Skia fallback yet.

## Setup

- Expo SDK 55 (React Native 0.83, FlashList 2.0.2, Reanimated 4.2.1), Release builds
- 10,000 rows × 15 columns (1,504 px wide), row height 44
- Header and pinned columns follow the horizontal scroll through one Reanimated shared value on the UI thread. Pinned cells use `translateX = scrollX`, header uses `translateX = -scrollX`.
- Measured with an in-app monitor: UI thread frames via `useFrameCallback`, JS thread frames via `requestAnimationFrame`. A frame over 25 ms counts as dropped.
- Test run: 9 fast vertical flings + 4 horizontal swipes over ~12 s, sent as real touches.

## Numbers

| Platform | Pinned | UI dropped (worst) | JS dropped (worst) |
|---|---|---|---|
| Android emulator, API 35 (SDK 57 build) | 0 | 0 (17 ms) | 7 (49 ms) |
| Android emulator, API 35 (SDK 57 build) | 2 | 1 (33 ms) | 7 (132 ms) |
| Android emulator, API 35 (SDK 55 build) | 2 | 0 (19 ms) | 6 (56 ms) |
| iOS 26.2 simulator, iPhone 16 Pro | 2 | 1 (28 ms) | 2 (30 ms) |
| iOS, 4 back-to-back very fast flings | 2 | 0 (17 ms) | 1 (26 ms) |

No blank rows were seen after very fast flings on either platform.

## Findings

- Pinning is almost free: the sync runs on the UI thread, so the header and pinned columns never lag behind the body.
- The JS thread is where cost shows up, because FlashList mounts new rows there. Android drops more JS frames than iOS.
- Android `elevation`/shadow on recycled rows rendered inconsistently. A 1 px absolute edge view is reliable and cheaper.
- Header cells inside the translated track need an explicit full height.

## Not covered yet

- Real low-end Android hardware. The emulator runs on a fast Mac, so treat Android numbers as a best case.
- Column virtualization (all 15 columns render per row).
- Sorting 10,000 rows, cell editing, and resizing under load.

## Machine notes

- Expo SDK 57 needs Xcode 27 and SDK 56 needs Xcode 26.4. This machine has Xcode 26.3, so the spike runs on SDK 55.
- `pod install` needs `LANG=en_US.UTF-8`.
- Android: pass the AVD name to `expo run:android --device`, not the adb serial.
