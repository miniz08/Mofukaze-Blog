<template>
<el-input v-model="searchQuery" placeholder="Enter ID or Name" style="width: 300px; margin-right: 10px;" />
<el-button type="primary" @click="handleIdConfirm">Search</el-button> 

<el-table :data="getBack" stripe style="width: 100%; margin-top: 20px;">
    <el-table-column prop="id" label="ID" width="180" />
    <el-table-column prop="name" label="Name" width="180" />
    <el-table-column prop="email" label="Email" />
  </el-table>
</template>

<script setup lang="ts">
import { ref} from 'vue';

const searchQuery = ref('');
const getBack = ref<any[]>([]);

const handleIdConfirm = async () => {
  try {
    const response = await $fetch(`/api/posts/findUserByID?id=${searchQuery.value}`, {
      method: 'GET',
    });
    const result: any[] = response as unknown as any[];

    if (response && result.length > 0) {
        getBack.value = result;
    } else {
      throw new Error('User not found');
    }
  } catch (error: any) {
    ElMessage({
      message: error.message || 'Failed to find user',
      type: 'error',
    });
  }
};
</script>