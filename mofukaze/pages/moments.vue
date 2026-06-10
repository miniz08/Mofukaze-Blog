<template>
  <section class="moments-page">
    <header class="moments-hero">
      <div>
        <p>Moments</p>
        <h1>动态</h1>
      </div>
      <button v-if="ifVisible" type="button" class="compose-toggle" @click="toggleComposer">
        {{ isComposerOpen ? '收起编辑器' : '写一条动态' }}
      </button>
    </header>

    <section v-if="ifVisible && isComposerOpen" class="moment-editor">
      <div class="editor-fields">
        <label>
          <span>标题</span>
          <input v-model.trim="form.title" type="text" placeholder="比如：今晚随便记一点" />
        </label>
        <label>
          <span>心情 / 标签</span>
          <input v-model.trim="form.mood" type="text" placeholder="比如：日常 / 游戏 / 听歌" />
        </label>
      </div>

      <Editor ref="editorRef" v-model="form.content" />

      <div class="editor-actions">
        <span>{{ editingId ? '正在编辑一条动态' : '支持图片和视频上传' }}</span>
        <div>
          <button v-if="editingId" type="button" class="ghost-button" @click="resetForm">
            取消
          </button>
          <button type="button" :disabled="isSubmitting" @click="submitMoment">
            {{ isSubmitting ? '保存中...' : editingId ? '保存修改' : '发布动态' }}
          </button>
        </div>
      </div>
    </section>

    <div v-if="isLoading" class="moments-state">
      正在翻动最近的碎片...
    </div>

    <div v-else-if="errorMessage" class="moments-state error-state">
      {{ errorMessage }}
    </div>

    <div v-else-if="moments.length" class="moments-timeline">
      <article v-for="moment in moments" :key="moment.id" class="moment-card">
        <aside class="moment-time">
          <strong>{{ formatDay(moment.posttime) }}</strong>
          <span>{{ formatYearMonth(moment.posttime) }}</span>
        </aside>

        <div class="moment-body">
          <header class="moment-header">
            <div>
              <p>{{ moment.mood || '随记' }}</p>
              <h2>{{ moment.title }}</h2>
            </div>
            <time :datetime="moment.posttime">{{ formatDateTime(moment.posttime) }}</time>
          </header>

          <div class="moment-content" v-html="moment.content"></div>

          <div v-if="ifVisible" class="moment-admin-actions">
            <button type="button" @click="startEdit(moment)">编辑</button>
            <button type="button" class="danger-button" @click="deleteMoment(moment)">删除</button>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="moments-state">
      这里还没有动态，适合留给某个普通但值得记住的晚上。
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import Editor from '~/components/editor/editor.vue'

type MomentSegment = {
  id: number
  kind?: string
  title: string
  content: string
  mood?: string | null
  sortOrder: number
  visible: boolean
  posttime: string
  updatedAt: string
}

const admin = useAdmin()
const ifVisible = computed(() => admin.isAdmin.value)
const isLoading = ref(true)
const isSubmitting = ref(false)
const isComposerOpen = ref(false)
const errorMessage = ref('')
const moments = ref<MomentSegment[]>([])
const editorRef = ref<InstanceType<typeof Editor> | null>(null)
const editingId = ref<number | null>(null)

const emptyContent = '<p></p>'

const form = ref({
  title: '',
  mood: '',
  content: emptyContent,
})

const richTextToPlain = (html: string) => {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

const hasMedia = (html: string) => /<(img|video)\b/i.test(html)
const hasLocalResource = (html: string) => /(?:blob:|data:image|data:video)/i.test(html)

const toggleComposer = () => {
  isComposerOpen.value = !isComposerOpen.value
  if (!isComposerOpen.value) {
    resetForm()
  }
}

const resetForm = () => {
  editingId.value = null
  form.value = {
    title: '',
    mood: '',
    content: emptyContent,
  }
  editorRef.value?.setContent(emptyContent)
}

const loadMoments = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res: any = await $fetch('/api/posts/about/getSegments', {
      method: 'GET',
      query: { kind: 'moment' },
    })
    if (res?.status && res.status !== 'success') {
      throw new Error(res.message || '动态加载失败')
    }
    moments.value = Array.isArray(res?.data) ? res.data : []
  } catch (error: any) {
    console.warn('[moments] load failed', error)
    moments.value = []
    errorMessage.value = '动态暂时没有准备好。'
  } finally {
    isLoading.value = false
  }
}

const submitMoment = async () => {
  const htmlContent = editorRef.value?.getHTML() || form.value.content
  const plainText = richTextToPlain(htmlContent)

  if (!form.value.title.trim() || (!plainText && !hasMedia(htmlContent))) {
    alert('标题和内容不能为空')
    return
  }

  if (hasLocalResource(htmlContent)) {
    alert('还有资源没有上传完成，请稍等一下再保存。')
    return
  }

  isSubmitting.value = true
  try {
    const endpoint = editingId.value
      ? '/api/posts/about/updateSegment'
      : '/api/posts/about/createSegment'
    const res: any = await $fetch(endpoint, {
      method: editingId.value ? 'PUT' : 'POST',
      headers: admin.getAuthHeader(),
      body: {
        id: editingId.value || undefined,
        kind: 'moment',
        title: form.value.title,
        mood: form.value.mood || null,
        sortOrder: 0,
        content: htmlContent,
        visible: true,
      },
    })

    if (res?.status !== 'success') {
      throw new Error(res?.message || '保存失败')
    }

    resetForm()
    isComposerOpen.value = false
    await loadMoments()
  } catch (error: any) {
    alert(error?.message || '保存失败')
  } finally {
    isSubmitting.value = false
  }
}

const startEdit = async (moment: MomentSegment) => {
  editingId.value = moment.id
  isComposerOpen.value = true
  form.value = {
    title: moment.title,
    mood: moment.mood || '',
    content: moment.content || emptyContent,
  }
  await nextTick()
  editorRef.value?.setContent(form.value.content)
}

const deleteMoment = async (moment: MomentSegment) => {
  if (!confirm(`确定要删除「${moment.title}」吗？`)) return

  try {
    const res: any = await $fetch('/api/posts/about/deleteSegment', {
      method: 'DELETE',
      headers: admin.getAuthHeader(),
      body: { id: moment.id },
    })

    if (res?.status !== 'success') {
      throw new Error(res?.message || '删除失败')
    }

    moments.value = moments.value.filter((item) => item.id !== moment.id)
  } catch (error: any) {
    alert(error?.message || '删除失败')
  }
}

const toDate = (value: string | Date) => new Date(value)

const formatDay = (value: string | Date) => {
  const date = toDate(value)
  return Number.isNaN(date.getTime()) ? '--' : String(date.getDate()).padStart(2, '0')
}

const formatYearMonth = (value: string | Date) => {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return '未知'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
  }).format(date)
}

const formatDateTime = (value: string | Date) => {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return '未知时间'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

onMounted(loadMoments)

useSeoMeta({
  title: '动态 - Mofukaze',
})
</script>

<style scoped>
.moments-page {
  color: var(--theme-text);
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.moments-hero {
  align-items: end;
  display: flex;
  gap: 18px;
  justify-content: space-between;
}

.moments-hero p,
.moment-time span,
.moment-header p,
.editor-fields label span,
.editor-actions span {
  color: var(--theme-accent);
  font-size: 13px;
  letter-spacing: 0;
  margin: 0 0 6px;
}

.moments-hero h1 {
  font-size: clamp(34px, 6vw, 56px);
  line-height: 1.08;
  margin: 0;
}

.compose-toggle,
.editor-actions button,
.moment-admin-actions button {
  background: color-mix(in srgb, var(--theme-accent) 20%, var(--surface-soft));
  border: 1px solid color-mix(in srgb, var(--theme-accent) 30%, var(--border-soft));
  border-radius: 8px;
  color: var(--theme-text);
  cursor: pointer;
  font: inherit;
  padding: 10px 14px;
  transition: transform 0.24s ease, border-color 0.24s ease, background 0.24s ease;
}

.compose-toggle:hover,
.editor-actions button:hover:not(:disabled),
.moment-admin-actions button:hover {
  border-color: color-mix(in srgb, var(--theme-accent) 55%, var(--border-soft));
  transform: translateY(-1px);
}

.moment-editor,
.moments-state,
.moment-body {
  background: var(--surface-card);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  box-shadow: 0 14px 34px color-mix(in srgb, var(--theme-shadow) 58%, rgba(0, 0, 0, 0.16));
}

.moment-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.editor-fields {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 260px);
}

.editor-fields label {
  display: flex;
  flex-direction: column;
}

.editor-fields input {
  background: color-mix(in srgb, var(--surface-reading) 72%, var(--surface-soft));
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  color: var(--theme-text);
  font: inherit;
  padding: 10px 12px;
}

.editor-actions {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.editor-actions > div {
  display: flex;
  gap: 10px;
}

.editor-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.editor-actions .ghost-button,
.moment-admin-actions .danger-button {
  background: transparent;
}

.moments-state {
  padding: 28px;
  text-align: center;
}

.error-state {
  color: #ff9aa8;
}

.moments-timeline {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.moment-card {
  display: grid;
  gap: 16px;
  grid-template-columns: 92px minmax(0, 1fr);
  position: relative;
}

.moment-card::before {
  background: linear-gradient(180deg, var(--theme-accent), transparent);
  bottom: -18px;
  content: "";
  left: 45px;
  opacity: 0.28;
  position: absolute;
  top: 58px;
  width: 1px;
}

.moment-card:last-child::before {
  display: none;
}

.moment-time {
  align-items: center;
  background: color-mix(in srgb, var(--surface-soft) 80%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  height: 84px;
  justify-content: center;
  position: sticky;
  top: 132px;
}

.moment-time strong {
  color: color-mix(in srgb, var(--theme-accent) 82%, var(--theme-text));
  font-size: 28px;
  line-height: 1;
}

.moment-time span {
  margin: 0;
}

.moment-body {
  background: var(--surface-reading);
  min-width: 0;
  padding: clamp(18px, 2.6vw, 28px);
}

.moment-header {
  align-items: start;
  border-bottom: 1px solid var(--border-soft);
  display: flex;
  gap: 18px;
  justify-content: space-between;
  margin-bottom: 18px;
  padding-bottom: 14px;
}

.moment-header h2 {
  font-size: clamp(22px, 3vw, 32px);
  line-height: 1.25;
  margin: 0;
}

.moment-header time {
  color: var(--readable-faint);
  flex: 0 0 auto;
  font-size: 13px;
  padding-top: 4px;
}

.moment-content {
  color: color-mix(in srgb, var(--theme-text) 90%, var(--readable-muted));
  font-size: 17px;
  line-height: 1.9;
  overflow-wrap: anywhere;
}

.moment-content :deep(p) {
  margin: 0 0 1em;
}

.moment-content :deep(a) {
  color: var(--theme-accent);
}

.moment-content :deep(img) {
  border-radius: 8px;
  box-shadow: 0 10px 26px var(--theme-shadow);
  display: block;
  height: auto;
  margin: 18px auto;
  max-height: min(78vh, 760px);
  max-width: min(100%, 920px);
  object-fit: contain;
}

.moment-content :deep(video) {
  aspect-ratio: 16 / 9;
  background: rgba(0, 0, 0, 0.28);
  border-radius: 8px;
  box-shadow: 0 10px 26px var(--theme-shadow);
  display: block;
  height: auto;
  margin: 18px auto;
  max-height: 76vh;
  max-width: min(100%, 980px);
  width: 100%;
}

.moment-content :deep(blockquote) {
  border-left: 3px solid var(--theme-accent);
  color: var(--readable-muted);
  margin: 18px 0;
  padding: 8px 0 8px 18px;
}

.moment-content :deep(pre) {
  background: color-mix(in srgb, #000 24%, var(--surface-card));
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  overflow: auto;
  padding: 14px;
}

.moment-admin-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 18px;
}

@media (max-width: 760px) {
  .moments-hero,
  .editor-actions,
  .moment-header {
    align-items: stretch;
    flex-direction: column;
  }

  .editor-fields,
  .moment-card {
    grid-template-columns: 1fr;
  }

  .moment-card::before {
    display: none;
  }

  .moment-time {
    align-items: baseline;
    flex-direction: row;
    height: auto;
    justify-content: flex-start;
    padding: 10px 12px;
    position: static;
  }

  .moment-header time {
    padding-top: 0;
  }
}
</style>
