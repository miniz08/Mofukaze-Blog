<template>
  <section class="about-page">
    <header class="about-hero">
      <div class="about-title">
        <p>About Mofukaze</p>
        <h1>关于</h1>
      </div>

      <div class="profile-actions" aria-label="个人主页链接">
        <a
          v-for="link in profileLinks"
          :key="link.label"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i v-if="link.icon" :class="link.icon"></i>
          <span>{{ link.label }}</span>
        </a>
      </div>
    </header>

    <section v-if="ifVisible" class="about-editor">
      <div class="editor-grid">
        <label>
          <span>段落标题</span>
          <input v-model.trim="form.title" type="text" placeholder="比如：某个夏天" />
        </label>
        <label>
          <span>旁注</span>
          <input v-model.trim="form.mood" type="text" placeholder="比如：大学 / 北风 / 游戏" />
        </label>
        <label>
          <span>排序</span>
          <input v-model.number="form.sortOrder" type="number" />
        </label>
      </div>
      <textarea
        v-model.trim="form.content"
        rows="5"
        placeholder="写一段像回忆录一样的文字。"
      ></textarea>
      <div class="editor-actions">
        <span>{{ form.content.length }}/20000</span>
        <button type="button" :disabled="isSubmitting" @click="createSegment">
          {{ isSubmitting ? '添加中...' : '添加段落' }}
        </button>
      </div>
    </section>

    <div v-if="isLoading" class="about-state">
      正在整理记忆...
    </div>

    <div v-else-if="errorMessage" class="about-state error-state">
      {{ errorMessage }}
    </div>

    <div v-else-if="segments.length" class="memoir-list">
      <article
        v-for="(segment, index) in segments"
        :key="segment.id"
        class="memoir-segment"
      >
        <div class="segment-index">{{ String(index + 1).padStart(2, '0') }}</div>
        <div class="segment-body">
          <p class="segment-kicker">{{ segment.mood || formatDate(segment.posttime) }}</p>
          <h2>{{ segment.title }}</h2>
          <div class="segment-content">
            <p v-for="(paragraph, pIndex) in splitParagraphs(segment.content)" :key="pIndex">
              {{ paragraph }}
            </p>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="about-state">
      这里还没有写下什么。
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type AboutSegment = {
  id: number
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
const errorMessage = ref('')
const segments = ref<AboutSegment[]>([])

const profileLinks = ref<{ label: string; href: string; icon?: string }[]>([
  // 这里预留给你后续扩展 GitHub、Bilibili 等图标链接，例如：
  // { label: 'GitHub', href: 'https://github.com/your-name', icon: 'fa-brands fa-github' },
])

const form = ref({
  title: '',
  mood: '',
  sortOrder: 0,
  content: '',
})

const splitParagraphs = (content: string) => {
  return String(content || '')
    .split(/\n{1,}/)
    .map((line) => line.trim())
    .filter(Boolean)
}

const formatDate = (value: string | Date) => {
  if (!value) return '某个时候'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

const loadSegments = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res: any = await $fetch('/api/posts/about/getSegments', {
      method: 'GET',
      query: { kind: 'about' },
    })
    if (res?.status && res.status !== 'success') {
      throw new Error(res.message || '关于页加载失败')
    }
    segments.value = Array.isArray(res?.data) ? res.data : []
  } catch (error: any) {
    console.warn('[about] load failed', error)
    segments.value = []
    errorMessage.value = '关于页暂时还没有准备好。'
  } finally {
    isLoading.value = false
  }
}

const createSegment = async () => {
  if (!form.value.title || !form.value.content) {
    alert('标题和内容不能为空')
    return
  }

  isSubmitting.value = true
  try {
    const res: any = await $fetch('/api/posts/about/createSegment', {
      method: 'POST',
      headers: admin.getAuthHeader(),
      body: {
        kind: 'about',
        title: form.value.title,
        mood: form.value.mood || null,
        sortOrder: Number(form.value.sortOrder) || 0,
        content: form.value.content,
      },
    })

    if (res?.status !== 'success') {
      throw new Error(res?.message || '添加失败')
    }

    form.value = {
      title: '',
      mood: '',
      sortOrder: 0,
      content: '',
    }
    await loadSegments()
  } catch (error: any) {
    alert(error?.message || '添加失败')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(loadSegments)

useSeoMeta({
  title: '关于 - Mofukaze',
})
</script>

<style scoped>
.about-page {
  color: var(--theme-text);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.about-hero {
  align-items: end;
  display: flex;
  gap: 18px;
  justify-content: space-between;
}

.about-title p,
.segment-kicker,
.about-editor label span,
.editor-actions span {
  color: var(--theme-accent);
  font-size: 13px;
  letter-spacing: 0;
  margin: 0 0 6px;
}

.about-title h1 {
  font-size: clamp(34px, 6vw, 56px);
  line-height: 1.08;
  margin: 0;
}

.profile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.profile-actions a {
  align-items: center;
  background: var(--surface-soft);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  color: var(--theme-text);
  display: inline-flex;
  gap: 7px;
  padding: 8px 11px;
  text-decoration: none;
}

.about-editor,
.about-state,
.memoir-segment {
  background: var(--surface-card);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  box-shadow: 0 14px 34px color-mix(in srgb, var(--theme-shadow) 58%, rgba(0, 0, 0, 0.16));
}

.memoir-segment {
  background: var(--surface-reading);
}

.about-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.editor-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) minmax(160px, 240px) 120px;
}

.about-editor label {
  display: flex;
  flex-direction: column;
}

.about-editor input,
.about-editor textarea {
  background: color-mix(in srgb, var(--surface-reading) 72%, var(--surface-soft));
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  color: var(--theme-text);
  font: inherit;
  padding: 10px 12px;
}

.about-editor textarea {
  resize: vertical;
}

.editor-actions {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.editor-actions button {
  background: color-mix(in srgb, var(--theme-accent) 24%, var(--surface-soft));
  border: 1px solid color-mix(in srgb, var(--theme-accent) 24%, var(--border-soft));
  border-radius: 8px;
  color: var(--theme-text);
  cursor: pointer;
  font: inherit;
  padding: 10px 14px;
}

.editor-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.about-state {
  padding: 28px;
  text-align: center;
}

.error-state {
  color: #ff9aa8;
}

.memoir-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.memoir-segment {
  display: grid;
  gap: 18px;
  grid-template-columns: 70px minmax(0, 1fr);
  padding: clamp(18px, 2.6vw, 28px);
  position: relative;
}

.memoir-segment::before {
  background: linear-gradient(180deg, var(--theme-accent), transparent);
  content: "";
  left: 70px;
  opacity: 0.28;
  position: absolute;
  top: 28px;
  bottom: 28px;
  width: 1px;
}

.segment-index {
  color: color-mix(in srgb, var(--theme-accent) 78%, var(--theme-text));
  font-size: 26px;
  line-height: 1;
}

.segment-body {
  min-width: 0;
}

.segment-body h2 {
  font-size: clamp(24px, 3vw, 34px);
  line-height: 1.2;
  margin: 0 0 14px;
}

.segment-content {
  color: color-mix(in srgb, var(--theme-text) 88%, var(--readable-muted));
  font-size: 17px;
  line-height: 1.95;
}

.segment-content p {
  margin: 0 0 1.05em;
}

.segment-content p:last-child {
  margin-bottom: 0;
}

@media (max-width: 760px) {
  .about-hero,
  .editor-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .profile-actions {
    justify-content: flex-start;
  }

  .editor-grid,
  .memoir-segment {
    grid-template-columns: 1fr;
  }

  .memoir-segment::before {
    display: none;
  }
}
</style>
