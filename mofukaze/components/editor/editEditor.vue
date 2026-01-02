<template>
  <div class="editor-container">
    <!-- 标题 -->
    <div class="input-group">
      <label for="title">标题:</label>
      <input id="title" v-model="title" type="text" placeholder="请输入文章标题" />
    </div>

    <!-- 标签 -->
    <div class="input-group">
      <label for="tag">标签:</label>
      <input v-model="tag" type="text" placeholder="文章类型" disabled="disabled" />
    </div>

    <Editor ref="editorRef" v-model="content" />

    <!-- 💾 提交按钮 -->
    <div class="submit-container">
      <button @click="submitContent" class="submit-button">保存</button>
    </div>
    <button id="ref-btn" @click="generateRefLink">📎 引用本文</button>

  </div>
</template>
  
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Editor from './editor.vue';
import { useAdmin } from '~/composables/useAdmin';

const admin = useAdmin();

const title = ref('');
const tag = ref('');
const id = ref<null | string>(null);
const content = ref('');
const editorRef = ref<InstanceType<typeof Editor> | null>(null);

const route = useRoute();

// ------------------------------
// 📄 初始化文章
// ------------------------------
onMounted(async () => {
  id.value = route.query.id as string || null;
  if (id.value) {
    try {
      const data = await $fetch(`/api/posts/article/findArticleByID?id=${id.value}`, { method: 'GET' }) as any[];
      if (data?.length) {
        title.value = data[0].title;
        tag.value = data[0].tag;
        content.value = data[0].content;
      }
    } catch (error) {
      console.error('❌ Failed to fetch article:', error);
    }
  }
});

async function submitContent() {
  const htmlContent = editorRef.value?.getHTML() || content.value;

  // 检查是否还有未完成上传的 blob
  if (/blob:/.test(htmlContent)) {
    alert('有图片还在上传中，请稍等~ (´；ω；｀)');
    return;
  }

  // 替换连续空格
  let processedContent = htmlContent.replace(/ {2,}/g, match => '&nbsp;'.repeat(match.length));

  try {
    const result = await $fetch('/api/posts/article/editArticle', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...admin.getAuthHeader()
      },
      body: { id: id.value, title: title.value, content: processedContent, tag: tag.value }
    });

    if (result.status === 'success') {
      alert('保存成功~(≧▽≦)ﾉ💾');
    } else {
      console.error(result.message);
    }
  } catch (error) {
    if (error?.status === 403) {
      alert('没有权限喔！(。•́︿•̀。)');
    } else {
      console.error('❌ 保存失败', error);
    }
  }
}
function generateRefLink(){
  const html = `<a href="mofukaze.me/article/${id}" class="internal-link">${title}</a>`;
  navigator.clipboard.writeText(html);
  alert("引用已复制 ✨");
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
