<template>
  <section class="article-page">
    <div v-if="isLoading" class="article-state">
      正在翻开这一页...
    </div>

    <div v-else-if="errorMessage" class="article-state error-state">
      {{ errorMessage }}
    </div>

    <div v-else-if="article" class="article-layout" :class="{ 'without-toc': toc.length === 0 }">
      <main class="article-main">
        <article class="article-card">
          <header class="article-header">
            <div>
              <p class="article-kicker">{{ article.tag }} / {{ article.subTag || '未分组' }}</p>
              <h1>{{ article.title }}</h1>
              <div class="article-meta">
                <span><CalendarDays />{{ formattedPosttime }}</span>
                <span><BookOpen />{{ readingMinutes }} 分钟阅读</span>
                <span><Eye />访问已记录</span>
              </div>
            </div>

            <button v-if="ifVisible" class="edit-button" @click="editArticle">
              <Pencil />
              编辑
            </button>
          </header>

          <div
            ref="articleContentRef"
            class="article-content"
            @click="handleArticleContentClick"
            @dblclick="handleArticleContentDoubleClick"
            v-html="decoratedArticleContent"
          ></div>
        </article>

        <CommentSection :target-id="articleId" target-type="article" />
      </main>

      <aside v-if="toc.length" class="article-toc" aria-label="文章目录">
        <div class="toc-panel">
          <div class="toc-title">
            <ListTree />
            <span>目录</span>
          </div>
          <button
            v-for="item in toc"
            :key="item.id"
            class="toc-link"
            :class="[`level-${item.level}`, { active: activeHeadingId === item.id }]"
            type="button"
            @click="scrollToHeading(item.id)"
          >
            {{ item.text }}
          </button>
        </div>
      </aside>
    </div>

    <teleport to="body">
      <div
        v-if="selectedMedia"
        class="media-viewer"
        role="dialog"
        aria-modal="true"
        @click="closeMediaViewer"
      >
        <button type="button" class="media-close" aria-label="关闭预览" @click="closeMediaViewer">
          <X />
        </button>
        <img
          v-if="selectedMedia.type === 'image'"
          :src="selectedMedia.src"
          alt="文章图片预览"
          @click.stop
        />
        <video
          v-else
          :src="selectedMedia.src"
          controls
          autoplay
          @click.stop
        ></video>
      </div>
    </teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { decorateCodeBlocks, stripRichHtml } from '~/utils/richContent'
import {
  BookOpen,
  CalendarDays,
  Eye,
  ListTree,
  Pencil,
  X,
} from 'lucide-vue-next'

type Article = {
  id: number
  title: string
  content: string
  tag: string
  subTag?: string
  posttime: string
}

const route = useRoute()
const router = useRouter()
const admin = useAdmin()
const { toc, activeHeadingId, buildToc, scrollToHeading } = useArticleToc()

const article = ref<Article | null>(null)
const articleContentRef = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const selectedMedia = ref<{ type: 'image' | 'video'; src: string } | null>(null)

const articleId = computed(() => Number(route.params.id))
const ifVisible = computed(() => admin.isAdmin.value)

const formattedPosttime = computed(() => {
  if (!article.value?.posttime) return '未知时间'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(article.value.posttime))
})

const readingMinutes = computed(() => {
  const text = stripRichHtml(article.value?.content || '')
  return Math.max(1, Math.ceil(text.length / 500))
})

const decoratedArticleContent = computed(() => decorateCodeBlocks(article.value?.content || ''))

const openMediaViewer = (type: 'image' | 'video', src: string) => {
  if (!src) return
  selectedMedia.value = { type, src }
}

const closeMediaViewer = () => {
  selectedMedia.value = null
}

const handleArticleContentClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (target?.tagName === 'IMG') {
    openMediaViewer('image', (target as HTMLImageElement).currentSrc || (target as HTMLImageElement).src)
  }
}

const handleArticleContentDoubleClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (target?.tagName === 'VIDEO') {
    openMediaViewer('video', (target as HTMLVideoElement).currentSrc || (target as HTMLVideoElement).src)
  }
}

const normalizeArticle = (payload: unknown): Article | null => {
  if (Array.isArray(payload)) return payload[0] || null
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const data = (payload as { data?: Article[] | Article }).data
    return Array.isArray(data) ? data[0] || null : data || null
  }
  return null
}

const loadArticle = async () => {
  if (!articleId.value || Number.isNaN(articleId.value)) {
    errorMessage.value = '文章编号无效'
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await $fetch('/api/posts/article/findArticleByID', {
      method: 'GET',
      query: { id: articleId.value },
    })
    const nextArticle = normalizeArticle(res)

    if (!nextArticle) {
      throw new Error('没有找到这篇文章')
    }

    article.value = nextArticle

    await nextTick()
    await buildToc(articleContentRef.value)
  } catch (err: any) {
    console.error('[article] 加载失败', err)
    article.value = null
    errorMessage.value = err?.message || '文章加载失败'
  } finally {
    isLoading.value = false
  }
}

const editArticle = () => {
  if (!article.value) return
  router.push({ path: `/edit/${article.value.id}`, query: { id: article.value.id } })
}

watch(
  () => route.params.id,
  () => {
    loadArticle()
  },
  { immediate: true },
)

useSeoMeta({
  title: computed(() => article.value ? `${article.value.title} - Mofukaze` : '文章 - Mofukaze'),
})
</script>

<style scoped>
.article-page {
  color: var(--theme-text);
  min-height: 62vh;
}

:global(.paper:has(.article-page)) {
  width: min(92%, 1320px);
}

.article-state {
  background: var(--surface-reading);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  box-shadow: 0 12px 30px var(--theme-shadow);
  padding: 34px;
  text-align: center;
}

.error-state {
  color: #ff9aa8;
}

.article-layout {
  align-items: start;
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1020px) 210px;
  justify-content: center;
  margin: 0 auto;
  max-width: 1280px;
}

.article-layout.without-toc {
  grid-template-columns: minmax(0, 1060px);
  max-width: 1100px;
}

.article-main {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
  width: 100%;
}

.article-card,
.toc-panel {
  background: var(--surface-card);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  box-shadow: 0 14px 36px color-mix(in srgb, var(--theme-shadow) 62%, rgba(0, 0, 0, 0.18));
}

.article-card {
  background: var(--surface-reading);
  overflow: hidden;
  padding: clamp(18px, 2.4vw, 28px);
  position: relative;
}

.article-card::before {
  background: linear-gradient(90deg, var(--theme-accent), transparent 70%);
  content: "";
  height: 2px;
  left: 0;
  opacity: 0.55;
  position: absolute;
  right: 0;
  top: 0;
}

.article-header {
  align-items: flex-start;
  display: flex;
  gap: 18px;
  justify-content: space-between;
  margin-bottom: 22px;
}

.article-kicker {
  color: var(--theme-accent);
  font-size: 13px;
  letter-spacing: 0;
  margin: 0 0 8px;
}

.article-header h1 {
  font-size: clamp(26px, 3vw, 38px);
  line-height: 1.18;
  margin: 0;
}

.article-meta {
  color: var(--readable-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
}

.article-meta span {
  align-items: center;
  display: inline-flex;
  font-size: 13px;
  gap: 6px;
}

.article-meta svg,
.edit-button svg,
.toc-title svg {
  height: 17px;
  width: 17px;
}

.edit-button {
  align-items: center;
  background: color-mix(in srgb, var(--theme-accent) 24%, var(--surface-soft));
  border: 1px solid color-mix(in srgb, var(--theme-accent) 24%, var(--border-soft));
  border-radius: 8px;
  color: var(--theme-text);
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  gap: 8px;
  padding: 10px 14px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

.edit-button:hover {
  box-shadow: 0 8px 24px var(--theme-shadow);
  transform: translateY(-2px);
}

.article-content {
  color: var(--theme-text);
  font-size: 16px;
  line-height: 1.86;
  overflow-wrap: anywhere;
}

.article-content :deep(.article-heading-anchor) {
  scroll-margin-top: 140px;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3) {
  line-height: 1.35;
  margin: 1.7em 0 0.7em;
}

.article-content :deep(h2) {
  border-bottom: 1px solid var(--border-soft);
  padding-bottom: 8px;
}

.article-content :deep(p) {
  margin: 0 0 1.1em;
}

.article-content :deep(a) {
  color: var(--theme-accent);
}

.article-content :deep(img) {
  border-radius: 8px;
  box-shadow: 0 12px 30px var(--theme-shadow);
  display: block;
  height: auto;
  margin: 24px auto;
  max-height: min(82vh, 860px);
  max-width: min(100%, 980px);
  object-fit: contain;
  cursor: zoom-in;
}

.article-content :deep(video) {
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

.article-content :deep(p:has(> img:only-child)),
.article-content :deep(p:has(> video:only-child)) {
  margin: 1.35em 0;
}

.article-content :deep(blockquote) {
  border-left: 3px solid var(--theme-accent);
  color: var(--readable-muted);
  margin: 18px 0;
  padding: 8px 0 8px 18px;
}

.article-content :deep(pre) {
  background: color-mix(in srgb, #000 24%, var(--surface-card));
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  overflow: auto;
  padding: 16px;
}

.article-toc {
  position: sticky;
  top: 178px;
}

.toc-panel {
  max-height: calc(100vh - 210px);
  overflow: auto;
  padding: 14px;
}

.toc-title {
  align-items: center;
  display: flex;
  gap: 9px;
}

.toc-title {
  color: var(--theme-accent);
  font-weight: 700;
  margin-bottom: 10px;
}

.toc-link {
  background: transparent;
  border: 0;
  border-left: 2px solid var(--border-soft);
  color: var(--readable-muted);
  cursor: pointer;
  display: block;
  font: inherit;
  line-height: 1.45;
  padding: 8px 8px 8px 12px;
  text-align: left;
  width: 100%;
}

.toc-link.level-2 {
  padding-left: 22px;
}

.toc-link.level-3 {
  padding-left: 34px;
}

.toc-link:hover,
.toc-link.active {
  border-left-color: var(--theme-accent);
  color: var(--theme-text);
}

.media-viewer {
  align-items: center;
  background: rgba(5, 8, 16, 0.82);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: clamp(18px, 4vw, 48px);
  position: fixed;
  z-index: 10000;
  backdrop-filter: blur(18px);
}

.media-viewer img,
.media-viewer video {
  border-radius: 8px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
  max-height: 92vh;
  max-width: 94vw;
  object-fit: contain;
}

.media-viewer video {
  width: min(94vw, 1180px);
}

.media-close {
  align-items: center;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  height: 40px;
  justify-content: center;
  position: fixed;
  right: 22px;
  top: 22px;
  width: 40px;
}

.media-close svg {
  height: 18px;
  width: 18px;
}

@media (max-width: 1080px) {
  .article-layout {
    grid-template-columns: 1fr;
    max-width: 900px;
  }

  .article-toc {
    order: -1;
    position: static;
  }

  .toc-panel {
    max-height: none;
  }
}

@media (max-width: 720px) {
  .article-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
