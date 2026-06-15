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

      <div class="search-shell">
        <form class="nav-search" role="search" @submit.prevent="submitSearch">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input
            v-model.trim="searchQuery"
            type="search"
            placeholder="搜索文章 / 动态"
            @focus="isSearchFocused = true"
          />
          <button v-if="searchQuery" type="button" title="清空搜索" @click="clearSearch">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </form>
        <div v-if="showSearchPanel" class="search-panel">
          <p v-if="isSearching">搜索中...</p>
          <p v-else-if="!flatSearchResults.length">没有找到相关内容</p>
          <template v-else>
            <button
              v-for="result in flatSearchResults"
              :key="`${result.type}-${result.id}`"
              type="button"
              @mousedown.prevent="goSearchResult(result)"
            >
              <span>{{ result.type === 'article' ? '文章' : '动态' }}</span>
              <strong>{{ result.title }}</strong>
              <small>{{ result.summary || result.meta || '没有摘要' }}</small>
            </button>
          </template>
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
        <button
          class="mini-nav-item"
          :class="{ active: isMiniSearchOpen }"
          type="button"
          title="搜索"
          @click="toggleMiniSearch"
        >
          <i class="fa-solid fa-magnifying-glass"></i>
        </button>
      </div>
      <div v-if="isMiniSearchOpen" class="search-shell mini-search-shell">
        <form class="nav-search" role="search" @submit.prevent="submitSearch">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input
            v-model.trim="searchQuery"
            type="search"
            placeholder="搜索文章 / 动态"
            @focus="isSearchFocused = true"
          />
          <button v-if="searchQuery" type="button" title="清空搜索" @click="clearSearch">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </form>
        <div v-if="showSearchPanel" class="search-panel">
          <p v-if="isSearching">搜索中...</p>
          <p v-else-if="!flatSearchResults.length">没有找到相关内容</p>
          <template v-else>
            <button
              v-for="result in flatSearchResults"
              :key="`${result.type}-${result.id}`"
              type="button"
              @mousedown.prevent="goSearchResult(result)"
            >
              <span>{{ result.type === 'article' ? '文章' : '动态' }}</span>
              <strong>{{ result.title }}</strong>
              <small>{{ result.summary || result.meta || '没有摘要' }}</small>
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type NavItem = {
  label: string
  path: string
  icon: string
  adminOnly?: boolean
  match: (path: string) => boolean
}

type SearchResult = {
  type: 'article' | 'moment'
  id: number
  title: string
  summary?: string
  meta?: string
}

const admin = useAdmin()
const router = useRouter()
const route = useRoute()

const isMiniNav = ref(false)
const isMiniSearchOpen = ref(false)
const isSearchFocused = ref(false)
const isSearching = ref(false)
const searchQuery = ref('')
const searchResults = ref<{ articles: SearchResult[]; moments: SearchResult[] }>({
  articles: [],
  moments: [],
})
const scrollHysteresis = 12
const compactBreakpoint = 820
const isCompactViewport = ref(false)
const ifVisible = computed(() => admin.isAdmin.value)
let searchTimer = 0

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
    label: '动态',
    path: '/moments',
    icon: 'fa-regular fa-comment-dots',
    match: (path) => path === '/moments',
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

const flatSearchResults = computed(() => [
  ...searchResults.value.articles,
  ...searchResults.value.moments,
])

const showSearchPanel = computed(() => {
  return isSearchFocused.value && searchQuery.value.trim().length >= 2
})

const isActive = (item: NavItem) => item.match(route.path)

const goTo = (path: string) => {
  router.push(path)
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = { articles: [], moments: [] }
}

const runSearch = async () => {
  const keyword = searchQuery.value.trim()
  if (keyword.length < 2) {
    searchResults.value = { articles: [], moments: [] }
    return
  }

  isSearching.value = true
  try {
    const res: any = await $fetch('/api/posts/search/content', {
      method: 'GET',
      query: { q: keyword, limit: 5 },
    })
    const data = res?.data || {}
    searchResults.value = {
      articles: Array.isArray(data.articles) ? data.articles : [],
      moments: Array.isArray(data.moments) ? data.moments : [],
    }
  } catch (error) {
    console.warn('[nav-search] search failed', error)
    searchResults.value = { articles: [], moments: [] }
  } finally {
    isSearching.value = false
  }
}

const submitSearch = () => {
  const firstResult = flatSearchResults.value[0]
  if (firstResult) {
    goSearchResult(firstResult)
    return
  }
  runSearch()
}

const goSearchResult = (result: SearchResult) => {
  isSearchFocused.value = false
  isMiniSearchOpen.value = false
  if (result.type === 'article') {
    router.push(`/article/${result.id}`)
    return
  }
  router.push({ path: '/moments', query: { moment: result.id } })
}

const toggleMiniSearch = () => {
  isMiniSearchOpen.value = !isMiniSearchOpen.value
  isSearchFocused.value = isMiniSearchOpen.value
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

const syncCompactViewport = () => {
  isCompactViewport.value = window.innerWidth <= compactBreakpoint
}

const handleScroll = () => {
  if (isCompactViewport.value) {
    isMiniNav.value = true
    document.getElementById('content')?.classList.add('scrolled')
    return
  }

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollThreshold = getMiniThreshold()

  if (!isMiniNav.value && scrollTop > scrollThreshold) {
    isMiniNav.value = true
    isMiniSearchOpen.value = false
    document.getElementById('content')?.classList.add('scrolled')
  } else if (isMiniNav.value && scrollTop < scrollThreshold - scrollHysteresis) {
    isMiniNav.value = false
    document.getElementById('content')?.classList.remove('scrolled')
  }
}

const handleResize = () => {
  syncCompactViewport()
  handleScroll()
}

watch(searchQuery, () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(runSearch, 220)
})

watch(
  () => route.fullPath,
  () => {
    isSearchFocused.value = false
    isMiniSearchOpen.value = false
  },
)

onMounted(() => {
  syncCompactViewport()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
  window.clearTimeout(searchTimer)
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
  gap: 14px;
  grid-template-columns: auto minmax(220px, 340px) minmax(0, 1fr);
  left: 50%;
  min-height: 76px;
  padding: 10px 14px;
  position: fixed;
  top: 20px;
  transform: translateX(-50%);
  width: min(88%, 1180px);
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
  font-size: clamp(20px, 2vw, 26px);
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

.search-shell {
  min-width: 0;
  position: relative;
}

.nav-search {
  align-items: center;
  background: color-mix(in srgb, var(--surface-soft) 72%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  display: grid;
  gap: 8px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-height: 38px;
  padding: 0 11px;
  transition: background 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
}

.nav-search:focus-within {
  background: color-mix(in srgb, var(--surface-reading) 62%, var(--surface-soft));
  border-color: color-mix(in srgb, var(--theme-accent) 46%, var(--border-soft));
  box-shadow: 0 8px 22px color-mix(in srgb, var(--theme-shadow) 56%, transparent);
}

.nav-search i {
  color: var(--readable-muted);
  font-size: 13px;
}

.nav-search input {
  background: transparent;
  border: 0;
  color: var(--theme-text);
  font: inherit;
  font-size: 14px;
  min-width: 0;
  outline: 0;
}

.nav-search input::placeholder {
  color: var(--readable-faint);
}

.nav-search button {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--readable-muted);
  cursor: pointer;
  display: inline-flex;
  justify-content: center;
  padding: 0;
}

.search-panel {
  background: var(--surface-floating);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  box-shadow: 0 14px 36px var(--theme-shadow);
  display: grid;
  gap: 6px;
  left: 0;
  max-height: min(420px, calc(100vh - 140px));
  overflow: auto;
  padding: 8px;
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  z-index: 10000;
  backdrop-filter: blur(16px) saturate(135%);
}

.search-panel p {
  color: var(--readable-muted);
  font-size: 13px;
  margin: 0;
  padding: 10px;
}

.search-panel button {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--theme-text);
  cursor: pointer;
  display: grid;
  gap: 3px;
  padding: 9px;
  text-align: left;
}

.search-panel button:hover {
  background: color-mix(in srgb, var(--theme-accent) 14%, var(--surface-soft));
  border-color: color-mix(in srgb, var(--theme-accent) 34%, var(--border-soft));
}

.search-panel span {
  color: var(--theme-accent);
  font-size: 12px;
}

.search-panel strong {
  font-size: 14px;
  line-height: 1.35;
}

.search-panel small {
  color: var(--readable-muted);
  font-size: 12px;
  line-height: 1.45;
}

.social-link {
  align-items: center;
  background: color-mix(in srgb, var(--surface-soft) 72%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: 50%;
  display: inline-flex;
  font-size: 14px;
  height: 31px;
  justify-content: center;
  padding: 0;
  transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease, color 0.25s ease;
  width: 31px;
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
  font-size: 14px;
  min-height: 36px;
  padding: 7px 10px;
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

.mini-search-shell {
  margin-top: 10px;
  width: min(92vw, 420px);
}

.mini-nav-item {
  align-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 50%;
  display: flex;
  font-size: 16px;
  height: 35px;
  justify-content: center;
  padding: 0;
  transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
  width: 35px;
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

@media (max-width: 1180px) {
  .full-nav {
    grid-template-columns: minmax(0, 1fr) minmax(220px, 320px);
    width: min(92vw, 1040px);
  }

  .brand-area {
    min-width: 0;
  }

  .nav-links {
    grid-column: 1 / -1;
    justify-content: center;
  }
}

@media (max-width: 900px) {
  .full-nav {
    top: 14px;
    width: min(94vw, 760px);
  }

  .brand-name {
    font-size: 22px;
  }

  .nav-link span {
    display: none;
  }

  .nav-link {
    min-width: 38px;
    justify-content: center;
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

  .mini-nav {
    top: max(10px, env(safe-area-inset-top));
    width: min(100vw - 16px, 440px);
  }

  .mini-nav-content {
    justify-content: flex-start;
    overflow-x: auto;
    padding: 7px 9px;
    scrollbar-width: none;
  }

  .mini-nav-content::-webkit-scrollbar {
    display: none;
  }

  .mini-nav-item {
    flex: 0 0 34px;
    height: 34px;
    width: 34px;
  }

  .mini-search-shell {
    width: min(100%, calc(100vw - 16px));
  }

  .search-panel {
    max-height: min(360px, calc(100dvh - 118px));
  }
}
</style>
