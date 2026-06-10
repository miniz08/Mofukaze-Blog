<template>
  <div class="editor-container">

    <!-- 🏷️ 标题输入 -->
    <div class="input-group">
      <label for="title">标题:</label>
      <input
        id="title"
        v-model="title"
        type="text"
        placeholder="请输入文章标题"
      />
    </div>

    <!-- 🏷️ 标签输入 -->
    <div class="input-group">
      <label for="tag">标签:</label>
      <input
        id="tag"
        v-model="tag"
        type="text"
        placeholder="文章类型"
        disabled
      />
    </div>

    <Editor ref="editorRef" v-model="content" />
      <!-- 💾 保存按钮 -->
      <div class="submit-container">
        <button @click="submitContent" class="submit-button">
          保存
        </button>
      </div>

    </div>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Editor from './editor.vue'
import { useAdmin } from '~/composables/useAdmin';

const admin = useAdmin();
// ------------------------------
// 🌸 基础初始化
// ------------------------------
const route = useRoute()

const title = ref('')
const tag = ref('')
const id = ref<string | null>(null)
const content = ref('')
const editorRef = ref<InstanceType<typeof Editor> | null>(null)

// ------------------------------
// 📦 获取文章内容（编辑模式）
// ------------------------------
onMounted(async () => {
  id.value = (route.query.id as string) || null
  if (!id.value) return

  try {
    const response = await $fetch(`/api/posts/collection/findCollectionByID?id=${id.value}`, {
      method: 'GET',
    })
    const data = response as any[]

    if (data && data.length > 0) {
      title.value = data[0].title
      tag.value = data[0].tag
      content.value = data[0].content
    }
  } catch (error) {
    console.error('❌ 获取文章失败:', error)
  }
})

// ------------------------------
// 💾 提交内容（保存修改）
// ------------------------------
async function submitContent() {
  const htmlContent = editorRef.value?.getHTML() || content.value
  try {
    const response = await fetch('/api/posts/collection/editCollection', {
      method: 'PUT',
            headers: {
        'Content-Type': 'application/json',
        ...admin.getAuthHeader() // ⭐ 关键：附加管理员认证头
      },
      body: JSON.stringify({
        id: id.value,
        title: title.value,
        content: htmlContent,
        tag: tag.value,
      }),
    })

    const result = await response.json()
    if (result.status === 'success') {
      alert('保存成功！✨')
    } else {
      console.error('❌ 保存失败：', result.message)
    }
  } catch (error) {
    console.error('❌ 保存出错:', error)
  }
}


</script>


<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 输入框样式 */
.input-group {
  display: flex;
  flex-direction: column;
}
.input-group label {
  margin-bottom: 4px;
  font-weight: bold;
}
.input-group input {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

/* ✨ 工具栏 */
.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  background-color: #f7f8fa;
  border: 1px solid #ddd;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.editor-toolbar button {
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: "喵字摄影体";
}

.editor-toolbar button.is-active {
  background-color: #00b4ff;
  color: white;
  border-color: #00b4ff;
}

.editor-toolbar button:disabled {
  background-color: #eee;
  cursor: not-allowed;
}

.editor-toolbar button:hover:not(:disabled) {
  background-color: #e6f7ff;
}
.editor-toolbar button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.editor-toolbar button:hover {
  color: #1e90ff; /* hover高亮色 */
}

.editor-toolbar button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ✏️ 编辑区 */
.editor-content-wrapper {
  border: 1px solid #ccc;
  padding: 12px;
  border-radius: 8px;
  background-color: #fff;
  min-height: 240px;
}

/* 💾 提交按钮 */
.submit-container {
  display: flex;
  justify-content: center;
}
.submit-button {
  padding: 10px 20px;
  background-color: #00b4ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.25s ease;
}
.submit-button:hover {
  background-color: #0086cc;
}

</style>
