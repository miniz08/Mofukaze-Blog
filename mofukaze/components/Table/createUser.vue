<template>
    <el-button plain @click="dialogVisible = true">
      添加新数据
    </el-button>
  
    <el-dialog
      v-model="dialogVisible"
      title="Tips"
      width="500"
    >
      <span>
        <el-input v-model="inputID" placeholder="Enter ID" style="width: 300px; margin-right: 10px;" />
        <el-input v-model="inputName" placeholder="Enter Name" style="width: 300px; margin-right: 10px;" />
        <el-input v-model="inputEmail" placeholder="Enter Email" style="width: 300px; margin-right: 10px;" />
      </span>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="handleConfirm">
            Confirm
          </el-button>
        </div>
      </template>
    </el-dialog>
  </template>
  
  <script lang="ts" setup>
  import { ref } from 'vue'
  import { ElMessage } from 'element-plus'
  
  const inputID = ref('')
  const inputName = ref('')
  const inputEmail = ref('')
  const dialogVisible = ref(false)
  
  const handleConfirm = async () => {
    try {
      const { data: response } = await useFetch('/api/posts/createUser', {
        method: 'POST',
        body: {
          id: inputID.value,
          name: inputName.value,
          email: inputEmail.value,
        },
      })
      
      if (response.value && response.value.status === 'success') {
        ElMessage({
          message: 'User created successfully!',
          type: 'success',
        })
        dialogVisible.value = false
      } else {
        throw new Error(response.value.message || 'Failed to create user')
      }
    } catch (error) {
      ElMessage({
        message: error.message || 'Failed to create user',
        type: 'error',
      })
    }
  }
  

  </script>
  