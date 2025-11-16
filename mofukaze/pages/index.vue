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
          <div id="title">{{ article.title }}</div>
          <div v-html="article.content + '...'"></div>
          <pre></pre>发布于 {{ article.time }}
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
  `${config.public.cdn}/img/background/00.webp`,
  `${config.public.cdn}/img/background/01.webp`,
  `${config.public.cdn}/img/background/02.webp`,
  `${config.public.cdn}/img/background/03.webp`,
  `${config.public.cdn}/img/background/04.webp`,
  `${config.public.cdn}/img/background/05.webp`,
  `${config.public.cdn}/img/background/06.webp`,
 `${config.public.cdn}/img/background/07.webp`,
  `${config.public.cdn}/img/background/08.webp`,
   `${config.public.cdn}/img/background/09.webp`,
    `${config.public.cdn}/img/background/10.webp`,
     `${config.public.cdn}/img/background/11.webp`,
      `${config.public.cdn}/img/background/12.webp`,
       `${config.public.cdn}/img/background/13.webp`,
        `${config.public.cdn}/img/background/14.webp`,
         `${config.public.cdn}/img/background/15.webp`,
          `${config.public.cdn}/img/background/17.webp`,
]


const displayedArticles = ref<{ 
  id: number, 
  title: string, 
  time: string, 
  content: string, 
  backgroundImage: string 
}[]>([]);

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
  if (articlesData.value) {
    displayedArticles.value = articlesData.value.map(item => ({
      id: item.id,
      title: item.title,
      time: item.posttime,
      content: item.content || '',
      backgroundImage: images[Math.floor(Math.random() * images.length)],
    }));
  }
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
</script>

<style scoped>
.container {
  padding: 20px;
}

/* 骨架屏 */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.skeleton-item {
  height: 100px;
  border-radius: 5px;
  background: linear-gradient(90deg, #eee 25%, #f5f5f5 37%, #eee 63%);
  background-size: 400% 100%;
  animation: shine 1.2s infinite linear;
}
@keyframes shine {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.article-list {
  list-style-type: none;
  padding: 0;
}

.article-item {
  position: relative;
  cursor: pointer;
  padding: 10px 15px;
  margin: 10px 0;
  border-radius: 5px;
  transition: transform 0.2s ease;
  overflow: hidden;
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
  background: linear-gradient(90deg, rgba(255, 255, 255, 1) 100%, rgba(255, 255, 255, 0) 100%);
  transition: all 0.2s ease-in-out;
  opacity: 1;
  z-index: 2;
}

.article-item:hover .background-image::before {
  background: linear-gradient(90deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%);
  opacity: 0.8;
  transition: all 0.8s ease-in-out;
}

.content {
  position: relative;
  z-index: 3;
}

.article-item:hover {
  transform: scale(1.02);
}

.article-item:active {
  transform: scale(0.98);
}

.article-item + .article-item {
  margin-top: 10px;
}

#title {
  font-size: larger;
  font-weight: bold;
}
</style>
