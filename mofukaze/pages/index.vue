<template>
  <div class="container">
    <!-- 骨架屏 -->
    <div v-if="isLoading" class="skeleton-list">
      <div class="skeleton-item" v-for="n in 10" :key="n"></div>
    </div>

    <!-- 文章列表 -->
    <ol v-else class="article-list">
      <li 
        v-for="(article, index) in displayedArticles" 
        :key="article.id" 
        class="article-item"
      >
        <div class="background-image" :style="{ backgroundImage: `url(${article.backgroundImage})` }"></div>
        <div class="content" @click="redirectToArticle(index)">
          <div class="article-summary">
            <h2>{{ article.title }}</h2>
            <p>{{ article.content || '这篇文章暂时没有摘要。' }}</p>
            <time>发布于 {{ formatDate(article.time) }}</time>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const config = useRuntimeConfig()

const images = [
  `${config.public.cdn}/img/background/a2/ca/a2cadad60c62eda89084a438c41b3c3233ec6d6d3a1d79e80501cee29f1530b3`,
  `${config.public.cdn}/img/background/10/f8/10f8215f15dc41515f0afc1cf04bf6418550d1e12a1b3d1a221f9cfdd0636cc3`,
  `${config.public.cdn}/img/background/e2/0e/e20e5c4fa3483304b1622ce51c6889245bb80b5ecd40ef4d1848b81471489669`,
  `${config.public.cdn}/img/background/2e/72/2e72de9d1f62da957faf425651cfbd25eda67f52042cd3700933885e354adb85`,
  `${config.public.cdn}/img/background/3c/57/3c57cebf829ca714893c04e749d86994077acb007065899806c51918745280bc`,
  `${config.public.cdn}/img/background/be/e7/bee7495a2cacdcd24c92b95c76fa468da8ee7e83116e203c68151bf808d35a13`,
  `${config.public.cdn}/img/background/33/0e/330e28a25796f1ec76a37f175ac5e0b8f34654034946bc3fd41925e91aee53ba`,
  `${config.public.cdn}/img/background/bb/de/bbde2af06df07842188194c382e586cfb15d196a692bca8fc72966d3a1c5bb23`,
  `${config.public.cdn}/img/background/1b/ad/1bad9fb4a8876112869e8b36b9c2f8a2849d8ad39cd3ed0038739a145f32b742`,
  `${config.public.cdn}/img/background/c2/b9/c2b9aacdee92f2f6b41beeb7133009d73592f9b9e23dd73cf48fd6effa70a6fb`,
  `${config.public.cdn}/img/background/95/57/9557d4004c675058bd27e034b6215331ceff0d52dc97bb3a33ba988e2e3351e3`,
  `${config.public.cdn}/img/background/a6/c6/a6c6730fbb9f2cfc4d01d8c71029a17f918a7ad058211e399f475867c893ef8c`,
  `${config.public.cdn}/img/background/25/ef/25ef476fb8d72312d6dff34df9f24473eda39aa4fbcee7c24e7cda81c76768de`,
  `${config.public.cdn}/img/background/00/bb/00bb1a232878aa32e799948813e5358a34ed97f67186150237956eb2ffe5faf8`,
  `${config.public.cdn}/img/background/8f/dd/8fdd02bf5f87143775dc3012aa742eabc63f3da5a5f51a902e8e8ca4b8f01456`,
  `${config.public.cdn}/img/background/c8/61/c861167c7e5ab260e1ff10bb22a88ddb915eefa2fe465a50ccc0dd029505fe43`,
  `${config.public.cdn}/img/background/29/59/295999c9295038f44c34c46940c0d43114afeb840ea1dd3803687cec997f2a8c`,
];



const displayedArticles = ref<{ 
  id: number, 
  title: string, 
  time: string, 
  content: string, 
  backgroundImage: string 
}[]>([]);

const summarizeArticleContent = (content: string) => {
  const text = String(content || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text.length > 128 ? `${text.slice(0, 128)}...` : text
}

const pickBackgroundImage = (id: unknown, index: number) => {
  const source = String(id || index)
  const hash = source.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return images[Math.abs(hash) % images.length]
}

const { pending: isLoading, data: articlesData } = await useAsyncData(
  'latest-articles',
  async () => {
    const data = await $fetch('/api/posts/article/getLatestArticles');
    if (import.meta.client) {
      sessionStorage.setItem('latest-articles', JSON.stringify(data));
    }
    return data;
  },
  {
    getCachedData: (key) => {
      if (import.meta.client) {
        const cached = sessionStorage.getItem(key);
        if (cached) return JSON.parse(cached);
      }
      return null;
    },
    // 🚀 不要重复请求（SSR 已加载过的直接复用）
    server: true,
  }
);

watchEffect(() => {
  const raw = articlesData.value;

  if (!raw) return;

  // ⚠️ 如果接口是 { data: [...] } 结构
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as any).data)
      ? (raw as any).data
      : [];

  if (list.length === 0) return;

  displayedArticles.value = list.map((item: { id: any; title: any; posttime: any; content: any; }, index: number) => ({
    id: item.id,
    title: item.title,
    time: item.posttime,
    content: summarizeArticleContent(item.content ?? ''),
    backgroundImage: pickBackgroundImage(item.id, index),
  }));
});




// 预加载背景图（延迟执行，避免阻塞）
onMounted(() => {
  // 使用 requestIdleCallback 或 setTimeout 延迟执行，不阻塞渲染
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      images.forEach(url => {
        const img = new Image();
        img.src = url;
      });
    });
  } else {
    setTimeout(() => {
      images.forEach(url => {
        const img = new Image();
        img.src = url;
      });
    }, 100);
  }
});

const redirectToArticle = (index: number) => {
  const articleId = displayedArticles.value[index].id;
  router.push(`/article/${articleId}`);
};

const formatDate = (value: string | Date) => {
  if (!value) return '未知时间'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}
</script>

<style scoped>
.container {
  padding: 8px 0;
}

/* 骨架屏 */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.skeleton-item {
  height: 220px;
  border-radius: 5px;
  background: linear-gradient(90deg, var(--surface-card) 25%, var(--surface-soft) 37%, var(--surface-card) 63%);
  background-size: 400% 100%;
  animation: shine 1.2s infinite linear;
}
@keyframes shine {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  list-style-type: none;
  padding: 0;
}

.article-item {
  cursor: pointer;
  min-height: 156px;
  background: var(--surface-card);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  box-shadow: 0 14px 34px color-mix(in srgb, var(--theme-shadow) 65%, rgba(0, 0, 0, 0.18));
  overflow: hidden;
  position: relative;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  z-index: 1;
}

.background-image::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(
      90deg,
      var(--surface-reading) 0%,
      color-mix(in srgb, var(--surface-reading) 90%, transparent) 58%,
      color-mix(in srgb, var(--surface-reading) 38%, transparent) 100%
    );
  transition: all 0.2s ease-in-out;
  opacity: 0.96;
  z-index: 2;
}


.article-item:hover .background-image::before {
  background:
    linear-gradient(
      90deg,
      var(--surface-reading) 0%,
      color-mix(in srgb, var(--surface-reading) 78%, transparent) 48%,
      color-mix(in srgb, var(--surface-reading) 16%, transparent) 100%
    );
  opacity: 0.96;
  transition: all 0.8s ease-in-out;
}

.content {
  align-items: center;
  color: var(--theme-text);
  display: flex;
  min-height: 156px;
  padding: 20px 22px;
  position: relative;
  z-index: 3;
}

.article-summary {
  min-width: 0;
  width: min(760px, 78%);
}

.article-summary h2 {
  color: var(--theme-text);
  font-size: clamp(21px, 2.8vw, 31px);
  line-height: 1.2;
  margin: 0 0 8px;
}

.article-summary p {
  color: var(--readable-muted);
  line-height: 1.7;
  margin: 0;
  max-width: 760px;
}

.article-summary time {
  color: color-mix(in srgb, var(--theme-accent) 76%, var(--theme-text));
  display: inline-block;
  font-size: 13px;
  margin-top: 12px;
}

.article-item:hover {
  border-color: color-mix(in srgb, var(--theme-accent) 34%, var(--border-soft));
  box-shadow: 0 18px 42px color-mix(in srgb, var(--theme-shadow) 72%, rgba(0, 0, 0, 0.22));
  transform: translateY(-2px);
}

.article-item:active {
  transform: translateY(0);
}

@media (max-width: 640px) {
  .content {
    padding: 18px;
  }

  .article-summary {
    width: 100%;
  }
}
</style>
