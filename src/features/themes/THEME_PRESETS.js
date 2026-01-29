/**
 * Enhanced Theme Presets
 * 15+ professional color themes with variations
 */

export const ENHANCED_THEME_PRESETS = {
  // Original 5
  'solarized-dark': {
    name: 'Solarized Dark',
    colors: {
      primary: '#268bd2',
      secondary: '#d33682',
      accent: '#2aa198',
      background: '#002b36',
      foreground: '#839496',
      muted: '#073642',
      'muted-foreground': '#586e75',
    }
  },
  
  // New Professional Themes (10+)
  'nord': {
    name: 'Nord',
    colors: {
      primary: '#88c0d0',
      secondary: '#81a1c1',
      accent: '#8fbcbb',
      background: '#2e3440',
      foreground: '#eceff4',
      muted: '#3b4252',
      'muted-foreground': '#81a1c1',
    }
  },
  
  'dracula': {
    name: 'Dracula',
    colors: {
      primary: '#6272a4',
      secondary: '#ff79c6',
      accent: '#50fa7b',
      background: '#282a36',
      foreground: '#f8f8f2',
      muted: '#44475a',
      'muted-foreground': '#6272a4',
    }
  },
  
  'gruvbox-dark': {
    name: 'Gruvbox Dark',
    colors: {
      primary: '#83a598',
      secondary: '#fe8019',
      accent: '#b8bb26',
      background: '#282828',
      foreground: '#ebdbb2',
      muted: '#3c3836',
      'muted-foreground': '#928374',
    }
  },
  
  'tokyo-night': {
    name: 'Tokyo Night',
    colors: {
      primary: '#7aa2f7',
      secondary: '#bb9af7',
      accent: '#7dcfff',
      background: '#1a1b26',
      foreground: '#c0caf5',
      muted: '#292e42',
      'muted-foreground': '#565f89',
    }
  },
  
  // NEW THEMES
  'one-dark': {
    name: 'One Dark',
    colors: {
      primary: '#61afef',
      secondary: '#e06c75',
      accent: '#56b6c2',
      background: '#282c34',
      foreground: '#abb2bf',
      muted: '#3e4451',
      'muted-foreground': '#565c64',
    }
  },
  
  'monokai': {
    name: 'Monokai',
    colors: {
      primary: '#66d9ef',
      secondary: '#f92672',
      accent: '#a1efe4',
      background: '#272822',
      foreground: '#f8f8f2',
      muted: '#3e3d32',
      'muted-foreground': '#75715e',
    }
  },
  
  'github-dark': {
    name: 'GitHub Dark',
    colors: {
      primary: '#79c0ff',
      secondary: '#ff7b72',
      accent: '#56d4dd',
      background: '#0d1117',
      foreground: '#c9d1d9',
      muted: '#161b22',
      'muted-foreground': '#30363d',
    }
  },
  
  'synthwave': {
    name: 'Synthwave 84',
    colors: {
      primary: '#ff006e',
      secondary: '#8338ec',
      accent: '#fb5607',
      background: '#0a0e27',
      foreground: '#ffbe0b',
      muted: '#1a1f3a',
      'muted-foreground': '#3a3f54',
    }
  },
  
  'material-darker': {
    name: 'Material Darker',
    colors: {
      primary: '#89ddff',
      secondary: '#c792ea',
      accent: '#84ffff',
      background: '#212121',
      foreground: '#eeffff',
      muted: '#2d2d2d',
      'muted-foreground': '#545454',
    }
  },
  
  'everforest': {
    name: 'Everforest Dark',
    colors: {
      primary: '#7fbbb3',
      secondary: '#d699b6',
      accent: '#a7c080',
      background: '#2b3339',
      foreground: '#d4be98',
      muted: '#323d43',
      'muted-foreground': '#6f847c',
    }
  },
  
  'ayu-dark': {
    name: 'Ayu Dark',
    colors: {
      primary: '#39bae6',
      secondary: '#ff8f70',
      accent: '#a6e22e',
      background: '#0f1419',
      foreground: '#e6e1cf',
      muted: '#151a1f',
      'muted-foreground': '#565b66',
    }
  },
  
  'challenger-deep': {
    name: 'Challenger Deep',
    colors: {
      primary: '#62d8f1',
      secondary: '#ff5874',
      accent: '#a1efd3',
      background: '#1e1c31',
      foreground: '#cbe3e0',
      muted: '#2d2640',
      'muted-foreground': '#565051',
    }
  },
  
  'palenight': {
    name: 'Pale Night',
    colors: {
      primary: '#82aaff',
      secondary: '#f07178',
      accent: '#89ddff',
      background: '#292d3e',
      foreground: '#eaeaea',
      muted: '#3f3f5f',
      'muted-foreground': '#676e95',
    }
  },
  
  'atom-one-dark': {
    name: 'Atom One Dark',
    colors: {
      primary: '#56b6c2',
      secondary: '#e06c75',
      accent: '#61afef',
      background: '#282c34',
      foreground: '#abb2bf',
      muted: '#3e4451',
      'muted-foreground': '#565c64',
    }
  },
  
  // Light Themes
  'github-light': {
    name: 'GitHub Light',
    colors: {
      primary: '#0969da',
      secondary: '#d1242f',
      accent: '#1a7f37',
      background: '#ffffff',
      foreground: '#24292f',
      muted: '#f6f8fa',
      'muted-foreground': '#57606a',
    }
  },
  
  'light-plus': {
    name: 'Light Plus',
    colors: {
      primary: '#0000ff',
      secondary: '#d16969',
      accent: '#00aa00',
      background: '#ffffff',
      foreground: '#000000',
      muted: '#f3f3f3',
      'muted-foreground': '#808080',
    }
  }
};

export const THEME_CATEGORIES = {
  dark: ['solarized-dark', 'nord', 'dracula', 'gruvbox-dark', 'tokyo-night', 'one-dark', 'monokai', 'github-dark', 'synthwave', 'material-darker', 'everforest', 'ayu-dark', 'challenger-deep', 'palenight', 'atom-one-dark'],
  light: ['github-light', 'light-plus'],
  colorful: ['synthwave', 'tokyo-night', 'ayu-dark'],
  minimal: ['nord', 'gruvbox-dark', 'everforest'],
  vibrant: ['dracula', 'monokai', 'challenger-deep']
};
