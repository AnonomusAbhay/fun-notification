export interface ThemeConfig {
  name: string;
  durationMs: number;
  width: number;
  height: number;
  soundPath?: string;
  position: 'full-screen' | 'bottom-right' | 'center';
}

export const Themes: Record<string, ThemeConfig> = {
  airplane: {
    name: 'airplane',
    durationMs: 7000,
    width: 600,
    height: 150,
    position: 'full-screen'
  },
  cat: {
    name: 'cat',
    durationMs: 6000,
    width: 500,
    height: 120,
    position: 'full-screen'
  },
  meme: {
    name: 'meme',
    durationMs: 8000,
    width: 450,
    height: 450,
    position: 'center'
  }
};

export type ThemeType = keyof typeof Themes;
