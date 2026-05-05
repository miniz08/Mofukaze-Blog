import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const VISITOR_KEY = 'mofukaze_visitor_id'
const SESSION_KEY = 'mofukaze_session_id'

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getStoredId(storage: Storage, key: string, prefix: string) {
  const existing = storage.getItem(key)
  if (existing) return existing

  const next = createId(prefix)
  storage.setItem(key, next)
  return next
}

function getArticleIdFromPath(path: string) {
  const match = path.match(/^\/article\/(\d+)/)
  return match ? Number(match[1]) : null
}

export const useVisitTracker = () => {
  const route = useRoute()

  const sendVisit = async () => {
    if (!import.meta.client) return
    if (route.path === '/login' || route.path.startsWith('/admin')) return

    const visitorId = getStoredId(localStorage, VISITOR_KEY, 'visitor')
    const sessionId = getStoredId(sessionStorage, SESSION_KEY, 'session')
    const articleId = getArticleIdFromPath(route.path)

    try {
      await $fetch('/api/posts/analytics/trackVisit', {
        method: 'POST',
        body: {
          path: route.fullPath,
          articleId,
          visitorId,
          sessionId,
          referrer: document.referrer || null,
        },
      })
    } catch (err) {
      console.warn('[visit-tracker] 访问统计上报失败', err)
    }
  }

  onMounted(() => {
    sendVisit()
  })

  watch(
    () => route.fullPath,
    () => {
      window.setTimeout(sendVisit, 160)
    },
  )
}
