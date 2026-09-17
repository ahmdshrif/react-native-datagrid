export type DataGridTheme = {
  background: string;
  rowAlternateBackground: string;
  rowSelectedBackground: string;
  headerBackground: string;
  headerText: string;
  text: string;
  mutedText: string;
  border: string;
  pinnedEdge: string;
  accent: string;
  onAccent: string;
  fontSize: number;
  headerFontSize: number;
  cellPaddingHorizontal: number;
};

export const lightTheme: DataGridTheme = {
  background: '#FFFFFF',
  rowAlternateBackground: '#F6F9F7',
  rowSelectedBackground: '#E2F3EE',
  headerBackground: '#EDF2EF',
  headerText: '#5A6862',
  text: '#15201B',
  mutedText: '#5A6862',
  border: '#DDE4E0',
  pinnedEdge: '#C4CEC9',
  accent: '#0A6E60',
  onAccent: '#FFFFFF',
  fontSize: 14,
  headerFontSize: 11,
  cellPaddingHorizontal: 10,
};

export const darkTheme: DataGridTheme = {
  background: '#131916',
  rowAlternateBackground: '#171E1A',
  rowSelectedBackground: '#15302A',
  headerBackground: '#19211D',
  headerText: '#93A19A',
  text: '#E3EAE6',
  mutedText: '#93A19A',
  border: '#242E29',
  pinnedEdge: '#33403A',
  accent: '#45C7AF',
  onAccent: '#06201B',
  fontSize: 14,
  headerFontSize: 11,
  cellPaddingHorizontal: 10,
};
