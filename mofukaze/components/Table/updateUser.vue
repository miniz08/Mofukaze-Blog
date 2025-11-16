<template>
  <el-button plain @click="openIdDialog">
    更改数据
  </el-button>

  <!-- 第一个对话框用于输入 ID -->
  <el-dialog
    v-model="idDialogVisible"
    title="输入用户 ID"
    width="500"
  >
    <span>
      <el-input v-model="inputID" placeholder="Enter ID" style="width: 300px; margin-right: 10px;" />
    </span>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="idDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleIdConfirm">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 第二个对话框用于修改 Name 和 Email -->
  <el-dialog
    v-model="editDialogVisible"
    title="修改用户信息"
    width="500"
  >
    <span>
      <el-input v-model="inputName" placeholder="Enter Name" style="width: 300px; margin-right: 10px;" />
      <el-input v-model="inputEmail" placeholder="Enter Email" style="width: 300px; margin-right: 10px;" />
    </span>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="editDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleEditConfirm">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'

const inputID = ref('')
const inputName = ref('')
const inputEmail = ref('')
const idDialogVisible = ref(false)
const editDialogVisible = ref(false)

const openIdDialog = () => {
  idDialogVisible.value = true
}

const handleIdConfirm = async () => {
  try {
    const response = await $fetch(`/api/posts/findUserByID?id=${inputID.value}`, {
      method: 'GET',
    });
    const result:any[]=response as unknown as any
    if (response && result.length > 0) {
      inputName.value = result[0].name;
      inputEmail.value = result[0].email;
      idDialogVisible.value = false;
      editDialogVisible.value = true;
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    ElMessage({
      message: error as unknown as string || 'Failed to find user',
      type: 'error',
    });
  }
};


const handleEditConfirm = async () => {
  try {
    const { data: response,status,error } = await useFetch('/api/posts/editUser', {
      method: 'POST',
      body: {
        id: inputID.value,
        name: inputName.value,
        email: inputEmail.value,
      },
    })
    
    if (response.value && status as unknown as string === 'success') {
      ElMessage({
        message: 'User updated successfully!',
        type: 'success',
      })
      editDialogVisible.value = false
    } else {
      throw new Error(error as unknown as string || 'Failed to update user')
    }
  } catch (error) {
    ElMessage({
      message: error as unknown as string || 'Failed to update user',
      type: 'error',
    })
  }
}

</script>

<style>
.el-table {
  margin-bottom: 20px;
}
</style>
