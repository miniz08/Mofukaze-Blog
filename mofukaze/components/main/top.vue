<template>
  <div class="top-wrapper">
    <nav v-if="!isMiniNav" class="full-nav" aria-label="主导航">
      <div class="brand-area">
        <button class="brand-name" type="button" @click="goTo('/')">
          Mofukaze.me
        </button>
        <div class="social-links" aria-label="社交链接">
          <button
            v-for="link in socialLinks"
            :key="link.label"
            class="social-link"
            type="button"
            :title="link.label"
            @click="openSocial(link.href)"
          >
            <i :class="link.icon"></i>
          </button>
        </div>
      </div>

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
const scrollHysteresis = 12
const ifVisible = computed(() => admin.isAdmin.value)

const socialLinks = [
  { label: 'GitHub', icon: 'fa-brands fa-github', href: '' },
  { label: 'Bilibili', icon: 'fa-brands fa-bilibili', href: '' },
  { label: 'Twitter', icon: 'fa-brands fa-twitter', href: '' },
]

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

const openSocial = (href: string) => {
  if (!href || !process.client) return
  window.open(href, '_blank', 'noopener,noreferrer')
}

const getMiniThreshold = () => {
  const paper = document.querySelector('.paper') as HTMLElement | null
  const fullNav = document.querySelector('.full-nav') as HTMLElement | null

  if (!paper) return 96

  const navBottom = 20 + (fullNav?.getBoundingClientRect().height || 86)
  const paperTop = paper.getBoundingClientRect().top + window.scrollY

  return Math.max(48, paperTop - navBottom - 8)
}

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollThreshold = getMiniThreshold()

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
  window.addEventListener('resize', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
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

.brand-name,
.social-link,
.nav-link,
.mini-nav-item {
  color: var(--theme-text);
  cursor: pointer;
  font-family: inherit;
}

.brand-area {
  align-items: center;
  display: flex;
  gap: 14px;
  min-width: 238px;
}

.brand-name {
  background: transparent;
  border: 0;
  font-size: clamp(22px, 2.3vw, 30px);
  font-weight: 800;
  line-height: 1;
  padding: 0;
  text-align: left;
  text-shadow: 0 0 18px color-mix(in srgb, var(--theme-accent) 34%, transparent);
}

.social-links {
  display: flex;
  gap: 7px;
}

.social-link {
  align-items: center;
  background: color-mix(in srgb, var(--surface-soft) 72%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: 50%;
  display: inline-flex;
  font-size: 15px;
  height: 34px;
  justify-content: center;
  padding: 0;
  transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease, color 0.25s ease;
  width: 34px;
}

.social-link:hover {
  background: color-mix(in srgb, var(--theme-accent) 20%, var(--surface-soft));
  border-color: color-mix(in srgb, var(--theme-accent) 42%, var(--border-soft));
  color: color-mix(in srgb, var(--theme-accent) 72%, var(--theme-text));
  transform: translateY(-1px);
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

  .brand-area {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }

  .nav-links {
    justify-content: flex-start;
  }
}
</style>
