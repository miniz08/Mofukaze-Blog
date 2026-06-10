<template>
    <div>
      <!-- 评论表单 -->
      <div>
        <input v-model="commentName" placeholder="输入您的名字" />
        <div class="editor-container">

    <!-- 🌈 工具栏区域（移动到标签下方） -->
    <div v-if="editor" class="editor-toolbar">
  <!-- 🖋️ 基本文本格式 -->
  <div class="toolbar-group">
    <button
      @click="editor.chain().focus().toggleBold().run()"
      :class="{ 'is-active': editor.isActive('bold') }"
      title="加粗"
    >
      <Bold size="13" />
    </button>
    <button
      @click="editor.chain().focus().toggleItalic().run()"
      :class="{ 'is-active': editor.isActive('italic') }"
      title="斜体"
    >
      <Italic size="13" />
    </button>
    <button
      @click="editor.chain().focus().toggleStrike().run()"
      :class="{ 'is-active': editor.isActive('strike') }"
      title="删除线"
    >
      <Strikethrough size="13" />
    </button>
  </div>

  <!-- 🧱 段落与标题 -->
  <div class="toolbar-group">
    <button
      @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
      title="标题1"
    >
      标题1
    </button>
    <button
      @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
      title="标题2"
    >
     标题2
    </button>
    <button
      @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
      title="标题3"
    >
      标题3
    </button>
  </div>

  <!-- 🔢 列表 -->
  <div class="toolbar-group">
    <button
      @click="editor.chain().focus().toggleBulletList().run()"
      :class="{ 'is-active': editor.isActive('bulletList') }"
      title="无序列表"
    >
      <List size="13" />
    </button>
    <button
      @click="editor.chain().focus().toggleOrderedList().run()"
      :class="{ 'is-active': editor.isActive('orderedList') }"
      title="有序列表"
    >
      <ListOrdered size="13" />
    </button>
  </div>

  <!-- 🌈 插入类 -->
  <div class="toolbar-group">
    <button
      @click="editor.chain().focus().toggleBlockquote().run()"
      :class="{ 'is-active': editor.isActive('blockquote') }"
      title="引用"
    >
      <Quote size="13" />
    </button>
    <button
      @click="editor.chain().focus().toggleCodeBlock().run()"
      :class="{ 'is-active': editor.isActive('codeBlock') }"
      title="代码块"
    >
      <Code size="13" />
    </button>
    <button
      @click="addImage"
      title="添加图片"
    >
      添加图片
    </button>
  </div>

  <!-- ⏳ 撤销 / 重做 -->
  <div class="toolbar-group">
    <button
      @click="editor.chain().focus().undo().run()"
      :disabled="!editor.can().chain().focus().undo().run()"
      title="撤销"
    >
      <Undo size="13" />
    </button>
    <button
      @click="editor.chain().focus().redo().run()"
      :disabled="!editor.can().chain().focus().redo().run()"
      title="重做"
    >
      <Redo size="13" />
    </button>
  </div>

  <!-- 🧩 更多 -->
  <div class="toolbar-group">
    <details>
      <summary>更多 ▼</summary>
      <div class="more-menu">
        <button
          @click="editor.chain().focus().unsetAllMarks().run()"
          title="清除格式"
        >
          清除格式
        </button>
        <button
          @click="editor.chain().focus().setHorizontalRule().run()"
          title="水平线"
        >
          <Minus size="13" />
        </button>
      </div>
    </details>
  </div>
</div>


    <!-- ✏️ 编辑器正文 -->
    <div class="editor-content-wrapper">
      <EditorContent class="editor-content" :editor="editor" :style="{ fontSize: `${fontSize}px` }" />
    </div>
  </div>
        <button @click="submitComment">提交评论</button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Code, Undo, Redo, Minus } from 'lucide-vue-next'

// ------------------------------
// Editor State
// ------------------------------
const editor = ref(useEditor({
  extensions: [StarterKit, Image],
  content: "<p>God Knows</p>",
}))
const fontSize = ref(16)
const { uploadDataUrl } = useResourceUpload()
  const comments = ref<any[]>([]); // 评论列表
  const commentName = ref('');
  const commentContent = ref('');
  
  // 提交评论
  const submitComment = async () => {
    const response = await fetch('/api/posts/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: commentName.value,
        content: commentContent.value,
        articleId: articleId, // 假设文章ID在某处定义
        ipAddress: getUserIP() // 获取用户IP
      }),
    });
    const result = await response.json();
    if (result.status === 'success') {
      comments.value.push(result.comment); // 添加评论到列表
      commentName.value = '';
      commentContent.value = '';
    }
  };
  
  // 获取用户IP（示例，后端应该处理IP获取）
  function getUserIP() {
    // 假设后端返回IP地址
    return '用户IP地址'; // 后端应处理
  }
  
// ------------------------------
// Font Size Controls
// ------------------------------
function increaseFontSize() {
  fontSize.value += 2
  editor.value.chain().focus().setNode('textStyle', { fontSize: `${fontSize.value}px` }).run()
}
function decreaseFontSize() {
  fontSize.value = Math.max(fontSize.value - 2, 10)
  editor.value.chain().focus().setNode('textStyle', { fontSize: `${fontSize.value}px` }).run()
}

// ------------------------------
// Keyboard Shortcuts
// ------------------------------
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Tab') {
    event.preventDefault()
    if (editor.value.isActive('listItem')) {
      editor.value.chain().focus().sinkListItem('listItem').run()
    } else {
      editor.value.chain().focus().insertContent('    ').run()
    }
  }

  if (event.ctrlKey) {
    switch (event.key) {
      case 'b': editor.value.chain().focus().toggleBold().run(); break
      case 'i': editor.value.chain().focus().toggleItalic().run(); break
      case 'z': editor.value.chain().focus().undo().run(); break
      case '1': editor.value.chain().focus().toggleHeading({ level: 1 }).run(); break
      case '2': editor.value.chain().focus().toggleHeading({ level: 2 }).run(); break
      case '3': editor.value.chain().focus().toggleHeading({ level: 3 }).run(); break
      case 'o': editor.value.chain().focus().toggleOrderedList().run(); break
    }
  }
}

onMounted(() => window.addEventListener('keydown', handleKeyDown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeyDown))

// ------------------------------
// Image Upload
// ------------------------------
function generateRandomTitle(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) result += chars[Math.floor(Math.random() * chars.length)]
  return result
}

async function addImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.jpg,.jpeg,.png'
  input.click()

  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event: any) => {
      const imageSrc = event.target.result
      editor.value.chain().focus().setImage({ src: imageSrc }).run()

      try {
        const title = generateRandomTitle()
        const uploadPath = await uploadImage(imageSrc, title)
        if (uploadPath) editor.value.chain().focus().setImage({ src: uploadPath }).run()
      } catch (error) {
        console.error('图片上传失败', error)
      }
    }
    reader.readAsDataURL(file)
  }
}

async function uploadImage(image: string, title: string) {
  return uploadDataUrl(image, 'article-image', { title, filename: `${title}.jpg` })
}
  </script>
  
  <style scoped>
  .owner-comment {
    background-color: #f0f8ff; /* 博主评论背景色 */
    border-left: 4px solid #007bff; /* 博主评论左边边框 */
  }
  </style>
  
