<template>
  <div class="top-wrapper">
    <nav v-if="!isMiniNav" class="full-nav" aria-label="主导航">
      <button class="brand-mark" type="button" @click="goTo('/')">
        <span>Mofukaze</span>
        <strong>北风</strong>
      </button>

      <div class="nav-links">
        <button
          v-for="item in visibleNavItems"
          :key="item.path"
          type="button"
          class="nav-link"
          :class="{ active: isActive(item) }"
          @click="goTo(item.path)"
        >
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <div v-else class="mini-nav">
      <div class="mini-nav-content">
        <button
          v-for="item in visibleNavItems"
          :key="item.path"
          class="mini-nav-item"
          :class="{ active: isActive(item) }"
          type="button"
          :title="item.label"
          @click="goTo(item.path)"
        >
          <i :class="item.icon"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type NavItem = {
  label: string
  path: string
  icon: string
  adminOnly?: boolean
  match: (path: string) => boolean
}

const admin = useAdmin()
const router = useRouter()
const route = useRoute()

const isMiniNav = ref(false)
const scrollThreshold = 300
const scrollHysteresis = 20
const ifVisible = computed(() => admin.isAdmin.value)

const navItems: NavItem[] = [
  {
    label: '主页',
    path: '/',
    icon: 'fa-solid fa-house',
    match: (path) => path === '/',
  },
  {
    label: '文章',
    path: '/articleList',
    icon: 'fa-solid fa-newspaper',
    match: (path) => path === '/articleList' || path.startsWith('/List') || path.startsWith('/article/'),
  },
  {
    label: '收藏',
    path: '/collection',
    icon: 'fa-regular fa-heart',
    match: (path) => path === '/collection' || path.startsWith('/collections/'),
  },
  {
    label: '关于',
    path: '/about',
    icon: 'fa-regular fa-address-card',
    match: (path) => path === '/about',
  },
  {
    label: '写文章',
    path: '/editor',
    icon: 'fa-solid fa-pen',
    adminOnly: true,
    match: (path) => path === '/editor' || path.startsWith('/edit/'),
  },
  {
    label: '后台',
    path: '/admin',
    icon: 'fa-solid fa-chart-line',
    adminOnly: true,
    match: (path) => path === '/admin',
  },
]

const visibleNavItems = computed(() => {
  return navItems.filter((item) => !item.adminOnly || ifVisible.value)
})

const isActive = (item: NavItem) => item.match(route.path)

const goTo = (path: string) => {
  router.push(path)
}

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop

  if (!isMiniNav.value && scrollTop > scrollThreshold) {
    isMiniNav.value = true
    document.getElementById('content')?.classList.add('scrolled')
  } else if (isMiniNav.value && scrollTop < scrollThreshold - scrollHysteresis) {
    isMiniNav.value = false
    document.getElementById('content')?.classList.remove('scrolled')
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.full-nav {
  align-items: center;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.09), transparent),
    var(--surface-floating);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  box-shadow: 0 12px 32px var(--theme-shadow);
  display: grid;
  gap: 18px;
  grid-template-columns: auto minmax(0, 1fr);
  left: 50%;
  min-height: 86px;
  padding: 12px 16px;
  position: fixed;
  top: 20px;
  transform: translateX(-50%);
  width: min(86%, 1120px);
  z-index: 9999;
  backdrop-filter: blur(16px) saturate(135%);
}

.full-nav::after {
  background: linear-gradient(90deg, transparent, var(--theme-accent), transparent);
  bottom: 0;
  content: "";
  height: 1px;
  left: 18px;
  opacity: 0.55;
  position: absolute;
  right: 18px;
}

.brand-mark,
.nav-link,
.mini-nav-item {
  color: var(--theme-text);
  cursor: pointer;
  font-family: inherit;
}

.brand-mark {
  background: color-mix(in srgb, var(--surface-reading) 68%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 136px;
  padding: 10px 13px;
  text-align: left;
}

.brand-mark span {
  color: var(--readable-muted);
  font-size: 12px;
}

.brand-mark strong {
  font-size: 22px;
  line-height: 1;
}

.nav-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.nav-link {
  align-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  display: inline-flex;
  gap: 8px;
  min-height: 40px;
  padding: 8px 12px;
  transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease, transform 0.25s ease;
}

.nav-link:hover,
.nav-link.active {
  background: color-mix(in srgb, var(--theme-accent) 18%, var(--surface-soft));
  border-color: color-mix(in srgb, var(--theme-accent) 40%, var(--border-soft));
  transform: translateY(-1px);
}

.nav-link.active {
  color: color-mix(in srgb, var(--theme-accent) 72%, var(--theme-text));
}

.mini-nav {
  animation: fadeInDown 0.3s ease forwards;
  left: 50%;
  opacity: 0;
  position: fixed;
  top: 20px;
  transform: translateX(-50%);
  z-index: 9999;
}

.mini-nav-content {
  background: var(--surface-floating);
  border: 1px solid var(--border-medium);
  border-radius: 999px;
  box-shadow: 0 8px 24px var(--theme-shadow);
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  backdrop-filter: blur(16px) saturate(135%);
}

.mini-nav-item {
  align-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 50%;
  display: flex;
  font-size: 17px;
  height: 38px;
  justify-content: center;
  padding: 0;
  transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
  width: 38px;
}

.mini-nav-item:hover,
.mini-nav-item.active {
  background: color-mix(in srgb, var(--theme-accent) 24%, var(--surface-soft));
  border-color: color-mix(in srgb, var(--theme-accent) 42%, var(--border-soft));
  transform: translateY(-1px);
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@media (max-width: 760px) {
  .full-nav {
    align-items: stretch;
    grid-template-columns: 1fr;
    width: min(94%, 680px);
  }

  .brand-mark {
    min-width: 0;
  }

  .nav-links {
    justify-content: flex-start;
  }
}
</style>
