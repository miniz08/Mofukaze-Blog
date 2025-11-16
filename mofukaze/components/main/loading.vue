<template>
  <div v-if="isVisible" class="overlay">
    <div class="gif-container">
      <img :src="randomGif" alt="Loading..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const isLoading = ref(false)
const isVisible = ref(false)
const gifList = ['/Koishi/1.gif', '/Koishi/2.gif', '/Koishi/3.gif','/Koishi/5.gif']
const randomGif = ref('')

const router = useRouter()

const showOverlay = () => {
  randomGif.value = gifList[Math.floor(Math.random() * gifList.length)]
  isVisible.value = true
  isLoading.value = true
  setTimeout(() => {
    isVisible.value = false
    isLoading.value = false
  }, 100)
}

// 首屏显示
// onMounted(() => {
//   showOverlay()
// })

// // SPA路由切换显示
// router.beforeEach((to, from, next) => {
//   showOverlay()
//   next()
// })
</script>


<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.gif-container img {
  width: 150px;
  height: auto;
  animation: fade 1s ease infinite alternate;
}
@keyframes fade {
  from { opacity: 0.6; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>


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
.overlay {
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
}
.overlay {
  transition: opacity 0.3s ease;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

</style>
