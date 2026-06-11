<template>
  <section class="comment-section">
    <div class="section-title">
      <MessageSquare />
      <h2>{{ title }}</h2>
    </div>

    <form class="comment-form" @submit.prevent="submitComment">
      <div class="form-grid">
        <input v-model.trim="commentForm.name" type="text" placeholder="昵称" maxlength="40" autocomplete="name" />
        <input v-model.trim="commentForm.email" type="email" placeholder="邮箱（可选，不公开）" maxlength="120" autocomplete="email" />
        <input v-model.trim="commentForm.homepage" type="url" placeholder="个人主页（可选）" maxlength="191" autocomplete="url" />
      </div>

      <textarea
        v-model.trim="commentForm.content"
        placeholder="留下些什么"
        maxlength="1200"
        rows="3"
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
            <span class="comment-date">{{ formatDate(comment.posttime) }}</span>
          </div>
        </div>

        <p class="comment-content">{{ comment.content }}</p>

        <div class="comment-foot">
          <div class="comment-client-meta">
            <span v-if="comment.ipLocation"><MapPin />{{ comment.ipLocation }}</span>
            <span v-if="comment.browser || comment.os"><Monitor />{{ [comment.browser, comment.os].filter(Boolean).join(' / ') }}</span>
          </div>

          <div class="comment-tools">
            <button
              v-if="comment.replies?.length"
              type="button"
              @click="toggleCollapse(comment.id)"
            >
              <ChevronRight v-if="isCollapsed(comment.id)" />
              <ChevronDown v-else />
              {{ isCollapsed(comment.id) ? `展开 ${comment.replies.length} 条回复` : '收起回复' }}
            </button>
            <button type="button" @click="startReply(comment)">
              <Reply />
              回复
            </button>
          </div>
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
            rows="2"
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

      <p v-if="!isLoading && comments.length === 0" class="empty-text">
        这里暂时还没有评论。
      </p>
      <p v-if="isLoading" class="empty-text">正在加载评论...</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MapPin,
  MessageSquare,
  Monitor,
  Reply,
  Send,
  X,
} from 'lucide-vue-next'

type CommentTargetType = 'article' | 'collection' | 'moment'

type CommentItem = {
  id: number
  name: string
  homepage?: string | null
  content: string
  posttime: string
  articleId?: number | null
  collectionId?: number | null
  momentId?: number | null
  parentId?: number | null
  ipLocation?: string | null
  browser?: string | null
  os?: string | null
  replies?: CommentItem[]
}

type FlatCommentItem = CommentItem & {
  depth: number
}

const props = withDefaults(defineProps<{
  targetType: CommentTargetType
  targetId: number
  title?: string
}>(), {
  title: '评论',
})

const COMMENT_PROFILE_KEY = 'mofukaze.comment-profile'
const COMMENT_PROFILE_TTL = 30 * 24 * 60 * 60 * 1000

const comments = ref<CommentItem[]>([])
const isLoading = ref(false)
const isSubmittingComment = ref(false)
const isSubmittingReply = ref(false)
const activeReplyId = ref<number | null>(null)
const replyContent = ref('')
const collapsedIds = ref<number[]>([])

const commentForm = ref({
  name: '',
  email: '',
  homepage: '',
  content: '',
})

const targetPayloadKey = computed(() => {
  if (props.targetType === 'article') return 'articleId'
  if (props.targetType === 'collection') return 'collectionId'
  return 'momentId'
})

const flatComments = computed<FlatCommentItem[]>(() => {
  const flatten = (items: CommentItem[], depth = 0): FlatCommentItem[] => {
    return items.flatMap((comment) => {
      const current = { ...comment, depth }
      if (isCollapsed(comment.id)) return [current]
      return [current, ...flatten(comment.replies || [], Math.min(depth + 1, 6))]
    })
  }

  return flatten(comments.value)
})

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

const isCollapsed = (id: number) => collapsedIds.value.includes(id)

const toggleCollapse = (id: number) => {
  collapsedIds.value = isCollapsed(id)
    ? collapsedIds.value.filter((item) => item !== id)
    : [...collapsedIds.value, id]
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

const getCommentBasePayload = () => {
  return {
    [targetPayloadKey.value]: props.targetId,
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

const loadComments = async () => {
  if (!props.targetId) return

  isLoading.value = true
  try {
    const res: any = await $fetch('/api/posts/comment/loadComments', {
      method: 'GET',
      query: { [targetPayloadKey.value]: props.targetId },
    })

    comments.value = Array.isArray(res?.comments) ? res.comments : []
  } catch (err) {
    console.warn('[comments] 评论加载失败', err)
    comments.value = []
  } finally {
    isLoading.value = false
  }
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

onMounted(() => {
  loadStoredCommentProfile()
})

watch(
  () => [props.targetType, props.targetId],
  () => {
    activeReplyId.value = null
    replyContent.value = ''
    collapsedIds.value = []
    loadComments()
  },
  { immediate: true },
)
</script>

<style scoped>
.comment-section {
  background: var(--surface-card);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  box-shadow: 0 12px 30px color-mix(in srgb, var(--theme-shadow) 52%, rgba(0, 0, 0, 0.14));
  padding: 16px;
}

.section-title {
  align-items: center;
  display: flex;
  gap: 9px;
  margin-bottom: 12px;
}

.section-title svg {
  color: var(--theme-accent);
  height: 18px;
  width: 18px;
}

.section-title h2 {
  font-size: 18px;
  margin: 0;
}

.comment-form,
.reply-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-form {
  margin-bottom: 14px;
}

.reply-form {
  background: color-mix(in srgb, var(--surface-soft) 64%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  margin-top: 10px;
  padding: 10px;
}

.form-grid {
  display: grid;
  gap: 10px;
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
  font-size: 14px;
  padding: 9px 10px;
  resize: vertical;
}

.comment-form input::placeholder,
.comment-form textarea::placeholder,
.reply-form textarea::placeholder {
  color: var(--readable-faint);
}

.comment-actions,
.comment-foot {
  align-items: center;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.reply-actions,
.comment-tools,
.comment-client-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.comment-actions span,
.empty-text,
.comment-date,
.comment-client-meta span {
  color: var(--readable-muted);
  font-size: 12px;
}

.comment-actions button,
.comment-tools button {
  align-items: center;
  background: color-mix(in srgb, var(--theme-accent) 18%, var(--surface-soft));
  border: 1px solid color-mix(in srgb, var(--theme-accent) 28%, var(--border-soft));
  border-radius: 8px;
  color: var(--theme-text);
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 13px;
  gap: 6px;
  padding: 7px 10px;
  transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
}

.comment-tools button {
  background: transparent;
  padding: 5px 7px;
}

.comment-actions button:hover:not(:disabled),
.comment-tools button:hover {
  border-color: color-mix(in srgb, var(--theme-accent) 48%, var(--border-soft));
  transform: translateY(-1px);
}

.comment-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.comment-actions svg,
.comment-tools svg,
.comment-client-meta svg,
.comment-author svg {
  height: 14px;
  width: 14px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-item {
  background: color-mix(in srgb, var(--surface-reading) 64%, var(--surface-soft));
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  margin-left: calc(var(--comment-depth, 0) * 18px);
  padding: 10px 12px;
  position: relative;
}

.comment-item::before {
  background: color-mix(in srgb, var(--theme-accent) 42%, transparent);
  border-radius: 99px;
  content: "";
  height: calc(100% - 14px);
  left: -10px;
  opacity: calc(var(--comment-depth, 0) * 0.2);
  position: absolute;
  top: 7px;
  width: 2px;
}

.comment-meta {
  align-items: center;
  display: grid;
  gap: 9px;
  grid-template-columns: 28px minmax(0, 1fr);
}

.comment-avatar {
  align-items: center;
  background: color-mix(in srgb, var(--theme-accent) 26%, var(--surface-soft));
  border: 1px solid var(--border-soft);
  border-radius: 50%;
  color: var(--theme-text);
  display: inline-flex;
  font-size: 12px;
  height: 28px;
  justify-content: center;
  width: 28px;
}

.comment-author {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.comment-author a {
  align-items: center;
  color: var(--theme-text);
  display: inline-flex;
  gap: 5px;
  text-decoration: none;
}

.comment-author a:hover {
  color: var(--theme-accent);
}

.comment-content {
  color: color-mix(in srgb, var(--theme-text) 90%, var(--readable-muted));
  font-size: 14px;
  line-height: 1.65;
  margin: 7px 0 9px;
  white-space: pre-wrap;
}

.comment-client-meta span {
  align-items: center;
  display: inline-flex;
  gap: 4px;
}

.empty-text {
  margin: 0;
  padding: 8px 0;
  text-align: center;
}

@media (max-width: 720px) {
  .comment-actions,
  .comment-foot {
    align-items: stretch;
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .reply-actions {
    flex-direction: column;
  }

  .comment-item {
    margin-left: calc(var(--comment-depth, 0) * 10px);
  }
}
</style>
