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
            v-html="article.content"
          ></div>
        </article>

        <section class="comment-section">
          <div class="section-title">
            <MessageSquare />
            <h2>评论</h2>
          </div>

          <form class="comment-form" @submit.prevent="submitComment">
            <div class="form-grid">
              <input v-model.trim="commentForm.name" type="text" placeholder="昵称" maxlength="40" autocomplete="name" />
              <input v-model.trim="commentForm.email" type="email" placeholder="邮箱（可选，不公开）" maxlength="120" autocomplete="email" />
              <input v-model.trim="commentForm.homepage" type="url" placeholder="个人主页（可选）" maxlength="191" autocomplete="url" />
            </div>

            <textarea
              v-model.trim="commentForm.content"
              placeholder="留下些什么吧"
              maxlength="1200"
              rows="4"
            ></textarea>

            <div class="comment-actions">
              <span>资料会在本机保存 30 天 · {{ commentForm.content.length }}/1200</span>
              <button type="submit" :disabled="isSubmittingComment">
                <Send />
                {{ isSubmittingComment ? '提交中...' : '发布评论' }}
              </button>
            </div>
          </form>

          <div class="comment-list">
            <article
              v-for="comment in flatComments"
              :key="comment.id"
              class="comment-item"
              :style="commentIndent(comment.depth)"
            >
              <div class="comment-meta">
                <span class="comment-avatar">{{ commentInitial(comment.name) }}</span>
                <div class="comment-author">
                  <a
                    v-if="normalizeHomepage(comment.homepage)"
                    :href="normalizeHomepage(comment.homepage)"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ comment.name }}
                    <ExternalLink />
                  </a>
                  <strong v-else>{{ comment.name }}</strong>
                </div>
                <span class="comment-date">{{ formatDate(comment.posttime) }}</span>
              </div>

              <p>{{ comment.content }}</p>

              <div class="comment-tools">
                <button type="button" @click="startReply(comment)">
                  <Reply />
                  回复
                </button>
              </div>

              <form
                v-if="activeReplyId === comment.id"
                class="reply-form"
                @submit.prevent="submitReply(comment)"
              >
                <textarea
                  v-model.trim="replyContent"
                  :placeholder="`回复 ${comment.name}`"
                  maxlength="1200"
                  rows="3"
                ></textarea>
                <div class="comment-actions">
                  <span>{{ replyContent.length }}/1200</span>
                  <div class="reply-actions">
                    <button type="button" class="ghost-button" @click="cancelReply">
                      <X />
                      取消
                    </button>
                    <button type="submit" :disabled="isSubmittingReply">
                      <Send />
                      {{ isSubmittingReply ? '提交中...' : '发布回复' }}
                    </button>
                  </div>
                </div>
              </form>
            </article>

            <p v-if="comments.length === 0" class="empty-text">
              这里暂时还没有评论。
            </p>
          </div>
        </section>
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
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BookOpen,
  CalendarDays,
  ExternalLink,
  Eye,
  ListTree,
  MessageSquare,
  Pencil,
  Reply,
  Send,
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

type CommentItem = {
  id: number
  name: string
  homepage?: string | null
  content: string
  posttime: string
  articleId?: number | null
  collectionId?: number | null
  parentId?: number | null
  replies?: CommentItem[]
}

type FlatCommentItem = CommentItem & {
  depth: number
}

const COMMENT_PROFILE_KEY = 'mofukaze.comment-profile'
const COMMENT_PROFILE_TTL = 30 * 24 * 60 * 60 * 1000

const route = useRoute()
const router = useRouter()
const admin = useAdmin()
const { toc, activeHeadingId, buildToc, scrollToHeading } = useArticleToc()

const article = ref<Article | null>(null)
const comments = ref<CommentItem[]>([])
const articleContentRef = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const isSubmittingComment = ref(false)
const isSubmittingReply = ref(false)
const errorMessage = ref('')
const activeReplyId = ref<number | null>(null)
const replyContent = ref('')
const selectedMedia = ref<{ type: 'image' | 'video'; src: string } | null>(null)

const commentForm = ref({
  name: '',
  email: '',
  homepage: '',
  content: '',
})

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
  const text = stripHtml(article.value?.content || '')
  return Math.max(1, Math.ceil(text.length / 500))
})

const flatComments = computed<FlatCommentItem[]>(() => {
  const flatten = (items: CommentItem[], depth = 0): FlatCommentItem[] => {
    return items.flatMap((comment) => [
      { ...comment, depth },
      ...flatten(comment.replies || [], Math.min(depth + 1, 6)),
    ])
  }

  return flatten(comments.value)
})

const stripHtml = (value: string) => String(value || '').replace(/<[^>]*>/g, '').trim()

const formatDate = (value: string | Date) => {
  if (!value) return '未知时间'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const normalizeHomepage = (value?: string | null) => {
  const rawValue = String(value || '').trim()
  if (!rawValue) return ''

  try {
    const url = new URL(/^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`)
    return /^https?:$/i.test(url.protocol) ? url.toString() : ''
  } catch {
    return ''
  }
}

const commentIndent = (depth: number) => ({
  '--comment-depth': String(Math.min(depth, 5)),
})

const commentInitial = (name: string) => {
  return String(name || '?').trim().slice(0, 1).toUpperCase() || '?'
}

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

const loadStoredCommentProfile = () => {
  if (!process.client) return

  const rawProfile = window.localStorage.getItem(COMMENT_PROFILE_KEY)
  if (!rawProfile) return

  try {
    const profile = JSON.parse(rawProfile)
    if (!profile?.expiresAt || Number(profile.expiresAt) < Date.now()) {
      window.localStorage.removeItem(COMMENT_PROFILE_KEY)
      return
    }

    commentForm.value.name = String(profile.name || '')
    commentForm.value.email = String(profile.email || '')
    commentForm.value.homepage = String(profile.homepage || '')
  } catch {
    window.localStorage.removeItem(COMMENT_PROFILE_KEY)
  }
}

const persistCommentProfile = () => {
  if (!process.client) return

  window.localStorage.setItem(
    COMMENT_PROFILE_KEY,
    JSON.stringify({
      name: commentForm.value.name,
      email: commentForm.value.email,
      homepage: commentForm.value.homepage,
      expiresAt: Date.now() + COMMENT_PROFILE_TTL,
    }),
  )
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
    await loadComments()
  } catch (err: any) {
    console.error('[article] 加载失败', err)
    article.value = null
    errorMessage.value = err?.message || '文章加载失败'
  } finally {
    isLoading.value = false
  }
}

const loadComments = async () => {
  try {
    const res: any = await $fetch('/api/posts/comment/loadComments', {
      method: 'GET',
      query: { articleId: articleId.value },
    })

    comments.value = Array.isArray(res?.comments) ? res.comments : []
  } catch (err) {
    console.warn('[article] 评论加载失败', err)
    comments.value = []
  }
}

const getCommentBasePayload = () => {
  return {
    articleId: articleId.value,
    name: commentForm.value.name,
    email: commentForm.value.email || null,
    homepage: commentForm.value.homepage || null,
  }
}

const validateCommentProfile = (content: string) => {
  if (!commentForm.value.name || !content) {
    alert('昵称和评论内容不能为空')
    return false
  }

  return true
}

const submitComment = async () => {
  if (!validateCommentProfile(commentForm.value.content)) return

  isSubmittingComment.value = true
  try {
    const res: any = await $fetch('/api/posts/comment/submitComment', {
      method: 'POST',
      body: {
        ...getCommentBasePayload(),
        content: commentForm.value.content,
      },
    })

    if (res?.status !== 'success') {
      throw new Error(res?.message || '评论提交失败')
    }

    persistCommentProfile()
    commentForm.value.content = ''
    await loadComments()
  } catch (err: any) {
    alert(err?.message || '评论提交失败')
  } finally {
    isSubmittingComment.value = false
  }
}

const startReply = (comment: CommentItem) => {
  activeReplyId.value = comment.id
  replyContent.value = ''
}

const cancelReply = () => {
  activeReplyId.value = null
  replyContent.value = ''
}

const submitReply = async (comment: CommentItem) => {
  if (!validateCommentProfile(replyContent.value)) return

  isSubmittingReply.value = true
  try {
    const res: any = await $fetch('/api/posts/comment/submitComment', {
      method: 'POST',
      body: {
        ...getCommentBasePayload(),
        parentId: comment.id,
        content: replyContent.value,
      },
    })

    if (res?.status !== 'success') {
      throw new Error(res?.message || '回复提交失败')
    }

    persistCommentProfile()
    cancelReply()
    await loadComments()
  } catch (err: any) {
    alert(err?.message || '回复提交失败')
  } finally {
    isSubmittingReply.value = false
  }
}

const editArticle = () => {
  if (!article.value) return
  router.push({ path: `/edit/${article.value.id}`, query: { id: article.value.id } })
}

onMounted(() => {
  loadStoredCommentProfile()
})

watch(
  () => route.params.id,
  () => {
    activeReplyId.value = null
    replyContent.value = ''
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
  gap: 22px;
  grid-template-columns: minmax(0, 980px) 220px;
  justify-content: center;
  margin: 0 auto;
  max-width: 1240px;
}

.article-layout.without-toc {
  grid-template-columns: minmax(0, 1060px);
  max-width: 1100px;
}

.article-main {
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-width: 0;
  width: 100%;
}

.article-card,
.comment-section,
.toc-panel {
  background: var(--surface-card);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  box-shadow: 0 14px 36px color-mix(in srgb, var(--theme-shadow) 62%, rgba(0, 0, 0, 0.18));
}

.article-card {
  background: var(--surface-reading);
  overflow: hidden;
  padding: clamp(22px, 3vw, 34px);
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
  margin-bottom: 28px;
}

.article-kicker {
  color: var(--theme-accent);
  font-size: 13px;
  letter-spacing: 0;
  margin: 0 0 8px;
}

.article-header h1 {
  font-size: clamp(28px, 3.4vw, 42px);
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
.comment-author svg,
.comment-tools svg,
.edit-button svg,
.section-title svg,
.toc-title svg {
  height: 17px;
  width: 17px;
}

.edit-button,
.comment-actions button,
.comment-tools button {
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

.comment-tools button {
  background: transparent;
  color: var(--readable-muted);
  padding: 7px 10px;
}

.ghost-button {
  background: transparent !important;
}

.edit-button:hover,
.comment-actions button:hover:not(:disabled),
.comment-tools button:hover {
  box-shadow: 0 8px 24px var(--theme-shadow);
  transform: translateY(-2px);
}

.comment-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.article-content {
  color: var(--theme-text);
  font-size: 18px;
  line-height: 1.92;
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

.toc-title,
.section-title {
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

.comment-section {
  padding: 22px;
}

.section-title {
  margin-bottom: 16px;
}

.section-title svg {
  color: var(--theme-accent);
}

.section-title h2 {
  font-size: 22px;
  margin: 0;
}

.comment-form,
.reply-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-form {
  margin-bottom: 18px;
}

.reply-form {
  margin-top: 12px;
}

.form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.comment-form input,
.comment-form textarea,
.reply-form textarea {
  background: color-mix(in srgb, var(--surface-reading) 72%, var(--surface-soft));
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  color: var(--theme-text);
  font: inherit;
  padding: 11px 12px;
  resize: vertical;
}

.comment-form input::placeholder,
.comment-form textarea::placeholder,
.reply-form textarea::placeholder {
  color: var(--readable-faint);
}

.comment-actions {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.reply-actions {
  display: flex;
  gap: 10px;
}

.comment-actions span,
.empty-text,
.comment-meta span {
  color: var(--readable-muted);
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-item {
  background: color-mix(in srgb, var(--surface-reading) 70%, var(--surface-soft));
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  margin-left: calc(var(--comment-depth, 0) * 24px);
  padding: 14px;
  position: relative;
}

.comment-item::before {
  background: color-mix(in srgb, var(--theme-accent) 42%, transparent);
  border-radius: 99px;
  content: "";
  height: calc(100% - 18px);
  left: -13px;
  opacity: calc(var(--comment-depth, 0) * 0.22);
  position: absolute;
  top: 9px;
  width: 2px;
}

.comment-meta {
  align-items: center;
  display: grid;
  gap: 12px;
  grid-template-columns: 34px minmax(0, 1fr) auto;
}

.comment-avatar {
  align-items: center;
  background: color-mix(in srgb, var(--theme-accent) 28%, var(--surface-soft));
  border: 1px solid var(--border-soft);
  border-radius: 50%;
  color: var(--theme-text);
  display: inline-flex;
  font-size: 14px;
  height: 34px;
  justify-content: center;
  width: 34px;
}

.comment-author a {
  align-items: center;
  color: var(--theme-text);
  display: inline-flex;
  gap: 6px;
  text-decoration: none;
}

.comment-author a:hover {
  color: var(--theme-accent);
}

.comment-date {
  font-size: 12px;
  white-space: nowrap;
}

.comment-item p {
  line-height: 1.7;
  margin: 8px 0 0;
  white-space: pre-wrap;
}

.comment-tools {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.empty-text {
  margin: 0;
  padding: 10px 0;
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
  .article-header,
  .comment-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .comment-meta {
    grid-template-columns: 34px minmax(0, 1fr);
  }

  .comment-date {
    grid-column: 2;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .reply-actions {
    flex-direction: column;
  }

  .comment-item {
    margin-left: calc(var(--comment-depth, 0) * 12px);
  }
}
</style>
