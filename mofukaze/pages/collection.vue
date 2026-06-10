<template>
  <section class="collection-page">
    <header class="collection-header">
      <div>
        <p>Collection Shelf</p>
        <h1>收藏</h1>
      </div>
      <button v-if="ifVisible" type="button" class="add-button" @click="openEditor">
        添加收藏
      </button>
    </header>

    <div v-if="isLoading" class="collection-state">
      正在整理收藏...
    </div>

    <div v-else class="collection-sections">
      <section
        v-for="section in collectionSections"
        :key="section.tag"
        class="collection-section"
      >
        <div class="section-copy">
          <div>
            <span>{{ section.count }} 项</span>
            <h2>{{ section.title }}</h2>
          </div>
          <p>{{ section.description }}</p>
        </div>

        <div v-if="section.items.length" class="cover-grid">
          <button
            v-for="item in section.items"
            :key="item.id"
            type="button"
            class="cover-card"
            @click="redirectToCollection(item.id)"
          >
            <img :src="item.imageUrl" :alt="item.title" loading="lazy" />
            <span>{{ item.title }}</span>
          </button>
        </div>

        <p v-else class="empty-text">这一格还空着。</p>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

type CollectionItem = {
  id: number
  title: string
  time: string
  tag: string
  imageUrl: string
}

const categories = [
  {
    tag: '游戏',
    title: '我喜欢的游戏',
    description: '玩的东西很杂，动作游戏最多，也有一些会留下很长回声的网游和沙盒。',
  },
  {
    tag: '动漫',
    title: '我喜欢的动漫',
    description: '某种意义上，这里很像一条二次元时间线。',
  },
  {
    tag: '电影',
    title: '我喜欢的电影',
    description: '看得不算多，但有些作品确实改变过我理解世界的方式。',
  },
  {
    tag: '音乐',
    title: '我喜欢的音乐专辑',
    description: '摇滚占了很大比例，很多乐队比我的年纪还要大得多。',
  },
]

const router = useRouter()
const config = useRuntimeConfig()
const admin = useAdmin()

const isLoading = ref(true)
const collections = ref<CollectionItem[]>([])
const maxDisplayItems = 12

const ifVisible = computed(() => !!admin.getAuthHeader())

const cdnRoot = computed(() => String(config.public.cdn || '').replace(/\/$/, ''))

const resolveCoverUrl = (item: any) => {
  const rawUrl = String(item.imageUrl || '').trim()

  if (/^https?:\/\//i.test(rawUrl)) return rawUrl
  if (rawUrl.startsWith('/')) return `${cdnRoot.value}${rawUrl}`
  if (rawUrl) return `${cdnRoot.value}/${rawUrl.replace(/^\/+/, '')}`

  return `${cdnRoot.value}/img/cover/${item.title}.jpeg`
}

const collectionSections = computed(() => {
  return categories.map((category) => {
    const matchedItems = collections.value.filter((item) => item.tag === category.tag)

    return {
      ...category,
      count: matchedItems.length,
      items: matchedItems.slice(0, maxDisplayItems),
    }
  })
})

const openEditor = () => {
  router.push('/imgCut')
}

const redirectToCollection = (id: number) => {
  router.push(`/collections/${id}`)
}

onMounted(async () => {
  try {
    const response = await $fetch('/api/posts/collection/getCollectionInfo', {
      method: 'GET',
    })

    const result = Array.isArray(response) ? response : []
    collections.value = result.map((item: any) => ({
      id: Number(item.id),
      title: String(item.title || '未命名收藏'),
      time: String(item.posttime || ''),
      tag: String(item.tag || ''),
      imageUrl: resolveCoverUrl(item),
    }))
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.collection-page {
  color: var(--theme-text);
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.collection-header {
  align-items: center;
  display: flex;
  gap: 18px;
  justify-content: space-between;
}

.collection-header p,
.section-copy span {
  color: var(--theme-accent);
  font-size: 13px;
  letter-spacing: 0;
  margin: 0 0 4px;
}

.collection-header h1,
.section-copy h2,
.section-copy p {
  margin: 0;
}

.collection-header h1 {
  font-size: clamp(30px, 5vw, 46px);
}

.add-button {
  background: color-mix(in srgb, var(--theme-accent) 30%, transparent);
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 8px;
  color: var(--theme-text);
  cursor: pointer;
  font: inherit;
  padding: 10px 15px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

.add-button:hover {
  background: color-mix(in srgb, var(--theme-accent) 42%, transparent);
  box-shadow: 0 8px 24px var(--theme-shadow);
  transform: translateY(-2px);
}

.collection-state,
.collection-section {
  background: color-mix(in srgb, var(--theme-surface) 70%, var(--theme-background));
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  box-shadow: 0 12px 32px var(--theme-shadow);
  backdrop-filter: var(--theme-blur) saturate(145%);
}

.collection-state {
  padding: 28px;
  text-align: center;
}

.collection-sections {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.collection-section {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
  padding: clamp(16px, 2.4vw, 24px);
}

.section-copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-copy h2 {
  font-size: clamp(22px, 2.4vw, 30px);
}

.section-copy p,
.empty-text {
  color: var(--theme-text-secondary);
  line-height: 1.7;
}

.cover-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
}

.cover-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  color: var(--theme-text);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  font: inherit;
  gap: 8px;
  min-width: 0;
  padding: 8px;
  text-align: left;
  transition: background 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}

.cover-card:hover {
  background: color-mix(in srgb, var(--theme-accent) 18%, rgba(255, 255, 255, 0.08));
  box-shadow: 0 10px 24px var(--theme-shadow);
  transform: translateY(-3px);
}

.cover-card img {
  aspect-ratio: 3 / 4;
  background: rgba(0, 0, 0, 0.18);
  border-radius: 6px;
  height: auto;
  object-fit: cover;
  width: 100%;
}

.cover-card span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-text {
  margin: 0;
}

@media (max-width: 820px) {
  .collection-header,
  .collection-section {
    align-items: stretch;
    display: flex;
    flex-direction: column;
  }

  .add-button {
    width: 100%;
  }
}
</style>
