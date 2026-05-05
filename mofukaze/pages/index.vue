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
          <div v-html="`${article.content || ''}...`"></div>
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

  // 🌸 调试输出（你可以暂时留着）
  console.log('[latest-articles]', raw, Array.isArray(raw));

  if (!raw) return;

  // ⚠️ 如果接口是 { data: [...] } 结构
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as any).data)
      ? (raw as any).data
      : [];

  if (list.length === 0) return;

  displayedArticles.value = list.map((item: { id: any; title: any; posttime: any; content: any; }) => ({
    id: item.id,
    title: item.title,
    time: item.posttime,
    content: item.content ?? '',
    backgroundImage: images[Math.floor(Math.random() * images.length)],
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
  height: 220px;
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
  opacity: 0.85; /* ✨原本是 1，改成更透明但清晰的 0.85 */
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
