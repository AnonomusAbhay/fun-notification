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
  },
  intern: {
    name: 'intern',
    durationMs: 8000,
    width: 600,
    height: 160,
    position: 'full-screen'
  },
  news: {
    name: 'news',
    durationMs: 8500,
    width: 800,
    height: 140,
    position: 'full-screen'
  },
  pirate: {
    name: 'pirate',
    durationMs: 9000,
    width: 650,
    height: 180,
    position: 'full-screen'
  },
  ninja: {
    name: 'ninja',
    durationMs: 5000,
    width: 550,
    height: 400,
    position: 'center'
  }
};

export type ThemeType = keyof typeof Themes;
