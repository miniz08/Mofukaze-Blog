<template>
  <div>
    <div>
      <loading v-if="isLoading"/>
            <h1>{{ title }}</h1>
            <div v-html="content"></div>
    </div>
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
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted,defineComponent } from 'vue';
  import { useRoute } from 'vue-router';
  
  const content = ref<string>('');
  const title = ref<string>('');
  const route = useRoute();
  
  const fetchArticleContent = async (id: number) => {
    const response = await $fetch(`/api/posts/article/findArticleByID?id=${id}`, {
      method: 'GET',
    });
    const result = response as any[];
    if (result) {
      title.value = result[0].title;
      content.value = result[0].content;
    }
  };
  
  onMounted(() => {
    const articleId = Number(route.params.id);
    loadComments();
    fetchArticleContent(articleId);
  });

  const isLoading = ref(true);

// 模拟异步操作或页面加载
setTimeout(() => {
  isLoading.value = false;
}, 1000); // 1秒后隐藏loading

const ip = ref<string>('');  // 存储IP地址



       const fetchIP = async () =>{
           {  // 将函数改为异步
            const localIP = await $fetch(`/api/posts/server`, {
                method: 'GET',
            }); // 等待API响应
            ip.value = localIP;  // 更新IP值
            console.log(localIP);  // 输出到控制台
        };

        return {
            ip
        };
      }



const articleId = Number(route.params.id);
console.log(Number(route.params.id));
const comments = ref<any[]>([]); // 评论列表
  const commentName = ref('');
  const commentContent = ref('');
  
  // 提交评论
  const submitComment = async () => {
    const response = await fetch('/api/posts/submitComment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: commentName.value,
        content: commentContent.value,
        articleId: articleId, // 假设文章ID在某处定义
        ipAddress: fetchIP// 获取用户IP
      }),
    });
    const result = await response.json();
    if (result.status === 'success') {
      comments.value.push(result.comment); // 添加评论到列表
      commentName.value = '';
      commentContent.value = '';
    }
  };
  

  
  // 加载评论
  const loadComments = async () => {
    const response = await fetch(`/api/posts/loadComments?articleId=${articleId}`);
    const data = await response.json();
    comments.value = data.comments;
  };
  </script>

  