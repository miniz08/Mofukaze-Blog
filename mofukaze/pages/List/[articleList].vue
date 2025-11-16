<template>
  <div class="container">
    <button @click="toggleQuickReadMode" class="quick-read-toggle">
      {{ isQuickReadMode ? '退出快速阅读模式' : '进入快速阅读模式' }}
    </button>

    <!-- 快速阅读模式 -->
    <div v-if="isQuickReadMode" class="quick-read-container">
      <div class="quick-read-sidebar">
        <div v-for="(articles, subtag) in groupedArticlesBySubtag" :key="subtag" class="subtag-section">
          <h2>{{ subtag }}</h2>
          <ul>
            <li
              v-for="article in articles"
              :key="article.id"
              @click="loadArticleContent(article.id)"
              :class="{ active: article.id === currentArticleId }"
            >
              {{ article.title }} 发布于 {{ article.time }}
            </li>
          </ul>
        </div>
      </div>

      <div class="quick-read-display">
        <div v-html="currentArticleContent" class="article-content"></div>
      </div>
    </div>

    <!-- 普通文章列表模式 -->
    <div v-else>
      <div v-for="(articles, subtag) in groupedArticlesBySubtag" :key="subtag" class="subtag-section">
        <h2 @click="toggleSubtag(subtag)">
          {{ subtag }} <span>{{ isSubtagCollapsed[subtag] ? '▼' : '▲' }}</span>
        </h2>
        <transition
          @before-enter="beforeEnter"
          @enter="enter"
          @after-enter="afterEnter"
          @before-leave="beforeLeave"
          @leave="leave"
          @after-leave="afterLeave"
        >
          <ul v-if="isSubtagCollapsed[subtag]" class="drawer-list">
            <li
              v-for="article in articles"
              :key="article.id"
            >
              <span @click="redirectToArticle(article.id)">
                {{ article.title }} 发布于 {{ article.time }}
              </span>
              <button @click.stop="confirmDeleteArticle(article.id)" class="delete-button">删除</button>
              <button @click.stop="editArticle(article)" class="edit-button">编辑</button>
            </li>
          </ul>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ============================================================
// 🪐 Import & Router Setup
// ============================================================
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAsyncData } from '#imports';

const router = useRouter();
const route = useRoute();


// ============================================================
// 💾 Reactive State Variables
// ============================================================
const isQuickReadMode = ref(false);

const currentTag = ref(route.query.tag || '小说'); // 默认显示小说
const currentArticleId = ref<number | null>(null);
const currentArticleContent = ref<string>('');

const titles = ref<any[]>([]);
const groupedArticlesBySubtag = ref<{ [key: string]: any[] }>({});
const isSubtagCollapsed = ref<{ [key: string]: boolean }>({});
const hasGrouped = ref(false);


// ============================================================
// 🧭 Mode & View Toggle
// ============================================================
const toggleQuickReadMode = () => {
  isQuickReadMode.value = !isQuickReadMode.value;
  if (isQuickReadMode.value && !hasGrouped.value) {
    groupArticlesBySubtag();
  }
};

const toggleSubtag = (subtag: string) => {
  isSubtagCollapsed.value[subtag] = !isSubtagCollapsed.value[subtag];
};


// ============================================================
// 🎞 Transition Animation Hooks
// ============================================================
const beforeEnter = (el: Element) => {
  (el as any).style.height = '0';
  (el as any).style.opacity = '0';
};

const enter = (el: Element) => {
  const e = el as any;
  e.style.transition = 'all 0.3s ease';
  e.style.height = e.scrollHeight + 'px';
  e.style.opacity = '1';
};

const afterEnter = (el: Element) => {
  const e = el as any;
  e.style.height = 'auto';
  e.style.transition = '';
};

const beforeLeave = (el: Element) => {
  const e = el as any;
  e.style.height = e.scrollHeight + 'px';
  e.style.opacity = '1';
};

const leave = (el: Element) => {
  const e = el as any;
  e.style.transition = 'all 0.3s ease';
  e.style.height = '0';
  e.style.opacity = '0';
};

const afterLeave = (el: Element) => {
  (el as any).style.transition = '';
};


// ============================================================
// 📚 CRUD Operations (加载 / 编辑 / 删除 / 分组)
// ============================================================

// 加载文章内容（快速阅读模式）
const loadArticleContent = async (id: number) => {
  if (currentArticleId.value === id) return;
  currentArticleId.value = id;

  const response = await $fetch('/api/posts/article/findArticleByID', {
    method: 'GET',
    query: { id },
  });

  const result = response as any[];
  currentArticleContent.value = result[0]?.content || '<p>加载失败</p>';
};

// 跳转文章详情
const redirectToArticle = (id: number) => {
  router.push(`/article/${id}`);
};

// 编辑文章
const editArticle = (article: any) => {
  router.push({ path: `/edit/${article.id}`, query: { id: article.id } });
};

// 删除文章
const confirmDeleteArticle = (id: number) => {
  if (confirm('你确定要删除这篇文章吗？这将不可撤销。')) {
    deleteArticle(id);
  }
};

const deleteArticle = async (id: number) => {
  const index = titles.value.findIndex(a => a.id === id);
  if (index === -1) {
    alert('未找到文章');
    return;
  }

  const response = await $fetch('/api/posts/article/deleteArticle', {
    method: 'DELETE',
    body: { id },
  });

  if (response) {
    titles.value.splice(index, 1);
    groupArticlesBySubtag();
  } else {
    alert('删除失败');
  }
};


// ============================================================
// 🧩 Grouping & Sorting Articles
// ============================================================
const groupArticlesBySubtag = () => {
  groupedArticlesBySubtag.value = {};
  isSubtagCollapsed.value = {};

  titles.value.forEach(article => {
    const subtag = article.subtag || '未分类';
    if (!groupedArticlesBySubtag.value[subtag]) {
      groupedArticlesBySubtag.value[subtag] = [];
      isSubtagCollapsed.value[subtag] = false;
    }
    groupedArticlesBySubtag.value[subtag].push(article);
  });

  // 子标签内排序（按标题）
  Object.keys(groupedArticlesBySubtag.value).forEach(subtag => {
    groupedArticlesBySubtag.value[subtag].sort((a, b) =>
      new Intl.Collator().compare(a.title, b.title)
    );
  });

  hasGrouped.value = true;
};


// ============================================================
// 🌐 Fetch Articles List (根据 tag 响应式更新)
// ============================================================
const { data: articleData } = await useAsyncData(
  () => $fetch('/api/posts/article/getArticlesByTag', { query: { tag: currentTag.value } }),
  {
    server: true,
    default: () => [],
    watch: [currentTag], // CSR 时自动刷新
  }
);

watch(articleData, (list) => {
  console.log('Fetched articles:', list);
  titles.value = list.map(item => ({
    id: item.id,
    title: item.title,
    time: item.posttime,
    tag: item.tag,
    subtag: item.subTag,
    content: item.content,
  }));
  groupArticlesBySubtag();
}, { immediate: true });


watch(
  () => route.query.tag,
  (newTag) => {
    console.log('route.query.tag changed:', newTag);
    currentTag.value = (newTag as string) || '小说';
  },
  { immediate: true }
);

watch(currentTag, (newTag) => {
  console.log('currentTag changed:', newTag);
});

</script>


<style scoped>
.container {
  padding: 20px;
  font-family: 喵字摄影体;
}

.subtag-section {
  margin-bottom: 20px;
}

h2 {
  border-bottom: 1px solid #ccc;
  padding-bottom: 5px;
  cursor: pointer;
}

ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

li {
  padding: 10px 0;
  cursor: pointer;
  transition: color 0.2s ease;
}

li:hover {
  color: #1890ff;
}

.delete-button, .edit-button {
  margin-left: 10px;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
}

.delete-button {
  background-color: #ff4d4f;
  color: white;
}

.edit-button {
  background-color: #288aec;
  color: white;
}
.quick-read-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.quick-read-container {
  display: flex;
  height: calc(100vh - 40px);
  padding: 20px;
}

.quick-read-sidebar {
  flex: 1;
  max-width: 300px;
  overflow-y: auto;
  border-right: 1px solid #ddd;
  padding-right: 10px;
}

.quick-read-sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.quick-read-sidebar li {
  padding: 10px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.quick-read-sidebar li:hover, .quick-read-sidebar li.active {
  background-color: #f0f0f0;
}

.quick-read-display {
  flex: 3;
  padding: 20px;
  overflow-y: auto;
}

.article-content {
  font-size: 16px;
  line-height: 1.6;
}

.drawer-list {
  overflow: hidden;
}
.drawer-list li {
  opacity: 1;
  transition: opacity 0.3s ease;
}


</style>
