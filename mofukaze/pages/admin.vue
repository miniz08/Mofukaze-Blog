<template>
  <section class="admin-dashboard">
    <header class="dashboard-header">
      <div>
        <p class="eyebrow">Mofukaze Admin</p>
        <h1>后台监控</h1>
      </div>
      <div class="header-actions">
        <button class="ghost-button" @click="navigateTo('/login')">
          管理员登录
        </button>
        <button class="primary-button" :disabled="isLoading || !isAuthorized" @click="loadSummary">
          刷新数据
        </button>
      </div>
    </header>

    <div v-if="admin.isLoading || isLoading" class="dashboard-state">
      正在整理博客的风向...
    </div>

    <div v-else-if="!isAuthorized" class="locked-panel">
      <ShieldCheck class="locked-icon" />
      <h2>需要管理员身份</h2>
      <p>后台统计、最新评论和访问趋势只在登录后展示。</p>
      <button class="primary-button" @click="navigateTo('/login')">
        去登录
      </button>
    </div>

    <template v-else-if="summary">
      <div class="stats-grid">
        <article
          v-for="card in statCards"
          :key="card.label"
          class="stat-card"
          :class="`tone-${card.tone}`"
        >
          <component :is="card.icon" class="stat-icon" />
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
          <small>{{ card.hint }}</small>
        </article>
      </div>

      <div class="dashboard-grid">
        <section class="panel trend-panel">
          <div class="panel-title">
            <Activity />
            <h2>近七日访问</h2>
          </div>
          <div class="trend-chart">
            <div
              v-for="item in summary.recentVisits"
              :key="item.day"
              class="trend-bar"
            >
              <div class="bar-track">
                <span
                  class="bar-fill visit-fill"
                  :style="{ height: `${getBarHeight(item.visits)}%` }"
                ></span>
                <span
                  class="bar-fill article-fill"
                  :style="{ height: `${getBarHeight(item.articleViews)}%` }"
                ></span>
              </div>
              <strong>{{ item.visits }}</strong>
              <small>{{ formatDay(item.day) }}</small>
            </div>
          </div>
          <div class="legend">
            <span><i class="visit-dot"></i>访问</span>
            <span><i class="article-dot"></i>文章浏览</span>
          </div>
        </section>

        <section class="panel">
          <div class="panel-title">
            <BarChart3 />
            <h2>主题分布</h2>
          </div>
          <div class="tag-list">
            <div v-for="tag in summary.tagStats" :key="tag.tag" class="tag-row">
              <span>{{ tag.tag }}</span>
              <div class="tag-meter">
                <i :style="{ width: `${getTagWidth(tag.count)}%` }"></i>
              </div>
              <strong>{{ tag.count }}</strong>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-title">
            <MessageSquare />
            <h2>最新评论</h2>
          </div>
          <div class="comment-list">
            <article v-for="comment in summary.latestComments" :key="comment.id" class="comment-item">
              <div class="comment-meta">
                <strong>{{ comment.name }}</strong>
                <span>{{ formatDate(comment.posttime) }}</span>
              </div>
              <p>{{ snippet(comment.content, 82) }}</p>
              <NuxtLink v-if="commentTarget(comment)" :to="commentTarget(comment)">
                {{ comment.article?.title || comment.collection?.title }}
              </NuxtLink>
            </article>
            <p v-if="summary.latestComments.length === 0" class="empty-text">
              暂时还没有评论。
            </p>
          </div>
        </section>

        <section class="panel">
          <div class="panel-title">
            <TrendingUp />
            <h2>热门文章</h2>
          </div>
          <div class="rank-list">
            <NuxtLink
              v-for="article in summary.popularArticles"
              :key="article.articleId"
              :to="`/article/${article.articleId}`"
              class="rank-item"
            >
              <span>{{ article.title }}</span>
              <strong>{{ article.views }} 次</strong>
            </NuxtLink>
            <p v-if="summary.popularArticles.length === 0" class="empty-text">
              访问统计会从现在开始累积。
            </p>
          </div>
        </section>

        <section class="panel latest-panel">
          <div class="panel-title">
            <Clock3 />
            <h2>最近文章</h2>
          </div>
          <div class="latest-list">
            <NuxtLink
              v-for="article in summary.latestArticles"
              :key="article.id"
              :to="`/article/${article.id}`"
              class="latest-item"
            >
              <span>{{ article.title }}</span>
              <small>{{ article.tag }} / {{ formatDate(article.posttime) }}</small>
            </NuxtLink>
          </div>
        </section>
      </div>
    </template>

    <div v-else-if="errorMessage" class="dashboard-state error-state">
      {{ errorMessage }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Activity,
  BarChart3,
  BookOpen,
  Clock3,
  Eye,
  FileText,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-vue-next'

type Summary = {
  totals: {
    articles: number
    publicArticles: number
    hiddenArticles: number
    collections: number
    comments: number
    visits: number
    articleViews: number
    todayVisits: number
    uniqueVisitors: number
  }
  recentVisits: Array<{ day: string; visits: number; articleViews: number }>
  tagStats: Array<{ tag: string; count: number }>
  popularArticles: Array<{ articleId: number; title: string; views: number }>
  latestArticles: Array<{ id: number; title: string; tag: string; posttime: string }>
  latestComments: Array<{
    id: number
    name: string
    content: string
    posttime: string
    article?: { id: number; title: string } | null
    collection?: { id: number; title: string } | null
  }>
}

const admin = useAdmin()
const summary = ref<Summary | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

const isAuthorized = computed(() => admin.isAdmin.value === true)

const formatNumber = (value: number) => new Intl.NumberFormat('zh-CN').format(value || 0)
const stripHtml = (value: string) => String(value || '').replace(/<[^>]*>/g, '').trim()

const snippet = (value: string, maxLength: number) => {
  const text = stripHtml(value)
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

const formatDate = (value: string | Date) => {
  if (!value) return '未知时间'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const formatDay = (value: string) => value.slice(5).replace('-', '/')

const statCards = computed(() => {
  if (!summary.value) return []
  const totals = summary.value.totals

  return [
    {
      label: '文章总数',
      value: formatNumber(totals.articles),
      hint: `公开 ${totals.publicArticles} / 隐藏 ${totals.hiddenArticles}`,
      icon: FileText,
      tone: 'blue',
    },
    {
      label: '总浏览',
      value: formatNumber(totals.articleViews),
      hint: '文章详情页累计浏览',
      icon: Eye,
      tone: 'pink',
    },
    {
      label: '总访问',
      value: formatNumber(totals.visits),
      hint: `今日 ${totals.todayVisits} 次`,
      icon: Activity,
      tone: 'mint',
    },
    {
      label: '访客',
      value: formatNumber(totals.uniqueVisitors),
      hint: '按浏览器访客标识统计',
      icon: Users,
      tone: 'violet',
    },
    {
      label: '评论',
      value: formatNumber(totals.comments),
      hint: '所有评论',
      icon: MessageSquare,
      tone: 'amber',
    },
    {
      label: '收藏',
      value: formatNumber(totals.collections),
      hint: '收藏条目总数',
      icon: BookOpen,
      tone: 'cyan',
    },
  ]
})

const maxVisitValue = computed(() => {
  if (!summary.value) return 1
  return Math.max(
    1,
    ...summary.value.recentVisits.flatMap((item) => [item.visits, item.articleViews]),
  )
})

const maxTagCount = computed(() => {
  if (!summary.value || summary.value.tagStats.length === 0) return 1
  return Math.max(...summary.value.tagStats.map((tag) => tag.count))
})

const getBarHeight = (value: number) => Math.max(8, Math.round((value / maxVisitValue.value) * 100))
const getTagWidth = (value: number) => Math.max(5, Math.round((value / maxTagCount.value) * 100))

const commentTarget = (comment: Summary['latestComments'][number]) => {
  if (comment.article?.id) return `/article/${comment.article.id}`
  if (comment.collection?.id) return `/collections/${comment.collection.id}`
  return ''
}

const loadSummary = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const res: any = await $fetch('/api/posts/analytics/adminSummary', {
      method: 'POST',
      headers: admin.getAuthHeader(),
    })

    if (res?.status !== 'success') {
      throw new Error(res?.message || '后台统计加载失败')
    }

    summary.value = res.data
  } catch (err: any) {
    errorMessage.value = err?.message || '后台统计加载失败'
    console.error('[admin-dashboard] 加载失败', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await admin.checkAdminStatus()
  if (isAuthorized.value) {
    await loadSummary()
  }
})

useSeoMeta({
  title: '后台监控 - Mofukaze',
})
</script>

<style scoped>
.admin-dashboard {
  color: var(--theme-text);
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-height: 64vh;
}

.dashboard-header {
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
  font-size: 34px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.primary-button,
.ghost-button {
  border: 1px solid rgba(255, 255, 255, 0.26);
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  padding: 10px 16px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

.primary-button {
  background: color-mix(in srgb, var(--theme-accent) 30%, transparent);
  color: var(--theme-text);
}

.ghost-button {
  background: color-mix(in srgb, var(--theme-surface) 80%, transparent);
  color: var(--theme-text);
}

.primary-button:hover:not(:disabled),
.ghost-button:hover {
  box-shadow: 0 8px 24px var(--theme-shadow);
  transform: translateY(-2px);
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.dashboard-state,
.locked-panel,
.panel,
.stat-card {
  background: var(--theme-surface);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 8px;
  box-shadow: 0 12px 32px var(--theme-shadow);
  backdrop-filter: var(--theme-blur) saturate(170%);
}

.dashboard-state {
  padding: 30px;
  text-align: center;
}

.error-state {
  color: #ff9aa8;
}

.locked-panel {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 42px 20px;
  text-align: center;
}

.locked-icon {
  color: var(--theme-accent);
  height: 44px;
  width: 44px;
}

.locked-panel p {
  color: var(--theme-text-secondary);
}

.stats-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.stat-card {
  min-height: 130px;
  overflow: hidden;
  padding: 16px;
  position: relative;
}

.stat-card::after {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.22), transparent 62%);
  content: "";
  inset: 0;
  opacity: 0.5;
  pointer-events: none;
  position: absolute;
}

.stat-card span,
.stat-card strong,
.stat-card small,
.stat-icon {
  position: relative;
  z-index: 1;
}

.stat-icon {
  height: 22px;
  width: 22px;
}

.stat-card span {
  color: var(--theme-text-secondary);
  display: block;
  font-size: 13px;
  margin-top: 18px;
}

.stat-card strong {
  display: block;
  font-size: 30px;
  margin-top: 4px;
}

.stat-card small {
  color: var(--theme-text-secondary);
  display: block;
  font-size: 12px;
  margin-top: 4px;
}

.tone-blue .stat-icon { color: #7ab4ff; }
.tone-pink .stat-icon { color: #ff8fbd; }
.tone-mint .stat-icon { color: #62e5bd; }
.tone-violet .stat-icon { color: #b7a5ff; }
.tone-amber .stat-icon { color: #ffd27a; }
.tone-cyan .stat-icon { color: #6ee7ff; }

.dashboard-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
}

.panel {
  padding: 18px;
}

.latest-panel {
  grid-column: 1 / -1;
}

.panel-title {
  align-items: center;
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.panel-title svg {
  color: var(--theme-accent);
  height: 20px;
  width: 20px;
}

.panel-title h2 {
  font-size: 20px;
}

.trend-chart {
  align-items: end;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(7, minmax(42px, 1fr));
  min-height: 210px;
}

.trend-bar {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bar-track {
  align-items: end;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  gap: 4px;
  height: 150px;
  padding: 7px;
  width: 42px;
}

.bar-fill {
  border-radius: 5px 5px 2px 2px;
  display: block;
  flex: 1;
  min-height: 8px;
  transition: height 0.45s ease;
}

.visit-fill {
  background: linear-gradient(180deg, var(--theme-accent), color-mix(in srgb, var(--theme-accent) 30%, transparent));
}

.article-fill {
  background: linear-gradient(180deg, #ff8fbd, rgba(255, 143, 189, 0.26));
}

.trend-bar strong {
  font-size: 14px;
}

.trend-bar small,
.legend span,
.empty-text {
  color: var(--theme-text-secondary);
}

.legend {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 10px;
}

.legend span {
  align-items: center;
  display: flex;
  gap: 6px;
  font-size: 12px;
}

.visit-dot,
.article-dot {
  border-radius: 50%;
  display: inline-block;
  height: 9px;
  width: 9px;
}

.visit-dot { background: var(--theme-accent); }
.article-dot { background: #ff8fbd; }

.tag-list,
.comment-list,
.rank-list,
.latest-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tag-row {
  align-items: center;
  display: grid;
  gap: 10px;
  grid-template-columns: 86px minmax(0, 1fr) 34px;
}

.tag-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-meter {
  background: rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  height: 10px;
  overflow: hidden;
}

.tag-meter i {
  background: linear-gradient(90deg, var(--theme-accent), var(--theme-secondary));
  border-radius: inherit;
  display: block;
  height: 100%;
}

.comment-item,
.rank-item,
.latest-item {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  color: inherit;
  padding: 12px;
  text-decoration: none;
}

.comment-meta,
.rank-item,
.latest-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.comment-meta span,
.latest-item small,
.comment-item p {
  color: var(--theme-text-secondary);
}

.comment-item p {
  font-size: 14px;
  line-height: 1.7;
  margin: 8px 0;
}

.comment-item a {
  color: var(--theme-accent);
  text-decoration: none;
}

.rank-item:hover,
.latest-item:hover,
.comment-item:hover {
  background: rgba(255, 255, 255, 0.14);
  box-shadow: 0 8px 20px var(--theme-shadow);
  transform: translateY(-1px);
}

.rank-item,
.latest-item,
.comment-item {
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

.rank-item span,
.latest-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-item strong {
  color: var(--theme-accent);
  flex: 0 0 auto;
}

.empty-text {
  font-size: 14px;
  padding: 10px 0;
}

@media (max-width: 1180px) {
  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .dashboard-header,
  .comment-meta,
  .rank-item,
  .latest-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .primary-button,
  .ghost-button {
    flex: 1;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .trend-chart {
    gap: 8px;
    grid-template-columns: repeat(7, minmax(30px, 1fr));
  }

  .bar-track {
    width: 32px;
  }
}
</style>
