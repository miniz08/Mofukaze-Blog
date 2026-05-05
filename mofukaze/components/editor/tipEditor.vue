<template>
  <div class="editor-container">

    <!-- 标题 -->
    <div class="input-group">
      <label>标题:</label>
      <input v-model="title" type="text" placeholder="请输入文章标题" />
    </div>

    <!-- 主标签（可输入 + 可选择） -->
    <div class="input-group">
      <label>标签:</label>
      <el-select
        v-model="tag"
        placeholder="选择文章类型或输入新类型"
        style="width: 240px"
        filterable
        allow-create
      >
        <el-option
          v-for="item in tagOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>

    <!-- 子标签（动态 + 可输入） -->
    <div class="input-group">
      <label>子标签:</label>
      <el-select
        v-model="subTag"
        placeholder="选择子标签或输入新的子标签"
        style="width: 240px"
        filterable
        allow-create
        :disabled="!tag"
      >
        <el-option
          v-for="item in subTagOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>

    <Editor ref="editorRef" v-model="content" />

    <div class="submit-container">
      <button @click="submitContent" class="submit-button">提交内容</button>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import Editor from './editor.vue'
import { useAdmin } from '~/composables/useAdmin';

const admin = useAdmin();
// ------------------------------
// Article State
// ------------------------------
const title = ref('')
const tag = ref('')
const subTag = ref('')
const tagOptions = ref([])        // 动态主标签
const subTagOptions = ref([])     // 动态子标签
const content = ref('')
const editorRef = ref(null)

// ------------------------------
// 1. 获取所有 tag
// ------------------------------
async function fetchAllTags() {
  const res = await fetch('/api/posts/article/getAllTag')
  const json = await res.json()
  if (json.status === 'success') {
    tagOptions.value = json.data.map((i: any) => ({
      label: i.tag,
      value: i.tag
    }))
  }
}

// ------------------------------
// 2. 根据 tag 获取 subTag
// ------------------------------
async function fetchSubTagList(selectedTag: string) {
  if (!selectedTag) {
    subTagOptions.value = []
    return
  }
  const res = await fetch(`/api/posts/article/getSubTag?tag=${encodeURIComponent(selectedTag)}`)
  const json = await res.json()
  if (json.status === 'success') {
    subTagOptions.value = json.data.map((i: any) => ({
      label: i,
      value: i
    }))
  }
}

// ------------------------------
// 监听 tag → 动态加载 subTag
// ------------------------------
watch(tag, (newTag) => {
  subTag.value = ''
  fetchSubTagList(newTag)
})

// ------------------------------
// 页面加载时获取所有标签
// ------------------------------
onMounted(() => {
  fetchAllTags()
})

// ------------------------------
// Submit Article
// ------------------------------
async function submitContent() {
  const htmlContent = editorRef.value?.getHTML() || content.value
  try {
    const res = await fetch('/api/posts/article/submitArticle', {
      method: 'POST',
            headers: {
        'Content-Type': 'application/json',
        ...admin.getAuthHeader() // ⭐ 关键：附加管理员认证头
      },
      body: JSON.stringify({
        title: title.value,
        content: htmlContent,
        tag: tag.value,
        subTag: subTag.value,
      })
    })
    const result = await res.json()
    if (result.status === 'success') alert('提交成功')
    else console.error(result.message)
  } catch (error) {
    console.error('提交内容失败', error)
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

.submit-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.submit-button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-button:hover {
  background-color: #0056b3;
}
</style>
