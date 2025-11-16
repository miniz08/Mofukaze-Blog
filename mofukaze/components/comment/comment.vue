<template>
    <div>
      <!-- 评论区 -->
      <div id="commentAera">
        <div v-for="comment in comments" :key="comment.id" :class="{'owner-comment': comment.isOwner}">
          <p><strong>{{ comment.name }}</strong></p>
          <p>{{ comment.content }}</p>
          <p><small>{{ comment.posttime }}</small></p>
        </div>
      </div>
      <!-- 评论表单 -->
      <div>
        <input v-model="commentName" placeholder="输入您的名字" />
        <textarea v-model="commentContent" placeholder="输入评论内容"></textarea>
        <button @click="submitComment">提交评论</button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  
  const comments = ref<any[]>([]); // 评论列表
  const commentName = ref('');
  const commentContent = ref('');
  
  // 提交评论
  const submitComment = async () => {
    const response = await fetch('/api/posts/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: commentName.value,
        content: commentContent.value,
        articleId: articleId, // 假设文章ID在某处定义
        ipAddress: getUserIP() // 获取用户IP
      }),
    });
    const result = await response.json();
    if (result.status === 'success') {
      comments.value.push(result.comment); // 添加评论到列表
      commentName.value = '';
      commentContent.value = '';
    }
  };
  
  // 获取用户IP（示例，后端应该处理IP获取）
  function getUserIP() {
    // 假设后端返回IP地址
    return '用户IP地址'; // 后端应处理
  }
  
  // 加载评论
  const loadComments = async () => {
    const response = await fetch(`/api/posts/comments?articleId=${articleId}`);
    const data = await response.json();
    comments.value = data.comments;
  };
  
  // 在页面加载时加载评论
  onMounted(() => {
    loadComments();
  });
  </script>
  
  <style scoped>
  .owner-comment {
    background-color: #f0f8ff; /* 博主评论背景色 */
    border-left: 4px solid #007bff; /* 博主评论左边边框 */
  }
  </style>
  