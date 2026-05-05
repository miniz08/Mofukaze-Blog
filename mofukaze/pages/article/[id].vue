<template>
  <article class="article-page">
    <loading v-if="isLoading" />

    <div v-else-if="errorMessage" class="article-state">
      {{ errorMessage }}
    </div>

    <template v-else>
      <header class="article-hero">
        <p>Article</p>
        <h1>{{ title }}</h1>
        <span>{{ toc.length }} 个目录节点</span>
      </header>

      <div class="article-layout" :class="{ 'without-toc': toc.length === 0 }">
        <main class="article-main">
          <div ref="articleContentRef" class="article-content" v-html="content"></div>

          <section class="comment-panel">
            <div class="comment-title">
              <h2>评论</h2>
              <span>{{ comments.length }} 条</span>
            </div>

            <div class="comment-form">
              <input v-model="commentName" placeholder="名字" />
              <input v-model="commentEmail" type="email" placeholder="邮箱（可选）" />
              <textarea v-model="commentContent" rows="4" placeholder="写点什么吧"></textarea>
              <button :disabled="!canSubmitComment || isSubmittingComment" @click="submitComment">
                {{ isSubmittingComment ? '提交中...' : '提交评论' }}
              </button>
            </div>

            <div class="comment-list">
              <article v-for="comment in comments" :key="comment.id" class="comment-item">
                <div class="comment-meta">
                  <strong>{{ comment.name }}</strong>
                  <small>{{ formatDate(comment.posttime) }}</small>
                </div>
                <p>{{ stripHtml(comment.content) }}</p>
              </article>
              <p v-if="comments.length === 0" class="empty-comment">
                还没有评论。
              </p>
            </div>
          </section>
        </main>

        <aside v-if="toc.length" class="article-toc">
          <div class="toc-card">
            <strong>目录</strong>
            <button
              v-for="item in toc"
              :key="item.id"
              class="toc-item"
              :class="[`level-${item.level}`, { active: activeHeadingId === item.id }]"
              @click="scrollToHeading(item.id)"
            >
              {{ item.text }}
            </button>
          </div>
        </aside>
      </div>
    </template>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

type CommentItem = {
  id: number
  name: string
  content: string
  posttime: string
}

const route = useRoute()
const { toc, activeHeadingId, buildToc, scrollToHeading } = useArticleToc()

const articleContentRef = ref<HTMLElement | null>(null)
const content = ref('')
const title = ref('')
const comments = ref<CommentItem[]>([])
const commentName = ref('')
const commentEmail = ref('')
const commentContent = ref('')
const isLoading = ref(true)
const isSubmittingComment = ref(false)
const errorMessage = ref('')

const articleId = computed(() => Number(route.params.id))
const canSubmitComment = computed(() => commentName.value.trim() && commentContent.value.trim())

const stripHtml = (value: string) => String(value || '').replace(/<[^>]*>/g, '').trim()

const formatDate = (value: string | Date) => {
  if (!value) return '未知时间'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const loadComments = async () => {
  if (!articleId.value) return

  try {
    const res: any = await $fetch('/api/posts/comment/loadComments', {
      query: { articleId: articleId.value },
    })

    comments.value = Array.isArray(res?.comments) ? res.comments : []
  } catch (err) {
    console.warn('[article] 评论加载失败', err)
    comments.value = []
  }
}

const loadArticle = async () => {
  if (!articleId.value || Number.isNaN(articleId.value)) {
    errorMessage.value = '文章地址不正确'
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response: any = await $fetch('/api/posts/article/findArticleByID', {
      method: 'GET',
      query: { id: articleId.value },
    })
    const article = Array.isArray(response) ? response[0] : null

    if (!article) {
      throw new Error('文章不存在或暂不可见')
    }

    title.value = article.title
    content.value = article.content || ''
    isLoading.value = false

    await buildToc(articleContentRef.value)
    await loadComments()
  } catch (err: any) {
    errorMessage.value = err?.message || '文章加载失败'
    content.value = ''
    title.value = ''
    comments.value = []
  } finally {
    isLoading.value = false
  }
}

const submitComment = async () => {
  if (!canSubmitComment.value || isSubmittingComment.value) return

  isSubmittingComment.value = true

  try {
    const res: any = await $fetch('/api/posts/comment/submitComment', {
      method: 'POST',
      body: {
        articleId: articleId.value,
        name: commentName.value.trim(),
        email: commentEmail.value.trim() || null,
        content: commentContent.value.trim(),
      },
    })

    if (res?.status !== 'success') {
      throw new Error(res?.message || '评论提交失败')
    }

    comments.value.unshift(res.comment)
    commentContent.value = ''
  } catch (err: any) {
    alert(err?.message || '评论提交失败，请稍后再试')
  } finally {
    isSubmittingComment.value = false
  }
}

watch(
  () => route.params.id,
  () => {
    loadArticle()
  },
  { immediate: true },
)
</script>

<style scoped>
.article-page {
  color: rgba(18, 24, 38, 0.92);
}

.article-state {
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 8px;
  padding: 30px;
  text-align: center;
}

.article-hero {
  border-bottom: 1px solid rgba(255, 255, 255, 0.28);
  margin-bottom: 24px;
  padding-bottom: 18px;
}

.article-hero p {
  color: rgba(52, 112, 190, 0.82);
  font-size: 13px;
  margin: 0 0 8px;
}

.article-hero h1 {
  font-size: clamp(28px, 4vw, 44px);
  line-height: 1.2;
  margin: 0 0 10px;
}

.article-hero span {
  color: rgba(18, 24, 38, 0.58);
  font-size: 14px;
}

.article-layout {
  align-items: start;
  display: grid;
  gap: 28px;
  grid-template-columns: minmax(0, 1fr) 260px;
}

.article-layout.without-toc {
  grid-template-columns: minmax(0, 1fr);
}

.article-main {
  min-width: 0;
}

.article-content {
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  line-height: 1.82;
  overflow: hidden;
  padding: 26px;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3) {
  scroll-margin-top: 190px;
}

.article-content :deep(h1) {
  font-size: 30px;
}

.article-content :deep(h2) {
  font-size: 25px;
}

.article-content :deep(h3) {
  font-size: 21px;
}

.article-content :deep(p) {
  margin: 12px 0;
}

.article-content :deep(blockquote) {
  border-left: 4px solid rgba(92, 148, 232, 0.7);
  color: rgba(18, 24, 38, 0.72);
  margin: 18px 0;
  padding: 10px 18px;
}

.article-content :deep(pre) {
  background: rgba(16, 24, 40, 0.78);
  border-radius: 8px;
  color: rgba(244, 248, 255, 0.95);
  overflow-x: auto;
  padding: 16px;
}

.article-toc {
  position: sticky;
  top: 180px;
}

.toc-card {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(80, 140, 220, 0.16);
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: calc(100vh - 220px);
  overflow: auto;
  padding: 14px;
  backdrop-filter: blur(18px) saturate(170%);
}

.toc-card strong {
  margin-bottom: 8px;
}

.toc-item {
  background: transparent;
  border: 0;
  border-radius: 7px;
  color: rgba(18, 24, 38, 0.68);
  cursor: pointer;
  font-family: inherit;
  line-height: 1.45;
  padding: 8px 10px;
  text-align: left;
  transition: background 0.25s ease, color 0.25s ease, transform 0.25s ease;
}

.toc-item:hover,
.toc-item.active {
  background: rgba(96, 152, 236, 0.16);
  color: rgba(28, 86, 166, 0.96);
  transform: translateX(3px);
}

.toc-item.level-2 {
  padding-left: 22px;
}

.toc-item.level-3 {
  padding-left: 34px;
  font-size: 13px;
}

.comment-panel {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  margin-top: 26px;
  padding: 22px;
}

.comment-title,
.comment-meta {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.comment-title h2 {
  margin: 0;
}

.comment-title span,
.comment-meta small,
.empty-comment {
  color: rgba(18, 24, 38, 0.56);
}

.comment-form {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr auto;
  margin: 16px 0 18px;
}

.comment-form textarea {
  grid-column: 1 / -1;
  resize: vertical;
}

.comment-form input,
.comment-form textarea {
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 8px;
  color: rgba(18, 24, 38, 0.9);
  font-family: inherit;
  padding: 10px 12px;
}

.comment-form input:focus,
.comment-form textarea:focus {
  border-color: rgba(92, 148, 232, 0.62);
  box-shadow: 0 0 0 3px rgba(92, 148, 232, 0.12);
  outline: none;
}

.comment-form button {
  align-self: stretch;
  background: rgba(92, 148, 232, 0.32);
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: 8px;
  color: rgba(18, 24, 38, 0.9);
  cursor: pointer;
  font-family: inherit;
  padding: 0 18px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.comment-form button:hover:not(:disabled) {
  box-shadow: 0 8px 22px rgba(82, 142, 220, 0.2);
  transform: translateY(-1px);
}

.comment-form button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-item {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px;
}

.comment-item p {
  line-height: 1.7;
  margin: 8px 0 0;
}

@media (max-width: 980px) {
  .article-layout {
    grid-template-columns: 1fr;
  }

  .article-toc {
    order: -1;
    position: static;
  }

  .toc-card {
    max-height: none;
  }
}

@media (max-width: 680px) {
  .article-content,
  .comment-panel {
    padding: 16px;
  }

  .comment-form {
    grid-template-columns: 1fr;
  }

  .comment-form button {
    min-height: 42px;
  }
}
</style>
