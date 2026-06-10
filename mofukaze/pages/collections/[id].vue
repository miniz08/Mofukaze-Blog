<template>
  <section class="collection-detail-page">
    <div v-if="isLoading" class="detail-state">
      正在打开收藏...
    </div>

    <article v-else class="collection-detail">
      <header class="detail-hero">
        <img :src="imageSrc" :alt="title" />
        <div class="detail-copy">
          <p>{{ tag || '收藏' }}</p>
          <h1>{{ title }}</h1>
          <span v-if="posttime">{{ formatDate(posttime) }}</span>

          <div v-if="ifVisible" class="admin-actions">
            <button type="button" class="edit-button" @click="editCollection">编辑</button>
            <button type="button" class="delete-button" @click="deleteCollection">删除</button>
          </div>
        </div>
      </header>

      <div class="collection-content" v-html="content"></div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const config = useRuntimeConfig()
const route = useRoute()
const router = useRouter()
const admin = useAdmin()

const content = ref('')
const title = ref('')
const tag = ref('')
const posttime = ref('')
const imageSrc = ref('')
const isLoading = ref(true)
const collectionId = ref(0)

const ifVisible = computed(() => !!admin.getAuthHeader())
const cdnRoot = computed(() => String(config.public.cdn || '').replace(/\/$/, ''))

const resolveCoverUrl = (item: any) => {
  const rawUrl = String(item?.imageUrl || '').trim()

  if (/^https?:\/\//i.test(rawUrl)) return rawUrl
  if (rawUrl.startsWith('/')) return `${cdnRoot.value}${rawUrl}`
  if (rawUrl) return `${cdnRoot.value}/${rawUrl.replace(/^\/+/, '')}`

  return `${cdnRoot.value}/img/cover/${item.title}.jpeg`
}

const formatDate = (value: string | Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

const fetchCollectionContent = async (id: number) => {
  try {
    const response = await $fetch('/api/posts/collection/findCollectionByID', {
      method: 'GET',
      query: { id },
    })

    const result = Array.isArray(response) ? response[0] : null
    if (!result) return

    title.value = result.title
    tag.value = result.tag || ''
    posttime.value = result.posttime || ''
    content.value = result.content
    imageSrc.value = resolveCoverUrl(result)
  } finally {
    isLoading.value = false
  }
}

const deleteCollection = async () => {
  if (!confirm('确定要删除这个收藏吗？')) return

  try {
    await $fetch('/api/posts/collection/deleteCollection', {
      method: 'POST',
      headers: admin.getAuthHeader(),
      body: { id: collectionId.value },
    })
    router.push('/collection')
  } catch (error) {
    console.error('删除收藏失败', error)
  }
}

const editCollection = () => {
  router.push({
    path: `/collectionEdit/${collectionId.value}`,
    query: { id: collectionId.value },
  })
}

onMounted(() => {
  collectionId.value = Number(route.params.id)
  fetchCollectionContent(collectionId.value)
})
</script>

<style scoped>
.collection-detail-page {
  color: var(--theme-text);
}

.detail-state,
.collection-detail {
  background: var(--surface-card);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  box-shadow: 0 14px 34px color-mix(in srgb, var(--theme-shadow) 58%, rgba(0, 0, 0, 0.16));
}

.detail-state {
  padding: 30px;
  text-align: center;
}

.collection-detail {
  overflow: hidden;
}

.detail-hero {
  display: grid;
  gap: clamp(18px, 3vw, 30px);
  grid-template-columns: minmax(180px, 260px) minmax(0, 1fr);
  padding: clamp(18px, 3vw, 30px);
}

.detail-hero img {
  aspect-ratio: 3 / 4;
  border-radius: 8px;
  box-shadow: 0 14px 34px var(--theme-shadow);
  height: auto;
  object-fit: cover;
  width: 100%;
}

.detail-copy {
  align-self: center;
}

.detail-copy p {
  color: var(--theme-accent);
  font-size: 13px;
  letter-spacing: 0;
  margin: 0 0 8px;
}

.detail-copy h1 {
  font-size: clamp(30px, 5vw, 48px);
  line-height: 1.14;
  margin: 0 0 12px;
}

.detail-copy span {
  color: var(--readable-muted);
}

.admin-actions {
  display: flex;
  gap: 10px;
  margin-top: 22px;
}

.admin-actions button {
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  color: var(--theme-text);
  cursor: pointer;
  font: inherit;
  padding: 9px 13px;
}

.edit-button {
  background: color-mix(in srgb, var(--theme-accent) 24%, var(--surface-soft));
}

.delete-button {
  background: rgba(255, 100, 120, 0.28);
}

.collection-content {
  background: var(--surface-reading);
  border-top: 1px solid var(--border-soft);
  font-size: 17px;
  line-height: 1.86;
  padding: clamp(18px, 3vw, 30px);
  overflow-wrap: anywhere;
}

.collection-content :deep(img),
.collection-content :deep(video) {
  border-radius: 8px;
  box-shadow: 0 12px 30px var(--theme-shadow);
  display: block;
  height: auto;
  margin: 18px auto;
  max-width: 100%;
}

.collection-content :deep(video) {
  max-height: 72vh;
}

@media (max-width: 760px) {
  .detail-hero {
    grid-template-columns: 1fr;
  }

  .admin-actions {
    flex-direction: column;
  }
}
</style>
