<template>
  <div>
    <loading v-if="isLoading"/>
    <!-- 测试按钮，用于手动触发显示Overlay -->
    <button @click="showOverlay">显示随机GIF</button>

    <!-- Overlay部分 -->
    <div v-if="isVisible" class="overlay">
      <div class="gif-container">
        <img :src="randomGif" alt="Loading..." />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isVisible = ref(false);
const gifList = ['/Koishi/1.gif', '/Koishi/2.gif', '/Koishi/3.gif','/Koishi/5.gif']; // 确保这些GIF文件在public文件夹内的路径正确
const randomGif = ref('');



const isLoading = ref(true);

// 模拟异步操作或页面加载
setTimeout(() => {
  isLoading.value = false;
}, 1000); // 1秒后隐藏loading
// 显示Overlay并随机选择GIF
const showOverlay = () => {
  randomGif.value = gifList[Math.floor(Math.random() * gifList.length)];
  isVisible.value = true;

  // 设置一个定时器来自动隐藏Overlay
  setTimeout(hideOverlay, 1000); // 例如3秒后自动隐藏
};

// 隐藏Overlay
const hideOverlay = () => {
  isVisible.value = false;
};

</script>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
</style>
