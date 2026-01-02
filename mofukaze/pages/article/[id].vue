<template>
  <div class="article-page">
    <loading v-if="isLoading" />

    <div v-else class="article-layout">
      <!-- 文章主体 -->
      <article class="article-card">
        <header class="article-header">
          <div class="title-row">
            <h1 class="article-title">
              {{ title }}
            </h1>
            <button v-if="ifVisible" @click="editArticle" class="cite-button" title="编辑本文">
              <span class="cite-icon">✏️</span>
              <span class="cite-text">编辑本文</span>
            </button>
          </div>

          <div class="article-meta">
            <div class="meta-item" v-if="formattedPosttime">
              <span class="meta-icon">🕒</span>
              <span class="meta-label">发布于</span>
              <span class="meta-text">{{ formattedPosttime }}</span>
            </div>

            <div class="meta-item" v-if="views !== null">
              <span class="meta-icon">👁</span>
              <span class="meta-label">浏览</span>
              <span class="meta-text">{{ views }}</span>
            </div>
          </div>
        </header>

        <section class="article-content" v-html="content"></section>
      </article>

      <!-- 评论区 -->
      <section class="comment-section">
        <h2 class="comment-title">评论</h2>
        <div id="commentAera">
          <div
            v-for="comment in comments"
            :key="comment.id"
            :class="['comment-item', { 'owner-comment': comment.isOwner }]"
          >
            <div class="comment-header">
              <span class="comment-name">{{ comment.name }}</span>
              <span class="comment-time">{{ comment.posttime }}</span>
            </div>
            <p class="comment-content">{{ comment.content }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

const content = ref<string>('');
const title = ref<string>('');
const posttime = ref<string>('');
const views = ref<number | null>(null);

const router = useRouter()
const route = useRoute();
// ⭐ 导入管理员状态管理
const admin = useAdmin()

// ⭐ 新增管理员可见性判断
const ifVisible = computed(() => !!admin.getAuthHeader())

// ... 其他现有代码 ...

// 替换 copyArticleLink 函数为 editArticle 函数
const editArticle = () => {
  const articleId = Number(route.params.id);
  router.push({ 
    path: `/edit/${articleId}`, 
    query: { 
      id: articleId,
      title: title.value,
      content: content.value,
      // 如果有其他必要参数也可以添加
    } 
  });
};
const formattedPosttime = computed(() => {
  if (!posttime.value) return '';
  const date = new Date(posttime.value);
  if (Number.isNaN(date.getTime())) return posttime.value;
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  const hh = `${date.getHours()}`.padStart(2, '0');
  const mm = `${date.getMinutes()}`.padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
});

// 复制文章引用链接
const copyArticleLink = async () => {
  // 确保在客户端环境
  if (!process.client) return;
  
  const articleId = Number(route.params.id);
  const articleTitle = title.value;
  // 生成Markdown格式的链接，这样在富文本编辑器中会自动转换为可点击的链接
  const linkMarkdown = `[${articleTitle}](http://mofukaze.me/article/${articleId})`;
  
  try {
    await navigator.clipboard.writeText(linkMarkdown);
    // 可选：显示复制成功的提示
    alert('引用链接已复制到剪贴板！');
  } catch (err) {
    console.error('复制失败:', err);
    // 降级方案：使用传统方法
    const textArea = document.createElement('textarea');
    textArea.value = linkMarkdown;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('引用链接已复制到剪贴板！');
  }
};

const fetchArticleContent = async (id: number) => {
  const response = await $fetch(`/api/posts/article/findArticleByID?id=${id}`, {
    method: 'GET',
  });
  const result = response as any[];
  if (result && result.length) {
    const article = result[0];
    title.value = article.title;
    content.value = article.content;
    posttime.value = article.posttime || '';
    // 预留浏览量字段，如果后端暂未实现则保持为空
    views.value = typeof article.views === 'number' ? article.views : null;
  }
};

const comments = ref<any[]>([]); // 评论列表

// 加载评论
const loadComments = async (articleId: number) => {
  const response = await fetch(`/api/posts/loadComments?articleId=${articleId}`);
  const data = await response.json();
  comments.value = data.comments || [];
};

const isLoading = ref(true);

onMounted(async () => {
  const articleId = Number(route.params.id);
  if (!Number.isNaN(articleId)) {
    await Promise.all([
      fetchArticleContent(articleId),
      loadComments(articleId),
    ]);
  }
  isLoading.value = false;
});
</script>

<style scoped>
.article-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.article-layout {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.article-card {
  padding: 28px 32px;
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(246, 248, 252, 0.96));
  box-shadow:
    0 12px 30px rgba(15, 23, 42, 0.18),
    0 0 0 1px rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(10px);
}

.article-header {
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.35);
  padding-bottom: 16px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.article-title {
  margin: 0;
  flex: 1;
  font-size: 26px;
  line-height: 1.35;
  letter-spacing: 0.03em;
}

.cite-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.25);
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.cite-button:hover {
  background: rgba(148, 163, 184, 0.15);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(148, 163, 184, 0.2);
}

.cite-icon {
  font-size: 14px;
}

.cite-text {
  opacity: 0.9;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  font-size: 13px;
  color: #64748b;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.1);
}

.meta-icon {
  font-size: 14px;
}

.meta-label {
  font-weight: 600;
}

.meta-text {
  opacity: 0.9;
}

.article-content :deep(*) {
  line-height: 1.8;
}

.article-content :deep(p) {
  margin: 0 0 1em;
  font-size: 15px;
}

.article-content :deep(h2),
.article-content :deep(h3),
.article-content :deep(h4) {
  margin: 1.4em 0 0.6em;
  font-weight: 600;
}

.article-content :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: rgba(15, 23, 42, 0.06);
}

.article-content :deep(pre) {
  padding: 12px 14px;
  border-radius: 10px;
  background: #0f172a;
  color: #e5e7eb;
  overflow-x: auto;
  font-size: 13px;
}

.comment-section {
  padding: 22px 24px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow:
    0 8px 22px rgba(15, 23, 42, 0.15),
    0 0 0 1px rgba(148, 163, 184, 0.16);
}

.comment-title {
  margin: 0 0 16px;
  font-size: 18px;
}

.comment-item {
  padding: 12px 14px;
  border-radius: 12px;
  background-color: rgba(248, 250, 252, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.25);
  margin-bottom: 10px;
}

.comment-item.owner-comment {
  border-color: #0ea5e9;
  background: rgba(224, 242, 254, 0.9);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
  font-size: 13px;
}

.comment-name {
  font-weight: 600;
}

.comment-time {
  color: #94a3b8;
}

.comment-content {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .article-card {
    padding: 20px 18px;
  }

  .article-title {
    font-size: 22px;
  }

  .cite-button {
    padding: 6px 10px;
    font-size: 12px;
  }

  .cite-text {
    display: none; /* 移动端只显示图标 */
  }

  .comment-section {
    padding: 18px 16px;
  }
}
</style>
