<template>
  <div class="collection-detail-page">
    <div>
      <h1>{{ title }}</h1>
      <img ref="imageRef" :src="imageSrc" alt="后端图片" width="300" height="300" />
      <div v-html="content"></div>
      
      <!-- Edit and Delete Buttons -->
      <button @click="editCollection" class="edit-button">编辑</button>
      <button @click="deleteCollection" class="delete-button">删除</button>
    </div>

    <div id="commentAera"></div>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const content = ref<string>('');
const title = ref<string>('');
const imageSrc = ref<string>('');
const route = useRoute();
const router = useRouter();
const isLoading = ref(true);

const fetchCollectionContent = async (id: number) => {
  try {
    const response = await $fetch(`/api/posts/collection/findCollectionByID?id=${id}`, {
      method: 'GET',
    });
    const result = response as any[];
    if (result) {
      title.value = result[0].title;
      content.value = result[0].content;
      imageSrc.value = `http://mofukaze.static.com:8081/img/cover/${result[0].title}.jpeg`;
    }
  } finally {
    isLoading.value = false;
  }
};

const articleId = ref<number>(0);
onMounted(() => {
  articleId.value = Number(route.params.id);
  fetchCollectionContent(articleId.value);
});

// Delete Collection
const deleteCollection = async () => {
  try {
    await $fetch('/api/posts/collection/deleteCollection', {
      method: 'POST',
      body: { id: articleId.value },
    });
    router.push('/'); // Navigate to the homepage or another page after deletion
  } catch (error) {
    console.error('删除收藏失败', error);
  }
};

// Edit Collection
const editCollection = () => {
  router.push({
    path: `/collectionEdit/${articleId.value}`,
    query: {
      id: articleId.value,
    },
  });
};

// Simulate loading
setTimeout(() => {
  isLoading.value = false;
}, 1000);
</script>
  <style>
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
  </style>
  