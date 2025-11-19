<template>
   <div class="top-wrapper">
    <el-menu
      :default-active="activeIndex"
      class="el-menu-demo"
      mode="horizontal"
      @select="handleSelect"
    >
      <el-menu-item index="1" @click="redirectToMain">主页</el-menu-item>
      <el-menu-item index="2" @click="redirectToArticle">写文章</el-menu-item>
      <el-menu-item index="5" @click="redirectToArticleListPage">文章/博客</el-menu-item>

      <!-- <el-menu-item index="3" @click="redirectToArticleList">文章列表</el-menu-item> -->
      <el-menu-item index="4" @click="redirectToPicture">我的收藏</el-menu-item>
      
    </el-menu>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const activeIndex = ref('1');
const redirectToArticleList = (tag: string) => {
  router.push({ path: '/List/articleList', query: { tag } });
};

// 点击绑定
const redirectToArticleListPage = () => {
  router.push('/articleList');
};

const handleSelect = (key: string, keyPath: string[]) => {

}

const redirectToMain = () => {
  router.push('/')
};

const redirectToArticle = () => {
  router.push('/editor')
};


const redirectToPicture = () => {
  router.push('/collection')
};

watch(
  () => route.path,
  (newPath) => {
    switch (newPath) {
      case '/':
        activeIndex.value = '1';
        break;
      case '/editor':
        activeIndex.value = '2';
        break;
      case '/articleList':
        activeIndex.value = '3';
        break;
      case '/collection':
        activeIndex.value = '4';
        break;
        case '/articleList':
        activeIndex.value = '5';
        break;

        break;
      default:
        activeIndex.value = '1';
    }
  },
  { immediate: true } // Ensure it runs on initial load
);

</script>

<style>

.el-menu {
  position: fixed;
  top: 20px; /* 顶部中央距离，可微调 */
  left: 50%;
  transform: translateX(-50%); /* 水平居中 */
  width: 80%; /* 保持原宽度 */
  height: 130px; /* 保持原高度 */
  opacity: 0; /* 初始隐藏 */
  background-color: rgba(255, 255, 255, 0.08); /* 半透明玻璃纸感 */
  backdrop-filter: blur(18px) saturate(180%);
  z-index: 9999; /* 保证在前 */
  background-image: url('http://mofukaze.me/img/frame/top.jpg'); /* 原背景图 */
  background-size: cover;
  background-repeat: no-repeat;
  border: 3px solid rgba(255, 255, 255, 0.25); /* 半透明边框 */
  border-radius: 15px; /* 更柔和的圆角 */
  box-shadow: 0 6px 20px rgba(80, 160, 255, 0.2); /* 更空灵的阴影 */
  transition: opacity 0.5s ease, transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}

.el-menu:hover {
  opacity: 1; /* 鼠标移入显示 */
  transform: translateX(-50%) translateY(-5px); /* 轻微上浮效果 */
  box-shadow: 0 10px 30px rgba(80, 160, 255, 0.35);
}

.el-menu-item {
  font-family: "喵字摄影体";
  font-size: large;
  color: #fff;
  transition: color 0.3s ease, transform 0.3s ease;
  margin: 0 20px; /* 菜单项间距 */
}

.el-menu-item:hover {
  color: #00bfff;
  transform: scale(1.1); /* 悬浮放大效果 */
}

.content {
  padding-top: 160px; /* 根据菜单高度 + 悬浮上移调整 */
}

</style>
