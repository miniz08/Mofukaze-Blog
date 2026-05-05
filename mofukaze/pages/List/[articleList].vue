<template>
  <div class="list-page">
    <button class="quick-read-toggle" @click="toggleQuickReadMode">
      <Minimize2 v-if="isQuickReadMode" />
      <Maximize2 v-else />
      <span>{{ isQuickReadMode ? '退出快速阅读' : '快速阅读' }}</span>
    </button>

    <section v-if="isQuickReadMode" class="quick-read-shell">
      <aside class="quick-read-sidebar">
        <header class="quick-sidebar-header">
          <BookOpen />
          <div>
            <strong>{{ currentTag }}</strong>
            <span>{{ titles.length }} 篇文章</span>
          </div>
        </header>

        <div v-for="(articles, subtag) in groupedArticlesBySubtag" :key="subtag" class="quick-group">
          <button class="quick-group-header" @click="toggleQuickSubtag(subtag)">
            <span>{{ subtag }}</span>
            <small>{{ articles.length }}</small>
            <ChevronDown :class="{ open: isQuickSubtagOpen[subtag] }" />
          </button>

          <transition name="collapse-fade">
            <ul v-show="isQuickSubtagOpen[subtag]" class="quick-article-list">
              <li
                v-for="article in articles"
                :key="article.id"
                :class="{ active: article.id === currentArticleId }"
                @click="loadArticleContent(article.id)"
              >
                <strong>{{ article.title }}</strong>
                <span>{{ formatDate(article.time) }}</span>
              </li>
            </ul>
          </transition>
        </div>
      </aside>

      <main class="quick-read-display">
        <header class="quick-reader-header">
          <p>{{ selectedArticle?.subtag || '未选择主题' }}</p>
          <h1>{{ currentArticleTitle || '选择一篇文章开始阅读' }}</h1>
        </header>

        <div v-if="isArticleLoading" class="quick-state">
          正在展开文章...
        </div>
        <div v-else-if="currentArticleContent" class="quick-article-content" v-html="currentArticleContent"></div>
        <div v-else class="quick-state">
          从左侧选择一篇文章。
        </div>
      </main>
    </section>

    <section v-else class="normal-list">
      <div class="list-header">
        <h1>{{ currentTag }}</h1>
        <span>{{ titles.length }} 篇文章</span>
      </div>

      <div v-if="isLoading" class="list-state">
        正在加载文章...
      </div>

      <div v-else v-for="(articles, subtag) in groupedArticlesBySubtag" :key="subtag" class="subtag-section">
        <button class="subtag-header" @click="toggleSubtag(subtag)">
          <span>{{ subtag }}</span>
          <small>{{ articles.length }} 篇</small>
          <ChevronDown :class="{ open: isSubtagOpen[subtag] }" />
        </button>

        <transition name="collapse-fade">
          <ul v-show="isSubtagOpen[subtag]" class="drawer-list">
            <li v-for="article in articles" :key="article.id">
              <button class="article-link" @click="redirectToArticle(article.id)">
                <strong>{{ article.title }}</strong>
                <span>{{ formatDate(article.time) }}</span>
              </button>

              <div v-if="ifVisible" class="article-actions">
                <button class="edit-button" @click.stop="editArticle(article)">编辑</button>
                <button class="delete-button" @click.stop="confirmDeleteArticle(article.id)">删除</button>
              </div>
            </li>
          </ul>
        </transition>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BookOpen, ChevronDown, Maximize2, Minimize2 } from 'lucide-vue-next'

type ArticleItem = {
  id: number
  title: string
  time: string
  tag: string
  subtag: string
}

const router = useRouter()
const route = useRoute()
const admin = useAdmin()

const isQuickReadMode = ref(false)
const currentTag = ref(String(route.query.tag || '小说'))
const currentArticleId = ref<number | null>(null)
const currentArticleContent = ref('')
const currentArticleTitle = ref('')
const isArticleLoading = ref(false)
const titles = ref<ArticleItem[]>([])
const isSubtagOpen = ref<Record<string, boolean>>({})
const isQuickSubtagOpen = ref<Record<string, boolean>>({})

const ifVisible = computed(() => !!admin.getAuthHeader())

const groupedArticlesBySubtag = computed<Record<string, ArticleItem[]>>(() => {
  const grouped: Record<string, ArticleItem[]> = {}

  for (const article of titles.value) {
    const subtag = article.subtag || '未分类'
    if (!grouped[subtag]) grouped[subtag] = []
    grouped[subtag].push(article)
  }

  for (const subtag of Object.keys(grouped)) {
    grouped[subtag].sort((a, b) => new Intl.Collator('zh-CN').compare(a.title, b.title))
  }

  return grouped
})

const selectedArticle = computed(() =>
  titles.value.find((article) => article.id === currentArticleId.value) || null,
)

const firstArticle = computed(() => {
  const firstGroup = Object.values(groupedArticlesBySubtag.value)[0]
  return firstGroup?.[0] || null
})

const { data: articleData, pending: isLoading } = await useAsyncData(
  'articles-by-tag',
  () => $fetch<any[]>('/api/posts/article/getArticlesByTag', { query: { tag: currentTag.value } }),
  {
    server: true,
    default: () => [],
    watch: [currentTag],
  },
)

watch(
  articleData,
  (list) => {
    titles.value = (Array.isArray(list) ? list : []).map((item: any) => ({
      id: item.id,
      title: item.title,
      time: item.posttime,
      tag: item.tag,
      subtag: item.subTag || '未分类',
    }))
  },
  { immediate: true },
)

watch(
  groupedArticlesBySubtag,
  (groups) => {
    const keys = Object.keys(groups)

    keys.forEach((key, index) => {
      if (!(key in isSubtagOpen.value)) isSubtagOpen.value[key] = true
      if (!(key in isQuickSubtagOpen.value)) isQuickSubtagOpen.value[key] = index === 0
    })

    for (const key of Object.keys(isSubtagOpen.value)) {
      if (!keys.includes(key)) delete isSubtagOpen.value[key]
    }
    for (const key of Object.keys(isQuickSubtagOpen.value)) {
      if (!keys.includes(key)) delete isQuickSubtagOpen.value[key]
    }
  },
  { immediate: true },
)

watch(
  () => route.query.tag,
  (newTag) => {
    currentTag.value = String(newTag || '小说')
    currentArticleId.value = null
    currentArticleContent.value = ''
    currentArticleTitle.value = ''
  },
  { immediate: true },
)

watch(
  [isQuickReadMode, firstArticle],
  ([quickMode, article]) => {
    if (quickMode && article && !currentArticleId.value) {
      loadArticleContent(article.id)
    }
  },
)

const formatDate = (value: string | Date) => {
  if (!value) return '未知时间'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

const toggleQuickReadMode = () => {
  isQuickReadMode.value = !isQuickReadMode.value
  if (isQuickReadMode.value && firstArticle.value && !currentArticleId.value) {
    loadArticleContent(firstArticle.value.id)
  }
}

const toggleSubtag = (subtag: string) => {
  isSubtagOpen.value[subtag] = !isSubtagOpen.value[subtag]
}

const toggleQuickSubtag = (subtag: string) => {
  isQuickSubtagOpen.value[subtag] = !isQuickSubtagOpen.value[subtag]
}

const loadArticleContent = async (id: number) => {
  if (currentArticleId.value === id && currentArticleContent.value) return

  currentArticleId.value = id
  isArticleLoading.value = true

  try {
    const response: any = await $fetch('/api/posts/article/findArticleByID', {
      method: 'GET',
      query: { id },
    })
    const article = Array.isArray(response) ? response[0] : null

    currentArticleTitle.value = article?.title || '文章加载失败'
    currentArticleContent.value = article?.content || '<p>文章加载失败</p>'
  } finally {
    isArticleLoading.value = false
  }
}

const redirectToArticle = (id: number) => {
  router.push(`/article/${id}`)
}

const editArticle = (article: ArticleItem) => {
  router.push({ path: `/edit/${article.id}`, query: { id: article.id } })
}

const confirmDeleteArticle = (id: number) => {
  if (confirm('你确定要删除这篇文章吗？这将不可撤销。')) {
    deleteArticle(id)
  }
}

const deleteArticle = async (id: number) => {
  const response: any = await $fetch('/api/posts/article/deleteArticle', {
    method: 'DELETE',
    body: { id },
    headers: admin.getAuthHeader(),
  })

  if (response?.status === 'success') {
    titles.value = titles.value.filter((article) => article.id !== id)
    if (currentArticleId.value === id) {
      currentArticleId.value = null
      currentArticleContent.value = ''
      currentArticleTitle.value = ''
    }
  } else {
    alert(response?.message || '删除失败')
  }
}
</script>

<style scoped>
.list-page {
  color: rgba(18, 24, 38, 0.92);
  min-height: 64vh;
}

.quick-read-toggle {
  align-items: center;
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(80, 140, 220, 0.18);
  color: rgba(16, 24, 40, 0.9);
  cursor: pointer;
  display: flex;
  font-family: inherit;
  gap: 8px;
  padding: 10px 16px;
  position: fixed;
  right: max(18px, 4vw);
  top: 172px;
  transition: background 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
  z-index: 3200;
  backdrop-filter: blur(14px) saturate(160%);
}

.quick-read-toggle svg {
  height: 18px;
  width: 18px;
}

.quick-read-toggle:hover {
  background: rgba(255, 255, 255, 0.32);
  box-shadow: 0 12px 28px rgba(80, 140, 220, 0.26);
  transform: translateY(-2px);
}

.quick-read-shell {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
  height: calc(100vh - 220px);
  margin-left: 50%;
  min-height: 560px;
  transform: translateX(-50%);
  width: min(94vw, 1560px);
}

.quick-read-sidebar,
.quick-read-display,
.subtag-section,
.list-state {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.26);
  border-radius: 8px;
  box-shadow: 0 12px 32px rgba(80, 140, 220, 0.16);
  backdrop-filter: blur(18px) saturate(170%);
}

.quick-read-sidebar {
  min-width: 0;
  overflow: hidden auto;
  padding: 14px;
}

.quick-sidebar-header {
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.24);
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
  padding: 4px 2px 14px;
}

.quick-sidebar-header svg {
  color: rgba(76, 132, 214, 0.9);
  height: 24px;
  width: 24px;
}

.quick-sidebar-header div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quick-sidebar-header span,
.quick-group-header small,
.quick-article-list span,
.list-header span,
.subtag-header small,
.article-link span {
  color: rgba(18, 24, 38, 0.56);
  font-size: 12px;
}

.quick-group {
  margin-bottom: 10px;
}

.quick-group-header,
.subtag-header {
  align-items: center;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 8px;
  color: inherit;
  cursor: pointer;
  display: grid;
  font-family: inherit;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr) auto auto;
  padding: 11px 12px;
  width: 100%;
}

.quick-group-header svg,
.subtag-header svg {
  height: 16px;
  transition: transform 0.25s ease;
  width: 16px;
}

.quick-group-header svg.open,
.subtag-header svg.open {
  transform: rotate(180deg);
}

.quick-article-list,
.drawer-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
}

.quick-article-list li {
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 6px;
  padding: 10px;
  transition: background 0.25s ease, transform 0.25s ease;
}

.quick-article-list li:hover,
.quick-article-list li.active {
  background: rgba(96, 152, 236, 0.16);
  transform: translateX(3px);
}

.quick-read-display {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.quick-reader-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.26);
  padding: 20px 24px 18px;
}

.quick-reader-header p {
  color: rgba(64, 116, 190, 0.82);
  margin: 0 0 6px;
}

.quick-reader-header h1 {
  font-size: clamp(25px, 3vw, 40px);
  line-height: 1.2;
  margin: 0;
}

.quick-article-content,
.quick-state {
  flex: 1;
  overflow-y: auto;
  padding: 24px 34px 42px;
}

.quick-state {
  align-items: center;
  color: rgba(18, 24, 38, 0.58);
  display: flex;
  justify-content: center;
}

.quick-article-content {
  font-size: 17px;
  line-height: 1.82;
}

.quick-article-content :deep(h1),
.quick-article-content :deep(h2),
.quick-article-content :deep(h3) {
  margin-top: 1.35em;
}

.quick-article-content :deep(pre) {
  background: rgba(16, 24, 40, 0.78);
  border-radius: 8px;
  color: rgba(244, 248, 255, 0.95);
  overflow-x: auto;
  padding: 16px;
}

.normal-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.list-header {
  align-items: end;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.list-header h1 {
  font-size: 34px;
  margin: 0;
}

.list-state {
  padding: 28px;
  text-align: center;
}

.subtag-section {
  overflow: hidden;
}

.subtag-header {
  border: 0;
  border-radius: 0;
  font-size: 18px;
}

.drawer-list {
  padding: 12px;
}

.drawer-list li {
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 10px;
  transition: background 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}

.drawer-list li:hover {
  background: rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 22px rgba(82, 142, 220, 0.16);
  transform: translateX(4px);
}

.article-link {
  align-items: flex-start;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: flex;
  flex: 1;
  flex-direction: column;
  font-family: inherit;
  gap: 5px;
  min-width: 0;
  padding: 0;
  text-align: left;
}

.article-link strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.article-actions {
  display: flex;
  gap: 8px;
}

.edit-button,
.delete-button {
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  padding: 7px 12px;
  transition: background 0.25s ease, transform 0.25s ease;
}

.edit-button {
  background: rgba(92, 148, 232, 0.24);
}

.delete-button {
  background: rgba(220, 100, 120, 0.22);
}

.edit-button:hover,
.delete-button:hover {
  transform: translateY(-1px);
}

.collapse-fade-enter-active,
.collapse-fade-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.collapse-fade-enter-from,
.collapse-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 980px) {
  .quick-read-shell {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 0;
  }

  .quick-read-sidebar {
    max-height: 36vh;
  }

  .quick-read-display {
    min-height: 62vh;
  }
}

@media (max-width: 680px) {
  .quick-read-toggle {
    right: 12px;
    top: 148px;
  }

  .quick-read-shell {
    width: min(96vw, 1560px);
  }

  .quick-article-content,
  .quick-state {
    padding: 18px;
  }

  .drawer-list li,
  .list-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
