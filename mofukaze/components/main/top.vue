<template>
  <div class="top-wrapper">
    <!-- 全尺寸导航 -->
    <el-menu
      v-if="!isMiniNav"
      :default-active="activeIndex"
      class="el-menu-demo full-nav"
      mode="horizontal"
      @select="handleSelect"
    >
      <el-menu-item index="1" @click="redirectToMain">主页</el-menu-item>
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

    <!-- 迷你导航 -->
    <div v-else class="mini-nav">
      <div class="mini-nav-content">
        <button class="mini-nav-item" @click="redirectToMain" title="主页">
          <i class="fa-solid fa-house" color="black"></i>
        </button>
        <button 
          v-if="ifVisible"
          class="mini-nav-item" 
          @click="redirectToArticle"
          title="写文章"
        >
          <i class="fa-solid fa-pen" color="black"></i>
        </button>
        <button class="mini-nav-item" @click="redirectToArticleListPage" title="文章/博客">
          <i class="fa-solid fa-newspaper" color="black"></i>
        </button>
        <button class="mini-nav-item" @click="redirectToPicture" title="我的收藏">
          <i class="fa-regular fa-heart" color="black"></i>
        </button>
        <button
          v-if="ifVisible"
          class="mini-nav-item"
          @click="redirectToAdmin"
          title="后台"
        >
          <i class="fa-solid fa-chart-line" color="black"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {  watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// ⭐ 引入管理员状态
const admin = useAdmin()

// ⭐ 新的可见性判断（替代 canDelete）
const ifVisible = computed(() => !!admin.getAuthHeader())

const router = useRouter()
const route = useRoute()
const activeIndex = ref('1')
const isMiniNav = ref(false)
const scrollThreshold = 300 // 增加阈值，避免在边界位置反复切换
const scrollHysteresis = 20 // 添加滞后，避免在阈值附近抖动

const handleSelect = (key: string) => {
  activeIndex.value = key
}

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  
  if (!isMiniNav.value && scrollTop > scrollThreshold) {
    isMiniNav.value = true
    document.getElementById('content')?.classList.add('scrolled')
  } else if (isMiniNav.value && scrollTop < scrollThreshold - scrollHysteresis) {
    isMiniNav.value = false
    document.getElementById('content')?.classList.remove('scrolled')
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll() // 初始化检查
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// 页面跳转们~
const redirectToMain = () => router.push('/')
const redirectToArticle = () => router.push('/editor')
const redirectToArticleListPage = () => router.push('/articleList')
const redirectToPicture = () => router.push('/collection')
const redirectToAdmin = () => router.push('/admin')

// 路径变化监听
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/admin') {
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
/* 全尺寸导航 - 固定在顶部 */
.el-menu.full-nav {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 120px;
  opacity: 1; /* 始终可见 */
  background-color: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px) saturate(180%);
  z-index: 9999;
  border: 3px solid rgba(255, 255, 255, 0.25);
  border-radius: 15px;
  box-shadow: 0 6px 20px rgba(80, 160, 255, 0.2);
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}

.el-menu.full-nav:hover {
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 8px 25px rgba(80, 160, 255, 0.3);
}

/* 菜单项样式 */
.el-menu-item {
  font-family: "喵字摄影体";
  font-size: 16px;
  color: #fff;
  transition: all 0.3s ease;
  margin: 0 15px;
  padding: 8px 16px;
  border-radius: 8px;
}

.el-menu-item:hover {
  color: #00bfff;
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

/* 迷你导航 */
.mini-nav {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  opacity: 0;
  animation: fadeInDown 0.3s ease forwards;
}

.mini-nav-content {
  display: flex;
  gap: 10px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  padding: 8px 15px;
  box-shadow: 0 4px 15px rgba(80, 160, 255, 0.2);
}

.mini-nav-item {
  background: none;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.mini-nav-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

/* 导航切换动画 */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 全尺寸导航淡出动画 */
.el-menu.full-nav {
  transition: all 0.3s ease;
}

.el-menu.full-nav.fade-out {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}
</style>
