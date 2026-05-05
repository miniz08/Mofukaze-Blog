<template>
  <div id="wrapper" :class="`theme-${currentTheme}`">
    <!-- 背景 -->
    <div id="background"></div>

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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useTheme, type Theme } from '~/composables/useTheme'

const { currentTheme, theme, setTheme, getAvailableThemes } = useTheme()
const showMenu = ref(false)
const availableThemes = ref(getAvailableThemes())

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
})

useVisitTracker()

// ✅ Nuxt专用SEO函数
useSeoMeta({
  title: 'Mofukaze',
  ogTitle: '北风',
  description: '夹杂雪花的强风，来自北方的孤风。',
  ogDescription: '夹杂雪花的强风，来自北方的孤风。',
})

// 在客户端挂载时应用主题
onMounted(() => {
  if (process.client) {
    // 应用初始主题
    applyThemeToDOM(theme.value)
  }
})

// 监听主题变化
watch(theme, (newTheme) => {
  if (process.client) {
    applyThemeToDOM(newTheme)
  }
})

function scrollTop() {
  const target = document.scrollingElement || document.documentElement || document.body
  target.scrollTo({ top: 0, behavior: 'smooth' })
  if (process.client) {
  console.log(
    document.documentElement.scrollHeight,
    document.documentElement.clientHeight
  )
}
}

function scrollBottom() {
  const target = document.scrollingElement || document.documentElement || document.body
  target.scrollTo({ top: target.scrollHeight, behavior: 'smooth' })
  if (process.client) {
  console.log(
    document.documentElement.scrollHeight,
    document.documentElement.clientHeight
  )
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


</script>

<style>
@import '~/assets/css/base.css';
@import '~/assets/css/layout.css';
@import '~/assets/css/components.css';
@import '~/assets/css/animations.css';
@import '~/assets/css/themes.css';
.nav-spacer {
  height: 160px;
  transition: height 0.3s ease;
}
.nav-spacer.scrolled {
  height: 80px;
}

</style>
