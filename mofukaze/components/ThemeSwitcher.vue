<!-- 新建文件：components/ThemeSwitcher.vue -->
<template>
  <div class="theme-switcher">
    <button 
      @click="toggleThemeMenu"
      class="theme-toggle-btn"
      :class="{ 'is-loading': isThemeLoading }"
      :disabled="isThemeLoading"
      :title="`当前主题: ${theme.label}`"
    >
      <i :class="isThemeLoading ? 'fas fa-spinner fa-spin' : 'fas fa-palette'"></i>
      <span class="theme-label">{{ theme.label }}</span>
    </button>
    
    <Transition name="theme-menu">
      <div v-if="showMenu" class="theme-menu">
        <div 
          v-for="themeOption in availableThemes" 
          :key="themeOption.name"
          @click="selectTheme(themeOption.name)"
          class="theme-option"
          :class="{ active: themeOption.name === currentTheme }"
        >
          <div class="theme-preview">
            <div 
              class="color-primary" 
              :style="{ backgroundColor: themeOption.colors.primary }"
            ></div>
            <div 
              class="color-secondary" 
              :style="{ backgroundColor: themeOption.colors.secondary }"
            ></div>
            <div 
              class="color-accent" 
              :style="{ backgroundColor: themeOption.colors.accent }"
            ></div>
          </div>
          <span class="theme-name">{{ themeOption.label }}</span>
        </div>
      </div>
    </Transition>
    
    <!-- 点击其他地方关闭菜单 -->
    <div 
      v-if="showMenu" 
      @click="closeThemeMenu" 
      class="theme-overlay"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from '~/composables/useTheme'

const { currentTheme, theme, setTheme, getAvailableThemes, isThemeLoading } = useTheme()
const showMenu = ref(false)
const availableThemes = ref(getAvailableThemes())

const toggleThemeMenu = () => {
  showMenu.value = !showMenu.value
}

const selectTheme = async (themeName: string) => {
  if (isThemeLoading.value) return

  showMenu.value = false
  await setTheme(themeName)
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
</script>

<style scoped>
.theme-switcher {
  position: fixed;      /* ✨ 关键：固定在视口上 */
  top: 16px;            /* 距离顶部 */
  right: 16px;          /* 距离右侧 */
  z-index: 9999;        /* 确保永远在最上层 */
}


.theme-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--surface-floating);
  backdrop-filter: blur(16px) saturate(135%);
  border: 1px solid var(--border-medium);
  border-radius: 20px;
  color: var(--theme-text);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.theme-toggle-btn:hover {
  background: color-mix(in srgb, var(--theme-accent) 20%, var(--surface-floating));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.theme-toggle-btn:disabled {
  cursor: wait;
}

.theme-toggle-btn.is-loading {
  box-shadow: 0 0 18px var(--theme-glow);
  opacity: 0.88;
}

.theme-label {
  font-weight: 500;
}

.theme-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: var(--surface-floating);
  backdrop-filter: blur(16px) saturate(135%);
  border: 1px solid var(--border-medium);
  border-radius: 12px;
  padding: 8px;
  min-width: 200px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 1001;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-option:hover {
  background: var(--surface-soft);
  transform: translateX(2px);
}

.theme-option.active {
  background: color-mix(in srgb, var(--theme-accent) 18%, var(--surface-soft));
  border: 1px solid color-mix(in srgb, var(--theme-accent) 38%, var(--border-soft));
}

.theme-preview {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.color-primary,
.color-secondary,
.color-accent {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.theme-name {
  color: var(--theme-text);
  font-size: 14px;
  font-weight: 500;
}

.theme-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

/* 菜单动画 */
.theme-menu-enter-active,
.theme-menu-leave-active {
  transition: all 0.3s ease;
}

.theme-menu-enter-from,
.theme-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>


