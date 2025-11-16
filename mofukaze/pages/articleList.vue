<template>
  <div class="container">

    <loading v-if="isLoading" />

    <div v-for="(tag, index) in tags" :key="index" class="drawer">
      <div class="drawer-header" @click="toggleDrawer(index)">
        <span>{{ tag.label }}</span>

        <!-- 标题右侧功能按钮 -->
        <div class="drawer-actions" @click.stop>
          <button class="view-all" @click="redirectToArticleList(tag.value)">查看所有</button>
          <button class="delete-all" @click="confirmDeleteAll(tag.value)">删除所有</button>
        </div>
      </div>

      <transition name="drawer-transition">
        <div v-if="activeDrawer === index" class="drawer-content">
          <ul>
            <li
              v-for="(article, i) in getArticlesByTag(tag.value)"
              :key="i"
              @click="redirectToArticle(article.id)"
            >
              {{ article.title }} 发布于 {{ article.time }}
              <button @click.stop="editArticle(article)" class="edit-button">编辑</button>
              <button @click.stop="confirmDeleteArticle(i)" class="delete-button">删除</button>
            </li>

            <li v-if="getArticlesByTag(tag.value).length === 10">
              <span class="ellipsis" @click="redirectToArticleList(tag.value)">查看更多...</span>
            </li>
          </ul>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const isLoading = ref(true)
const titles = ref<{ id: number, title: string, time: string, tag: string }[]>([])
const activeDrawer = ref<number | null>(null)

const tags = [
  { label: '随笔', value: '随笔' },
  { label: '小说', value: '小说' },
  { label: '记录', value: '记录' },
]

const router = useRouter()

// 获取每个标签最新的10篇文章
onMounted(async () => {
  const allArticles: any[] = []
  for (const tag of tags) {
    const res = await $fetch('/api/posts/article/getLatestArticlesByTag', {
      method: 'GET',
      query: { tag: tag.value },
    })
    allArticles.push(...(res as any[]).map(item => ({
      id: item.id,
      title: item.title,
      time: item.posttime,
      tag: item.tag,
      content: item.content,
    })))
  }
  titles.value = allArticles
  isLoading.value = false
})

const getArticlesByTag = (tag: string) => titles.value.filter(a => a.tag === tag)
const toggleDrawer = (index: number) => activeDrawer.value = activeDrawer.value === index ? null : index
const redirectToArticle = (id: number) => router.push(`/article/${id}`)

const redirectToArticleList = (tag: string) => {
  router.push({
    path: '/List/articleList',
    query: { tag },
  })
}

const editArticle = (article: { id: number, title: string, content: string, tag: string }) => {
  router.push({
    path: `/edit/${article.id}`,
    query: { ...article }
  })
}

const confirmDeleteArticle = (index: number) => {
  if (confirm('确定要删除这篇文章吗？')) deleteArticle(index)
}

const deleteArticle = async (index: number) => {
  const id = titles.value[index].id
  const res = await $fetch('/api/posts/article/deleteArticle', {
    method: 'DELETE',
    body: { id },
  })
  if (res) titles.value.splice(index, 1)
  else alert('删除失败')
}

const confirmDeleteAll = async (tag: string) => {
  if (!confirm(`确定要删除【${tag}】分类下的所有文章吗？此操作不可恢复！`)) return
  const res = await $fetch('/api/posts/article/deleteArticlesByTag', {
    method: 'DELETE',
    body: { tag },
  })
  if (res) {
    titles.value = titles.value.filter(a => a.tag !== tag)
    alert(`已删除【${tag}】分类下的所有文章`)
  } else {
    alert('删除失败')
  }
}
</script>



<style scoped>
.container {
  padding: 30px;
  font-family: "HarmonyOS Sans", "Noto Sans SC", sans-serif;
  background: transparent;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: "喵字摄影体";
  align-items: center;
}

.page-title {
  margin-bottom: 28px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 0 8px rgba(173, 216, 255, 0.35);
  backdrop-filter: blur(4px);
}

/* 🌫️ 抽屉外观：漂浮半透明玻璃 */
.drawer {
  width: 90%;
  max-width: 1720px;
  margin-bottom: 20px;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 6px 24px rgba(30, 90, 180, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.4s ease;
}

.drawer:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(80, 150, 255, 0.25);
}

/* 🌸 抽屉标题 */
.drawer-header {
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.05);
  font-weight: 600;
  color: rgba(16, 16, 17, 0.95);
  font-size: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.25s ease;
}

.drawer-header:hover {
  background: rgba(255, 255, 255, 0.12);
}

/* ✨ 内容部分 */
.drawer-content {
  padding: 14px 20px 16px;
  background: transparent;
  backdrop-filter: blur(10px);
}

/* 列表 */
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* 🌙 文章项 */
li {
  padding: 10px 12px;
  margin-bottom: 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  transition: all 0.3s ease;
  color: rgba(11, 11, 11, 0.9);
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(6px);
}

li:hover {
  background: rgba(180, 210, 255, 0.15);
  box-shadow: 0 0 10px rgba(100, 160, 255, 0.25);
  transform: translateX(4px);
}

.ellipsis {
  text-align: center;
  cursor: pointer;
  color: rgba(200, 220, 255, 0.7);
  font-style: italic;
  margin-top: 6px;
  transition: color 0.3s ease;
}
.ellipsis:hover {
  color: #82b4ff;
  text-shadow: 0 0 6px rgba(130, 180, 255, 0.5);
}

/* ✨ 顶部操作按钮 */
.drawer-actions button {
  margin-left: 8px;
  padding: 4px 14px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: rgb(10, 9, 9);
  background: rgba(120, 160, 255, 0.25);
  transition: all 0.35s ease;
  backdrop-filter: blur(10px);
}

.drawer-actions button:hover {
  background: rgba(120, 170, 255, 0.45);
  box-shadow: 0 0 12px rgba(130, 180, 255, 0.4);
  transform: scale(1.05);
}

.view-all {
  border-color: rgba(140, 180, 255, 0.4);
}

.delete-all {
  background: rgba(255, 120, 120, 0.25);
  border-color: rgba(255, 160, 160, 0.4);
}

.delete-all:hover {
  background: rgba(255, 130, 130, 0.45);
  box-shadow: 0 0 12px rgba(255, 140, 140, 0.4);
}

/* 🧊 编辑/删除小按钮 */
.delete-button, .edit-button {
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  padding: 4px 12px;
  margin-left: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: rgba(9, 8, 8, 0.9);
  background: rgba(150, 180, 255, 0.15);
  transition: all 0.3s ease;
  backdrop-filter: blur(6px);
}

.delete-button:hover {
  background: rgba(255, 140, 140, 0.35);
  box-shadow: 0 0 8px rgba(255, 120, 120, 0.4);
  transform: scale(1.05);
}

.edit-button:hover {
  background: rgba(140, 180, 255, 0.35);
  box-shadow: 0 0 8px rgba(120, 160, 255, 0.4);
  transform: scale(1.05);
}

/* ✨ 动画 */
.drawer-transition-enter-active,
.drawer-transition-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-transition-enter-from,
.drawer-transition-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}
.drawer-transition-enter-to,
.drawer-transition-leave-from {
  max-height: 600px;
  opacity: 1;
  transform: translateY(0);
}
</style>

