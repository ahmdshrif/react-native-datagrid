# Theming

The grid ships light and dark themes and follows the device by default. Override any token, or force a scheme.

```tsx
<DataGrid
  colorScheme="dark" // 'auto' (default), 'light' or 'dark'
  theme={{ accent: '#7C4DFF', rowSelectedBackground: '#EEE7FF' }}
  /* ... */
/>
```

## Tokens

| Token | Used for |
| --- | --- |
| `background` | Row and grid background. |
| `rowAlternateBackground` | Every second row when `striped`. |
| `rowSelectedBackground` | Selected rows. |
| `headerBackground` | Header row, including its pinned part. |
| `headerText` | Header labels. |
| `text` | Cell text and the active sorted header. |
| `mutedText` | Empty state, footer messages, unchecked checkbox border. |
| `border` | Row separators and header cell dividers. |
| `pinnedEdge` | The line marking the pinned column edge, and the header's bottom border. |
| `accent` | Sort arrow, checkboxes, spinners, Retry button. |
| `onAccent` | The checkmark inside a checked checkbox. |
| `fontSize` | Cell text size. Default `14`. |
| `headerFontSize` | Header label size. Default `11`. |
| `cellPaddingHorizontal` | Left and right padding inside every cell. Default `10`. |

## Building on the defaults

`lightTheme` and `darkTheme` are exported, so you can extend one instead of listing every token:

```tsx
import { darkTheme } from 'react-native-datagrid';

const brandDark = { ...darkTheme, accent: '#FFB300', onAccent: '#1A1A1A' };

<DataGrid colorScheme="dark" theme={brandDark} /* ... */ />;
```

## Matching your app's scheme

Pass `colorScheme` when your app has its own theme switch, so the grid follows your setting instead of the device:

```tsx
const { isDark } = useAppTheme();

<DataGrid colorScheme={isDark ? 'dark' : 'light'} /* ... */ />;
```

## Cell-level styling

Tokens cover the frame: backgrounds, borders, header and default cell text. For anything richer — status pills, coloured amounts, avatars — use `renderCell` and style it yourself:

```tsx
{
  key: 'status',
  title: 'Status',
  width: 120,
  renderCell: ({ value }) => <StatusPill status={value as Status} />,
}
```

Memoize the `columns` array, including any closures over your theme, or every row re-renders when the parent does.
