<template>
  <div class="container">
    <div
      v-for="(tag, index) in tags"
      :key="index"
      class="drawer"
    >
      <div class="drawer-header" @click="toggleDrawer(index)">
        <span>{{ tag.label }}</span>

        <!-- 标题右侧功能按钮 -->
<div class="drawer-actions" @click.stop>
  <button class="view-all" @click="redirectToArticleList(tag.value)">查看所有</button>
  <button  v-if="ifVisible" class="delete-all" @click="confirmDeleteAll(tag.value)">
  删除所有
</button>
</div>

      </div>

      <transition name="drawer-transition">
        <div
          v-if="activeDrawer === index"
          class="drawer-content"
        >
          <ul>
            <li
  v-for="(article, i) in getArticlesByTag(tag.value)"
  :key="article.id"
  @click="redirectToArticle(article.id)"
>
  <span class="article-title">
    {{ article.title }} 发布于 {{ article.time }}
  </span>

  <div class="article-actions" @click.stop>
    <button v-if="ifVisible" @click.stop="hideArticle(article)" class="hide-button">隐藏</button>
    <button v-if="ifVisible" @click.stop="editArticle(article)" class="edit-button">编辑</button>
    <button v-if="ifVisible" @click.stop="confirmDeleteArticle(tag.value, i)" class="delete-button">删除</button>
  </div>
</li>


            <!-- 如果刚好10条，显示查看更多 -->
            <li v-if="getArticlesByTag(tag.value).length === 10">
              <span class="ellipsis" @click="redirectToArticleList(tag.value)">
                查看更多...
              </span>
            </li>
          </ul>
        </div>
      </transition>
    </div>

  </div>
</template>
<script setup lang="ts">
import { ref, onMounted,computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const admin = useAdmin()

const tags = ref<{ label: string, value: string }[]>([])
const titles = ref<Record<string, { id:number, title:string, time:string, tag:string, content:string }[]>>({})
const activeDrawer = ref<number | null>(null)

// ⭐ 新增这句逻辑：根据 getAuthHeader() 是否存在决定是否能删除
const ifVisible = computed(() => !!admin.getAuthHeader())
// 页面加载
onMounted(async () => {
  // 检测管理员状态
  await admin.checkAdminStatus()

  // 拉取标签
  const rawTags = await $fetch('/api/posts/article/getAllTag')
  tags.value = rawTags.data
    .filter((t: { tag: string }) => t.tag && t.tag.trim() !== "")
    .map((t: { tag: string }) => ({ label: t.tag, value: t.tag }))

  // 拉取每个标签下的文章
  const articleMap: Record<string, any[]> = {}
  for (const tag of tags.value) {
    const res = await $fetch('/api/posts/article/getLatestArticlesByTag', {
      method: 'GET',
      query: { tag: tag.value }
    })
    articleMap[tag.value] = (res as any[]).map(item => ({
      id: item.id,
      title: item.title,
      time: item.posttime,
      tag: item.tag,
      content: item.content
    }))
  }
  titles.value = articleMap
})

/* ===============================
   ✨ 基础方法
=============================== */
const getArticlesByTag = (tag: string) => titles.value[tag] ?? []

const toggleDrawer = (index: number) => {
  activeDrawer.value = activeDrawer.value === index ? null : index
}

const redirectToArticle = (id: number) => {
  router.push(`/article/${id}`)
}

const redirectToArticleList = (tag: string) => {
  router.push({ path: '/List/articleList', query: { tag } })
}

/* ===============================
   ✏ 编辑文章
=============================== */
const editArticle = (article: { id: number, title: string, content: string, tag: string }) => {
  router.push({ path: `/edit/${article.id}`, query: { ...article } })
}

/* ===============================
   🗑 删除单篇文章
=============================== */
const confirmDeleteArticle = (tag: string, index: number) => {
  if (confirm('确定要删除这篇文章吗？'))
    deleteArticle(tag, index)
}

const deleteArticle = async (tag: string, index: number) => {
  const targetList = titles.value[tag]
  const id = targetList[index].id
  try {
    const res: any = await $fetch('/api/posts/article/deleteArticle', {
      method: 'DELETE',
      body: { id },
      headers: admin.getAuthHeader()
    })
    if (res) {
      targetList.splice(index, 1)
    } else {
      alert('删除失败：服务端返回空响应')
    }
  } catch (err: any) {
    if (err?.status === 403 || err?.statusCode === 403) {
      alert('没有管理员权限，无法删除文章')
    } else {
      alert('删除失败，请稍后重试')
      console.error('删除文章失败', err)
    }
  }
}

/* ===============================
   🗑 删除整个分类
=============================== */
const confirmDeleteAll = async (tag: string) => {
  if (!confirm(`确定要删除【${tag}】分类下的所有文章吗？此操作不可恢复！`))
    return
  try {
    const res: any = await $fetch('/api/posts/article/deleteArticlesByTag', {
      method: 'DELETE',
      body: { tag },
      headers: admin.getAuthHeader()
    })
    if (res) {
      delete titles.value[tag]
      alert(`已删除【${tag}】分类下的所有文章`)
    } else {
      alert('删除失败：服务端返回空响应')
    }
  } catch (err: any) {
    if (err?.status === 403 || err?.statusCode === 403) {
      alert('没有管理员权限，无法删除该分类下的文章')
    } else {
      alert('删除失败，请稍后重试')
      console.error('删除分类文章失败', err)
    }
  }
}
/* ===============================
   👁 隐藏文章
=============================== */
const hideArticle = async (article: { id: number }) => {
  if (!confirm(`确定要隐藏这篇文章吗？隐藏后仅管理员可见～`))
    return

  try {
    const res: any = await $fetch('/api/posts/article/editArticle', {
      method: 'PUT',
      body: {
        id: article.id,
        visible: false
      },
      headers: admin.getAuthHeader()
    })

    if (res) {
      alert('文章已成功隐藏！')
    } else {
      alert('隐藏失败：服务端返回空响应')
    }
  } catch (err: any) {
    console.error('隐藏文章失败', err)
    alert('隐藏失败，请稍后再试')
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
  color: var(--theme-text);
  text-shadow: 0 0 8px var(--theme-glow);
}

/* 🌫️ 抽屉外观：漂浮半透明玻璃 */
.drawer {
  width: 90%;
  max-width: 1720px;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-card);
  box-shadow: 0 14px 34px color-mix(in srgb, var(--theme-shadow) 58%, rgba(0, 0, 0, 0.16));
  border: 1px solid var(--border-soft);
  transition: all 0.4s ease;
}

.drawer:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 42px color-mix(in srgb, var(--theme-shadow) 70%, rgba(0, 0, 0, 0.18));
}

/* 🌸 抽屉标题 */
.drawer-header {
  padding: 14px 18px;
  background: color-mix(in srgb, var(--surface-reading) 46%, transparent);
  font-weight: 600;
  color: var(--theme-text);
  font-size: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.25s ease;
}

.drawer-header:hover {
  background: color-mix(in srgb, var(--theme-accent) 12%, var(--surface-reading));
}

/* ✨ 内容部分 */
.drawer-content {
  padding: 14px 20px 16px;
  background: transparent;
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
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface-reading) 56%, var(--surface-soft));
  border: 1px solid var(--border-soft);
  transition: all 0.3s ease;
  color: var(--theme-text);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

li:hover {
  background: color-mix(in srgb, var(--theme-accent) 14%, var(--surface-reading));
  box-shadow: 0 8px 22px var(--theme-shadow);
  transform: translateX(4px);
}

.ellipsis {
  text-align: center;
  cursor: pointer;
  color: var(--readable-muted);
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
  border: 1px solid var(--border-soft);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--theme-text);
  background: color-mix(in srgb, var(--theme-accent) 18%, var(--surface-soft));
  transition: all 0.35s ease;
}

.drawer-actions button:hover {
  background: color-mix(in srgb, var(--theme-accent) 28%, var(--surface-soft));
  box-shadow: 0 0 12px rgba(130, 180, 255, 0.4);
  transform: scale(1.05);
}

.view-all {
  border-color: color-mix(in srgb, var(--theme-accent) 38%, var(--border-soft));
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
.delete-button, .edit-button,.hide-button {
  border: 1px solid var(--border-soft);
  border-radius: 9999px;
  padding: 4px 12px;
  margin-left: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--theme-text);
  background: color-mix(in srgb, var(--theme-accent) 14%, var(--surface-soft));
  transition: all 0.3s ease;
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
.hide-button:hover {
  background-color: #777;
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


li {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 让标题占据左侧空间 */
.article-title {
  flex: 1;
}

/* 按钮容器：右对齐、紧凑排列 */
.article-actions {
  display: flex;
  gap: 6px; /* 控制紧凑程度 */
}


</style>
