<template>
  <div class="admin-login-container">
    <div class="login-card">
      <h2>管理员登录</h2>
      <p class="hint">请输入管理员令牌</p>
      
      <div class="input-group">
        <input
          v-model="tokenInput"
          type="password"
          placeholder="输入管理员令牌"
          @keyup.enter="handleLogin"
          class="token-input"
        />
      </div>

      <div class="button-group">
        <button @click="handleLogin" class="login-btn" :disabled="isLoginDisabled">
          登录
        </button>

        <button @click="handleLogout" class="logout-btn" :disabled="!admin.token">
          退出登录
        </button>
      </div>

      <div v-if="admin.isLoading" class="status-loading">
        检测中...
      </div>
      <div v-else-if="admin.isAdmin" class="status-success">
        ✓ 已登录为管理员
      </div>
      <div v-else-if="admin.token && !admin.isAdmin" class="status-error">
        ✗ 令牌无效或已过期
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const admin = useAdmin()
const tokenInput = ref('')

// 安全计算按钮是否可点击
const isLoginDisabled = computed(() => {
  const val = tokenInput.value
  return !(typeof val === 'string' && val.trim().length > 0)
})

onMounted(() => {
  console.log('login mounted', admin.isAdmin.value)
})

watch(() => admin.isAdmin.value, (val) => {
  console.log('admin.isAdmin changed', val)
})

// 如果已有 token，自动填充输入框
onMounted(() => {
  if (admin.token) {
    tokenInput.value = admin.token
    admin.checkAdminStatus()
  }
})

const handleLogin = async () => {
  const token = (tokenInput.value || '').toString().trim()
  if (!token) {
    alert('请输入管理员令牌')
    return
  }

  admin.setToken(token)
  await admin.checkAdminStatus()

  if (admin.isAdmin) {
    alert('登录成功！')
  } else {
    alert('登录失败：令牌无效')
  }
}

const handleLogout = () => {
  admin.clearToken()
  tokenInput.value = ''
  alert('已退出登录')
}
</script>


<style scoped>
.admin-login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 40px 20px;
}

.login-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

h2 {
  margin: 0 0 8px 0;
  color: rgba(16, 16, 17, 0.95);
  font-size: 24px;
  font-weight: 600;
}

.hint {
  margin: 0 0 24px 0;
  color: rgba(16, 16, 17, 0.7);
  font-size: 14px;
}

.input-group {
  margin-bottom: 20px;
}

.token-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(16, 16, 17, 0.95);
  font-size: 14px;
  transition: all 0.3s ease;
}

.token-input:focus {
  outline: none;
  border-color: rgba(120, 160, 255, 0.6);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 3px rgba(120, 160, 255, 0.1);
}

.button-group {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.login-btn,
.logout-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn {
  background: rgba(120, 160, 255, 0.3);
  color: rgba(16, 16, 17, 0.95);
}

.login-btn:hover:not(:disabled) {
  background: rgba(120, 170, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(120, 160, 255, 0.3);
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.logout-btn {
  background: rgba(255, 120, 120, 0.3);
  color: rgba(16, 16, 17, 0.95);
}

.logout-btn:hover:not(:disabled) {
  background: rgba(255, 130, 130, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 120, 120, 0.3);
}

.logout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-loading,
.status-success,
.status-error {
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
}

.status-loading {
  background: rgba(200, 200, 255, 0.2);
  color: rgba(16, 16, 17, 0.8);
}

.status-success {
  background: rgba(120, 255, 120, 0.2);
  color: rgba(16, 16, 17, 0.9);
}

.status-error {
  background: rgba(255, 120, 120, 0.2);
  color: rgba(16, 16, 17, 0.9);
}
</style>

