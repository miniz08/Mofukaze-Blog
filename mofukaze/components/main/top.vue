<template>
  <div class="top-wrapper">
    <el-menu
      :default-active="activeIndex"
      class="el-menu-demo"
      mode="horizontal"
      @select="handleSelect"
    >
      <el-menu-item index="1" @click="redirectToMain">主页</el-menu-item>

      <!-- ⭐ 写文章（仅管理员可见） -->
      <el-menu-item 
        v-if="ifVisible"
        index="2" 
        @click="redirectToArticle"
      >写文章</el-menu-item>

      <el-menu-item index="5" @click="redirectToArticleListPage">文章/博客</el-menu-item>
      <el-menu-item index="4" @click="redirectToPicture">我的收藏</el-menu-item>
      <el-menu-item
        v-if="ifVisible"
        index="6"
        @click="redirectToAdmin"
      >后台</el-menu-item>
    </el-menu>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// ⭐ 引入管理员状态
const admin = useAdmin()

// ⭐ 新的可见性判断（替代 canDelete）
const ifVisible = computed(() => !!admin.getAuthHeader())

const router = useRouter()
const route = useRoute()
const activeIndex = ref('1')

// 页面跳转们~
const redirectToMain = () => router.push('/')
const redirectToArticle = () => router.push('/editor')
const redirectToArticleListPage = () => router.push('/articleList')
const redirectToPicture = () => router.push('/collection')
const redirectToAdmin = () => router.push('/admin')
const handleSelect = () => {}

// 路径变化监听
watch(
  () => route.path,
  (newPath) => {
    if (newPath.startsWith('/admin')) {
      activeIndex.value = '6'
      return
    }

    switch (newPath) {
      case '/':
        activeIndex.value = '1'; break
      case '/editor':
        activeIndex.value = '2'; break
      case '/articleList':
        activeIndex.value = '5'; break
      case '/collection':
        activeIndex.value = '4'; break
      default:
        activeIndex.value = '1'
    }
  },
  { immediate: true }
)
</script>


<style>

.el-menu {
  position: fixed;
  top: 20px; /* 顶部中央距离，可微调 */
  left: 50%;
  transform: translateX(-50%); /* 水平居中 */
  width: 80%; /* 保持原宽度 */
  height: 130px; /* 保持原高度 */
  opacity: 0.22; /* 初始轻微显影 */
  background-color: rgba(255, 255, 255, 0.08); /* 半透明玻璃纸感 */
  backdrop-filter: blur(18px) saturate(180%);
  z-index: 9999; /* 保证在前 */
  background-image: url('http://mofukaze.me/img/frame/top.jpg'); /* 原背景图 */
  background-size: cover;
  background-repeat: no-repeat;
  border: 3px solid rgba(255, 255, 255, 0.25); /* 半透明边框 */
  border-radius: 15px; /* 更柔和的圆角 */
  box-shadow: 0 6px 20px rgba(80, 160, 255, 0.2); /* 更空灵的阴影 */
  transition: opacity 0.5s ease, transform 0.3s ease, box-shadow 0.3s ease, filter 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}

.el-menu:hover {
  opacity: 1; /* 鼠标移入显示 */
  transform: translateX(-50%) translateY(-5px); /* 轻微上浮效果 */
  box-shadow: 0 10px 30px rgba(80, 160, 255, 0.35);
  filter: saturate(1.08);
}

.el-menu-item {
  font-family: "喵字摄影体";
  font-size: large;
  color: #fff;
  position: relative;
  transition: color 0.3s ease, transform 0.3s ease;
  margin: 0 20px; /* 菜单项间距 */
}

.el-menu-item:hover {
  color: #00bfff;
  transform: scale(1.1); /* 悬浮放大效果 */
}

.el-menu-item.is-active {
  color: #b8f3ff;
  text-shadow: 0 0 12px rgba(120, 220, 255, 0.72);
}

.el-menu-item::after {
  background: linear-gradient(90deg, rgba(112, 210, 255, 0), rgba(112, 210, 255, 0.85), rgba(255, 172, 214, 0));
  bottom: 28px;
  content: "";
  height: 2px;
  left: 18%;
  opacity: 0;
  position: absolute;
  right: 18%;
  transform: scaleX(0.4);
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.el-menu-item:hover::after,
.el-menu-item.is-active::after {
  opacity: 1;
  transform: scaleX(1);
}

.content {
  padding-top: 160px; /* 根据菜单高度 + 悬浮上移调整 */
}

</style>
