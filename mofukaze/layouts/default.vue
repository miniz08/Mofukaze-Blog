<template>
  <div id="wrapper" :class="[`theme-${currentTheme}`, { 'theme-revealing': isThemeRevealing }]">
    <!-- 背景 -->
    <div id="background">
      <div
        v-if="previousBackground"
        class="background-snapshot"
        :style="{ background: previousBackground }"
      ></div>
    </div>
    <div class="ambient-veil" aria-hidden="true"></div>
    <div class="kira-layer" aria-hidden="true">
      <span style="--x: 8vw; --y: 32vh; --size: 12px; --duration: 7s; --delay: -1s;"></span>
      <span style="--x: 18vw; --y: 74vh; --size: 8px; --duration: 9s; --delay: -4s;"></span>
      <span style="--x: 31vw; --y: 18vh; --size: 10px; --duration: 8s; --delay: -2.6s;"></span>
      <span style="--x: 54vw; --y: 82vh; --size: 9px; --duration: 10s; --delay: -5.2s;"></span>
      <span style="--x: 72vw; --y: 24vh; --size: 13px; --duration: 8.6s; --delay: -3.4s;"></span>
      <span style="--x: 88vw; --y: 62vh; --size: 9px; --duration: 9.4s; --delay: -6s;"></span>
    </div>
    <div class="midnight-meteors" aria-hidden="true">
      <span style="--top: -12vh; --left: 92vw; --tail: 220px; --duration: 6.5s; --delay: -0.6s;"></span>
      <span style="--top: -6vh; --left: 80vw; --tail: 180px; --duration: 7.2s; --delay: -2.1s;"></span>
      <span style="--top: 4vh; --left: 108vw; --tail: 240px; --duration: 6.8s; --delay: -1.4s;"></span>
      <span style="--top: 10vh; --left: 70vw; --tail: 170px; --duration: 8s; --delay: -3s;"></span>
      <span style="--top: -10vh; --left: 118vw; --tail: 210px; --duration: 7.5s; --delay: -0.2s;"></span>
      <span style="--top: 16vh; --left: 95vw; --tail: 160px; --duration: 6.9s; --delay: -1.9s;"></span>
      <span style="--top: 22vh; --left: 84vw; --tail: 140px; --duration: 8.4s; --delay: -2.8s;"></span>
      <span style="--top: 0vh; --left: 64vw; --tail: 190px; --duration: 7.8s; --delay: -0.9s;"></span>
      <span style="--top: 30vh; --left: 110vw; --tail: 230px; --duration: 9s; --delay: -1.7s;"></span>
      <span style="--top: 12vh; --left: 126vw; --tail: 175px; --duration: 7.1s; --delay: -3.4s;"></span>
    </div>

    <!-- 顶部导航 -->
    <Top class="top-global" />
    <div class="nav-spacer" />


    <!-- 主题切换器 -->
    <ThemeSwitcher class="theme-switcher-fixed" />

    <!-- 页面内容 -->
    <div id="content">
      <div class="paper">
        <div class="paper-inner">
          <slot />
        </div>
      </div>
    </div>

    <!-- 固定按钮 -->
    <button @click="scrollTop" class="fixed-button" id="back-to-top">
      回到顶部
    </button>
    <button @click="scrollBottom" class="fixed-button" id="back-to-bottom">
      回到底部
    </button>
    <BackgroundMusic />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { preloadThemeBackground, useTheme, type Theme } from '~/composables/useTheme'

const { currentTheme, theme, setTheme, getAvailableThemes } = useTheme()
const showMenu = ref(false)
const availableThemes = ref(getAvailableThemes())
const isThemeRevealing = ref(false)
const previousBackground = ref('')
const appliedBackground = ref('')
let revealTimer = 0

const toggleThemeMenu = () => {
  showMenu.value = !showMenu.value
}

const selectTheme = (themeName: string) => {
  setTheme(themeName)
  showMenu.value = false
}

const closeThemeMenu = () => {
  showMenu.value = false
}

// 点击ESC键关闭菜单
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  window.clearTimeout(revealTimer)
})

useVisitTracker()

// ✅ Nuxt专用SEO函数
useSeoMeta({
  title: 'Mofukaze',
  ogTitle: 'Mofukaze.me',
  description: '夹杂雪花的强风，来自北方的孤风。',
  ogDescription: '夹杂雪花的强风，来自北方的孤风。',
})

// 在客户端挂载时应用主题
onMounted(async () => {
  if (process.client) {
    // 应用初始主题
    const initialTheme = theme.value
    await preloadThemeBackground(initialTheme)
    if (theme.value.name !== initialTheme.name) return

    applyThemeToDOM(initialTheme)
    triggerThemeReveal()
  }
})

// 监听主题变化
watch(theme, async (newTheme) => {
  if (process.client) {
    const themeName = newTheme.name
    await preloadThemeBackground(newTheme)
    if (theme.value.name !== themeName) return

    applyThemeToDOM(newTheme)
    triggerThemeReveal()
  }
})

function scrollTop() {
  const target = document.scrollingElement || document.documentElement || document.body
  target.scrollTo({ top: 0, behavior: 'smooth' })
}

function scrollBottom() {
  const target = document.scrollingElement || document.documentElement || document.body
  target.scrollTo({ top: target.scrollHeight, behavior: 'smooth' })
}

function triggerThemeReveal() {
  window.clearTimeout(revealTimer)
  isThemeRevealing.value = false

  requestAnimationFrame(() => {
    isThemeRevealing.value = true

    revealTimer = window.setTimeout(() => {
      isThemeRevealing.value = false
      previousBackground.value = ''
    }, 920)
  })
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
    if (appliedBackground.value && appliedBackground.value !== theme.backgrounds.main) {
      previousBackground.value = appliedBackground.value
    } else {
      previousBackground.value = ''
    }

    backgroundEl.style.background = theme.backgrounds.main
    backgroundEl.style.backgroundSize = 'cover'
    backgroundEl.style.backgroundPosition = 'center'
    backgroundEl.style.backgroundRepeat = 'no-repeat'
    appliedBackground.value = theme.backgrounds.main
  }
  
  // 更新特效颜色
  updateEffectColors(theme)
}

function updateEffectColors(theme: Theme) {
  // 这里可以更新粒子效果、阴影等颜色
  // 具体实现根据你的现有代码调整
}


</script>

<style>
@import '~/assets/css/base.css';
@import '~/assets/css/layout.css';
@import '~/assets/css/components.css';
@import '~/assets/css/animations.css';
@import '~/assets/css/themes.css';
.nav-spacer {
  height: 136px;
  transition: height 0.3s ease;
}
.nav-spacer.scrolled {
  height: 68px;
}

</style>
