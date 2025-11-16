<template>
  <div >
    <!-- <loading v-if="isLoading"/> -->
        <tipEditor id="top"/>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isLoading = ref(true);

// 模拟异步操作或页面加载
setTimeout(() => {
  isLoading.value = false;
}, 1000); // 1秒后隐藏loading
</script>


