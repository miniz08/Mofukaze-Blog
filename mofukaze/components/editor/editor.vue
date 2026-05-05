<template>
<div>
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
<div >
</div>
    <!-- ✏️ 编辑器正文 -->
    <div class="editor-content-wrapper">
      <EditorContent class="editor-content" :editor="editor" :style="{ fontSize: `${fontSize}px` }" />
    </div>
</div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Code, Undo, Redo, Minus } from 'lucide-vue-next'
import { useAdmin } from '~/composables/useAdmin'
const admin = useAdmin()
// ------------------------------
// Props & Emits
// ------------------------------
const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// ------------------------------
// Editor State
// ------------------------------
const editor = ref(useEditor({
  extensions: [StarterKit, Image],
  content: props.modelValue || "<p>God  Only Knows</p>",
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
}))

const fontSize = ref(16)

// 监听外部内容变化
watch(() => props.modelValue, (newValue) => {
  if (newValue && editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue)
  }
})

// 暴露方法供父组件调用
defineExpose({
  getHTML: () => editor.value?.getHTML() || '',
  getJSON: () => editor.value?.getJSON() || null,
  setContent: (content: string) => editor.value?.commands.setContent(content)
})


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
  try {
    const res = await fetch('/api/posts/article/uploadImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...admin.getAuthHeader()   // ⭐ 加上管理员鉴权 Header
      },
      body: JSON.stringify({ image, title })
    })

    if (!res.ok) throw new Error(await res.text())

    const result = await res.json()
    if (result.status === 'success' && result.fileUrl) {
      return result.fileUrl
    } else {
      throw new Error('图片上传失败')
    }
  } catch (error) {
    console.error(error)
    throw error
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
  margin: 0.6rem;
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
</style>