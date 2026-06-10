<template>
  <section class="article-list-page">
    <header class="list-header">
      <div>
        <p class="eyebrow">Article Library</p>
        <h1>{{ currentTag }}</h1>
      </div>
      <button class="quick-read-toggle" type="button" @click="toggleQuickReadMode">
        <component :is="isQuickReadMode ? Minimize2 : Maximize2" />
        {{ isQuickReadMode ? '退出快速阅读' : '快速阅读' }}
      </button>
    </header>

    <div v-if="isLoading" class="list-state">
      正在整理文章...
    </div>

    <div v-else-if="errorMessage" class="list-state error-state">
      {{ errorMessage }}
    </div>

    <div v-else-if="isQuickReadMode" class="quick-read-shell">
      <aside class="quick-sidebar">
        <div class="quick-sidebar-header">
          <BookOpen />
          <span>主题目录</span>
        </div>

        <div
          v-for="group in groupedArticleEntries"
          :key="group.subTag"
          class="quick-group"
        >
          <button class="group-toggle" type="button" @click="toggleQuickSubtag(group.subTag)">
            <component :is="isQuickSubtagOpen[group.subTag] ? ChevronDown : ChevronRight" />
            <span>{{ group.subTag }}</span>
            <small>{{ group.articles.length }}</small>
          </button>

          <transition name="drawer-transition">
            <div v-if="isQuickSubtagOpen[group.subTag]" class="quick-article-list">
              <button
                v-for="article in group.articles"
                :key="article.id"
                class="quick-article-item"
                :class="{ active: article.id === currentArticleId }"
                type="button"
                @click="loadArticleContent(article.id)"
              >
                <span>{{ article.title }}</span>
                <small>{{ formatDate(article.time) }}</small>
              </button>
            </div>
          </transition>
        </div>
      </aside>

      <main class="quick-reader">
        <div v-if="isArticleLoading" class="reader-state">
          正在载入正文...
        </div>

        <article v-else-if="currentArticle" class="reader-article">
          <header>
            <p>{{ currentArticle.tag }} / {{ currentArticle.subTag || '未分组' }}</p>
            <h2>{{ currentArticle.title }}</h2>
            <span>{{ formatDate(currentArticle.time) }}</span>
          </header>
          <div class="quick-article-content" v-html="currentArticleContent"></div>
        </article>

        <div v-else class="reader-state">
          从左侧选择一篇文章开始阅读。
        </div>
      </main>
    </div>

    <div v-else class="grouped-list">
      <section
        v-for="group in groupedArticleEntries"
        :key="group.subTag"
        class="subtag-section"
      >
        <button class="subtag-header" type="button" @click="toggleSubtag(group.subTag)">
          <div>
            <span>{{ group.subTag }}</span>
            <small>{{ group.articles.length }} 篇文章</small>
          </div>
          <component :is="isSubtagOpen[group.subTag] ? ChevronDown : ChevronRight" />
        </button>

        <transition name="drawer-transition">
          <ul v-if="isSubtagOpen[group.subTag]" class="drawer-list">
            <li v-for="article in group.articles" :key="article.id">
              <button class="article-link" type="button" @click="redirectToArticle(article.id)">
                <span>{{ article.title }}</span>
                <small>发布于 {{ formatDate(article.time) }}</small>
              </button>

              <div v-if="ifVisible" class="article-actions">
                <button class="icon-button" type="button" title="编辑" @click.stop="editArticle(article)">
                  <Pencil />
                </button>
                <button class="icon-button danger" type="button" title="删除" @click.stop="confirmDeleteArticle(article.id)">
                  <Trash2 />
                </button>
              </div>
            </li>
          </ul>
        </transition>
      </section>

      <p v-if="titles.length === 0" class="list-state">
        这个分类暂时还没有文章。
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pencil,
  Trash2,
} from 'lucide-vue-next'

type ArticleItem = {
  id: number
  title: string
  time: string
  tag: string
  subTag: string
}

type ArticleDetail = ArticleItem & {
  content: string
}

const router = useRouter()
const route = useRoute()
const admin = useAdmin()

const isQuickReadMode = ref(false)
const isLoading = ref(false)
const isArticleLoading = ref(false)
const errorMessage = ref('')
const currentTag = ref(getRouteTag())
const currentArticleId = ref<number | null>(null)
const currentArticleContent = ref('')
const titles = ref<ArticleItem[]>([])
const articleCache = ref<Record<number, ArticleDetail>>({})
const isSubtagOpen = ref<Record<string, boolean>>({})
const isQuickSubtagOpen = ref<Record<string, boolean>>({})

const ifVisible = computed(() => !!admin.getAuthHeader())

const groupedArticleEntries = computed(() => {
  const groups = new Map<string, ArticleItem[]>()

  for (const article of titles.value) {
    const subTag = article.subTag?.trim() || '未分组'
    if (!groups.has(subTag)) groups.set(subTag, [])
    groups.get(subTag)?.push(article)
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => new Intl.Collator('zh-CN').compare(a, b))
    .map(([subTag, articles]) => ({
      subTag,
      articles: articles
        .slice()
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()),
    }))
})

const currentArticle = computed(() => {
  if (!currentArticleId.value) return null
  return articleCache.value[currentArticleId.value] || titles.value.find((item) => item.id === currentArticleId.value) || null
})

function getRouteTag() {
  const value = route.query.tag
  if (Array.isArray(value)) return value[0] || '小说'
  return value ? String(value) : '小说'
}

const normalizeArticleList = (payload: unknown): ArticleItem[] => {
  if (!Array.isArray(payload)) return []

  return payload.map((item: any) => ({
    id: Number(item.id),
    title: String(item.title || '未命名文章'),
    time: String(item.posttime || item.time || ''),
    tag: String(item.tag || currentTag.value),
    subTag: String(item.subTag || item.subtag || '未分组'),
  }))
}

const normalizeArticleDetail = (payload: unknown): ArticleDetail | null => {
  const item = Array.isArray(payload) ? payload[0] : null
  if (!item) return null

  return {
    id: Number(item.id),
    title: String(item.title || '未命名文章'),
    time: String(item.posttime || item.time || ''),
    tag: String(item.tag || currentTag.value),
    subTag: String(item.subTag || item.subtag || '未分组'),
    content: String(item.content || '<p>这篇文章暂时没有内容。</p>'),
  }
}

const syncGroupState = () => {
  groupedArticleEntries.value.forEach((group, index) => {
    if (typeof isSubtagOpen.value[group.subTag] !== 'boolean') {
      isSubtagOpen.value[group.subTag] = true
    }

    if (typeof isQuickSubtagOpen.value[group.subTag] !== 'boolean') {
      isQuickSubtagOpen.value[group.subTag] = index === 0
    }
  })
}

const loadArticles = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await $fetch('/api/posts/article/getArticlesByTag', {
      method: 'GET',
      query: { tag: currentTag.value },
    })

    titles.value = normalizeArticleList(res)
    syncGroupState()

    if (isQuickReadMode.value) {
      const stillExists = titles.value.some((article) => article.id === currentArticleId.value)
      if (!stillExists) {
        currentArticleId.value = null
        currentArticleContent.value = ''
        await loadFirstArticle()
      }
    }
  } catch (err: any) {
    console.error('[article-list] 加载失败', err)
    errorMessage.value = err?.message || '文章列表加载失败'
    titles.value = []
  } finally {
    isLoading.value = false
  }
}

const loadFirstArticle = async () => {
  const firstArticle = groupedArticleEntries.value[0]?.articles[0]
  if (firstArticle) {
    await loadArticleContent(firstArticle.id)
  }
}

const loadArticleContent = async (id: number) => {
  currentArticleId.value = id

  if (articleCache.value[id]) {
    currentArticleContent.value = articleCache.value[id].content
    return
  }

  isArticleLoading.value = true
  try {
    const res = await $fetch('/api/posts/article/findArticleByID', {
      method: 'GET',
      query: { id },
    })
    const detail = normalizeArticleDetail(res)

    if (!detail) {
      throw new Error('正文加载失败')
    }

    articleCache.value = {
      ...articleCache.value,
      [id]: detail,
    }
    currentArticleContent.value = detail.content
  } catch (err: any) {
    currentArticleContent.value = `<p>${err?.message || '正文加载失败'}</p>`
  } finally {
    isArticleLoading.value = false
  }
}

const toggleQuickReadMode = async () => {
  isQuickReadMode.value = !isQuickReadMode.value

  if (isQuickReadMode.value && !currentArticleId.value) {
    await loadFirstArticle()
  }
}

const toggleSubtag = (subTag: string) => {
  isSubtagOpen.value[subTag] = !isSubtagOpen.value[subTag]
}

const toggleQuickSubtag = (subTag: string) => {
  isQuickSubtagOpen.value[subTag] = !isQuickSubtagOpen.value[subTag]
}

const redirectToArticle = (id: number) => {
  router.push(`/article/${id}`)
}

const editArticle = (article: ArticleItem) => {
  router.push({ path: `/edit/${article.id}`, query: { id: article.id } })
}

const confirmDeleteArticle = (id: number) => {
  if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) return
  deleteArticle(id)
}

const deleteArticle = async (id: number) => {
  try {
    const res: any = await $fetch('/api/posts/article/deleteArticle', {
      method: 'DELETE',
      body: { id },
      headers: admin.getAuthHeader(),
    })

    if (res?.status && res.status !== 'success') {
      throw new Error(res.message || '删除失败')
    }

    titles.value = titles.value.filter((article) => article.id !== id)
    const nextCache = { ...articleCache.value }
    delete nextCache[id]
    articleCache.value = nextCache

    if (currentArticleId.value === id) {
      currentArticleId.value = null
      currentArticleContent.value = ''
      await loadFirstArticle()
    }
  } catch (err: any) {
    alert(err?.message || '删除失败，请稍后重试')
  }
}

const formatDate = (value: string | Date) => {
  if (!value) return '未知时间'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

watch(
  () => route.query.tag,
  () => {
    currentTag.value = getRouteTag()
  },
  { immediate: true },
)

watch(
  currentTag,
  () => {
    loadArticles()
  },
  { immediate: true },
)

useSeoMeta({
  title: computed(() => `${currentTag.value} - Mofukaze`),
})
</script>

<style scoped>
.article-list-page {
  color: var(--theme-text);
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-height: 64vh;
  max-width: 100%;
}

.list-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 18px;
}

.eyebrow {
  color: var(--theme-accent);
  font-size: 13px;
  letter-spacing: 0;
  margin: 0 0 4px;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: clamp(30px, 5vw, 46px);
}

.quick-read-toggle,
.icon-button,
.group-toggle,
.subtag-header,
.article-link,
.quick-article-item {
  font-family: inherit;
}

.quick-read-toggle {
  align-items: center;
  background: color-mix(in srgb, var(--theme-accent) 24%, var(--surface-soft));
  border: 1px solid color-mix(in srgb, var(--theme-accent) 24%, var(--border-soft));
  border-radius: 8px;
  color: var(--theme-text);
  cursor: pointer;
  display: inline-flex;
  gap: 8px;
  padding: 11px 15px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

.quick-read-toggle:hover {
  box-shadow: 0 8px 24px var(--theme-shadow);
  transform: translateY(-2px);
}

.quick-read-toggle svg,
.quick-sidebar-header svg,
.group-toggle svg,
.subtag-header svg,
.icon-button svg {
  height: 18px;
  width: 18px;
}

.list-state {
  background: var(--surface-card);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  box-shadow: 0 12px 30px var(--theme-shadow);
  padding: 26px;
  text-align: center;
}

.error-state {
  color: #ff9aa8;
}

.grouped-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.subtag-section,
.quick-sidebar,
.quick-reader {
  background: var(--surface-card);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  box-shadow: 0 14px 34px color-mix(in srgb, var(--theme-shadow) 60%, rgba(0, 0, 0, 0.16));
}

.quick-reader {
  background: var(--surface-reading);
}

.subtag-section {
  overflow: hidden;
}

.subtag-header {
  align-items: center;
  background: color-mix(in srgb, var(--surface-reading) 46%, transparent);
  border: 0;
  color: var(--theme-text);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  padding: 16px 18px;
  text-align: left;
  width: 100%;
}

.subtag-header span {
  display: block;
  font-size: 19px;
  font-weight: 700;
}

.subtag-header small,
.article-link small,
.quick-article-item small,
.reader-article header p,
.reader-article header span {
  color: var(--readable-muted);
}

.drawer-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  list-style: none;
  margin: 0;
  overflow: hidden;
  padding: 14px 18px 18px;
}

.drawer-list li {
  align-items: center;
  background: color-mix(in srgb, var(--surface-reading) 56%, var(--surface-soft));
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  padding: 12px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

.drawer-list li:hover {
  background: color-mix(in srgb, var(--theme-accent) 14%, var(--surface-reading));
  box-shadow: 0 8px 20px var(--theme-shadow);
  transform: translateX(3px);
}

.article-link {
  background: transparent;
  border: 0;
  color: var(--theme-text);
  cursor: pointer;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  text-align: left;
}

.article-link span,
.quick-article-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-actions {
  display: flex;
  gap: 8px;
}

.icon-button {
  align-items: center;
  background: var(--surface-soft);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  color: var(--theme-text);
  cursor: pointer;
  display: inline-flex;
  height: 36px;
  justify-content: center;
  transition: transform 0.25s ease, background 0.25s ease;
  width: 36px;
}

.icon-button:hover {
  background: color-mix(in srgb, var(--theme-accent) 24%, transparent);
  transform: translateY(-1px);
}

.icon-button.danger:hover {
  background: rgba(255, 110, 130, 0.26);
}

.quick-read-shell {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(190px, 240px) minmax(0, 1fr);
  height: min(72vh, 760px);
  min-height: 520px;
  width: 100%;
}

.quick-sidebar,
.quick-reader {
  min-height: 0;
  overflow: hidden;
}

.quick-sidebar {
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 12px;
}

.quick-sidebar-header {
  align-items: center;
  color: var(--theme-accent);
  display: flex;
  font-weight: 700;
  gap: 8px;
  margin-bottom: 10px;
  padding: 4px 6px;
}

.quick-group {
  border-top: 1px solid var(--border-soft);
  padding: 8px 0;
}

.group-toggle {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--theme-text);
  cursor: pointer;
  display: grid;
  gap: 8px;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  padding: 9px 6px;
  text-align: left;
  width: 100%;
}

.group-toggle span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-toggle small {
  color: var(--theme-accent);
}

.quick-article-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
  padding: 2px 0 4px 18px;
}

.quick-article-item {
  background: color-mix(in srgb, var(--surface-reading) 48%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  color: var(--theme-text);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 10px;
  text-align: left;
  transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease;
}

.quick-article-item:hover,
.quick-article-item.active {
  background: color-mix(in srgb, var(--theme-accent) 18%, var(--surface-soft));
  border-color: color-mix(in srgb, var(--theme-accent) 48%, var(--border-soft));
  transform: translateX(2px);
}

.quick-reader {
  overflow: auto;
  padding: clamp(20px, 2.8vw, 38px);
}

.reader-state {
  align-items: center;
  color: var(--readable-muted);
  display: flex;
  height: 100%;
  justify-content: center;
  text-align: center;
}

.reader-article header {
  border-bottom: 1px solid var(--border-soft);
  margin-bottom: 22px;
  padding-bottom: 18px;
}

.reader-article header h2 {
  font-size: clamp(26px, 2.7vw, 38px);
  line-height: 1.2;
  margin: 6px 0 10px;
}

.quick-article-content {
  color: var(--theme-text);
  font-size: 18px;
  line-height: 1.92;
  overflow-wrap: anywhere;
}

.quick-article-content :deep(h1),
.quick-article-content :deep(h2),
.quick-article-content :deep(h3) {
  line-height: 1.35;
  margin: 1.6em 0 0.7em;
}

.quick-article-content :deep(p) {
  margin: 0 0 1.1em;
}

.quick-article-content :deep(img) {
  border-radius: 8px;
  box-shadow: 0 12px 30px var(--theme-shadow);
  display: block;
  height: auto;
  margin: 24px auto;
  max-height: min(82vh, 860px);
  max-width: min(100%, 980px);
  object-fit: contain;
}

.quick-article-content :deep(video) {
  aspect-ratio: 16 / 9;
  background: rgba(0, 0, 0, 0.28);
  border-radius: 8px;
  box-shadow: 0 12px 30px var(--theme-shadow);
  display: block;
  height: auto;
  margin: 24px auto;
  max-height: 78vh;
  max-width: min(100%, 1040px);
  width: 100%;
}

.drawer-transition-enter-active,
.drawer-transition-leave-active {
  transition: max-height 0.32s ease, opacity 0.25s ease, transform 0.25s ease;
}

.drawer-transition-enter-from,
.drawer-transition-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-6px);
}

.drawer-transition-enter-to,
.drawer-transition-leave-from {
  max-height: 900px;
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 980px) {
  .quick-read-shell {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 0;
    width: 100%;
  }

  .quick-sidebar,
  .quick-reader {
    max-height: none;
  }
}

@media (max-width: 720px) {
  .list-header,
  .drawer-list li {
    align-items: stretch;
    flex-direction: column;
  }

  .quick-read-toggle {
    justify-content: center;
    width: 100%;
  }

  .article-actions {
    justify-content: flex-end;
  }
}
</style>
