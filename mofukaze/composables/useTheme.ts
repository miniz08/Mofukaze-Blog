
import { ref, computed } from 'vue'

export interface Theme {
  name: string
  label: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textSecondary: string
  }
  backgrounds: {
    main: string
    overlay: string
  }
  effects: {
    blur: string
    shadow: string
    glow: string
  }
}

export const themes: Record<string, Theme> = {
  // 在 composables/useTheme.ts 中修改星光主题的背景
starlight: {
  name: 'starlight',
  label: '星光',
  colors: {
    primary: '#ffffff',
    secondary: '#e6f3ff',
    accent: '#4a90e2',
    background: 'rgba(0,0,0,0.8)',
    surface: 'rgba(255,255,255,0.08)',
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)'
  },
  backgrounds: {
    // 修复：使用URL编码的完整背景值
    main: 'url("http://mofukaze.me/img/frame/7a/5d/7a5d3fe02ad4ea1285ff6fc273b8c69a58b9643b977712ad4a132e46de9f2e95") no-repeat center center fixed',
    overlay: 'linear-gradient(45deg, rgba(138,43,226,0.1), rgba(30,144,255,0.1))'
  },
  effects: {
    blur: 'blur(22px)',
    shadow: 'rgba(80,160,255,0.18)',
    glow: 'rgba(100,180,255,0.28)'
  }
},
  
  sakura: {
    name: 'sakura',
    label: '樱花',
    colors: {
      primary: '#ffb3ba',
      secondary: '#ffdfba',
      accent: '#bae1ff',
      background: 'rgba(255,228,225,0.9)',
      surface: 'rgba(255,255,255,0.15)',
      text: '#2d3748',
      textSecondary: 'rgba(45,55,72,0.7)'
    },
    backgrounds: {
      main: 'url("http://mofukaze.me/img/frame/77/23/77230e2b54b710b6b70c85d8fdee44898bd1f3fe3a361e7a5c6d1c27c82948fd") no-repeat center center fixed',
      // main: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)',
      overlay: 'linear-gradient(45deg, rgba(255,179,186,0.2), rgba(255,223,186,0.2))'
    },
    effects: {
      blur: 'blur(20px)',
      shadow: 'rgba(250,177,160,0.25)',
      glow: 'rgba(255,179,186,0.3)'
    }
  },
  
  aurora: {
    name: 'aurora',
    label: '极光',
    colors: {
      primary: '#00ff88',
      secondary: '#00b4ff',
      accent: '#ff0080',
      background: 'rgba(0,20,40,0.9)',
      surface: 'rgba(0,255,136,0.05)',
      text: '#e0ffff',
      textSecondary: 'rgba(224,255,255,0.7)'
    },
    backgrounds: {
      main: 'url("http://mofukaze.me/img/frame/66/c7/66c70fc4471d7cdd54df0ed8f1538ba28e03391b64b76e0850f3555f12827d75") no-repeat center center fixed',
      // main: 'linear-gradient(180deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      overlay: 'linear-gradient(45deg, rgba(0,255,136,0.1), rgba(0,180,255,0.1), rgba(255,0,128,0.1))'
    },
    effects: {
      blur: 'blur(25px)',
      shadow: 'rgba(0,255,136,0.2)',
      glow: 'rgba(0,255,136,0.4)'
    }
  },
  
  midnight: {
    name: 'midnight',
    label: '午夜',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#ec4899',
      background: 'rgba(15,23,42,0.95)',
      surface: 'rgba(30,41,59,0.8)',
      text: '#f1f5f9',
      textSecondary: 'rgba(241,245,249,0.6)'
    },
    backgrounds: {
      main: 'url("http://mofukaze.me/img/frame/25/45/25453d4a41a2d6b9001d917bde45f9ff05db2554c95bbb1e331a7e3eb86475d6") no-repeat center center fixed',
      // main: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e293b 100%)',
      overlay: 'linear-gradient(45deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))'
    },
    effects: {
      blur: 'blur(18px)',
      shadow: 'rgba(99,102,241,0.15)',
      glow: 'rgba(99,102,241,0.25)'
    }
  }
}

const currentTheme = ref<string>('starlight')

// 从localStorage加载主题
if (process.client) {
  const saved = localStorage.getItem('mofukaze-theme')
  if (saved && themes[saved]) {
    currentTheme.value = saved
  }
}

export const useTheme = () => {
  const theme = computed(() => themes[currentTheme.value])
  
  const setTheme = (themeName: string) => {
    if (themes[themeName]) {
      currentTheme.value = themeName
      if (process.client) {
        localStorage.setItem('mofukaze-theme', themeName)
        applyThemeToDOM(themes[themeName])
      }
    }
  }
  
  const getAvailableThemes = () => Object.values(themes)
  
  return {
    currentTheme: readonly(currentTheme),
    theme,
    setTheme,
    getAvailableThemes
  }
}

// 应用主题到DOM的CSS变量
function applyThemeToDOM(theme: Theme) {
  if (!process.client) return
  
  const root = document.documentElement
  const colors = theme.colors
  
  root.style.setProperty('--theme-primary', colors.primary)
  root.style.setProperty('--theme-secondary', colors.secondary)
  root.style.setProperty('--theme-accent', colors.accent)
  root.style.setProperty('--theme-background', colors.background)
  root.style.setProperty('--theme-surface', colors.surface)
  root.style.setProperty('--theme-text', colors.text)
  root.style.setProperty('--theme-text-secondary', colors.textSecondary)
  root.style.setProperty('--theme-blur', theme.effects.blur)
  root.style.setProperty('--theme-shadow', theme.effects.shadow)
  root.style.setProperty('--theme-glow', theme.effects.glow)
  root.style.setProperty('--theme-overlay', theme.backgrounds.overlay)
  
  // 更新背景
  const backgroundEl = document.getElementById('background')
  if (backgroundEl) {
    backgroundEl.style.background = theme.backgrounds.main
    backgroundEl.style.backgroundSize = 'cover'
    backgroundEl.style.backgroundPosition = 'center'
    backgroundEl.style.backgroundRepeat = 'no-repeat'
  }
  
  // 更新特效颜色
  updateEffectColors(theme)
}

function updateEffectColors(theme: Theme) {
  // 这里可以更新粒子效果、阴影等颜色
  // 具体实现根据你的现有代码调整
}

