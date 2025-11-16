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

    <!-- ✏️ 编辑器内容区 + 工具栏 -->
    <div class="content-and-toolbar">



      <!-- 🌈 工具栏 -->
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
      <!-- 编辑区 -->
      <div class="editor-content-wrapper">
        <EditorContent
          class="editor-content"
          :editor="editor"
          :style="{ fontSize: `${fontSize}px` }"
        />
      </div>
      <!-- 💾 保存按钮 -->
      <div class="submit-container">
        <button @click="submitContent" class="submit-button">
          保存
        </button>
      </div>

    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { useRouter, useRoute } from 'vue-router'
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Code, Undo, Redo, Minus } from 'lucide-vue-next'

// ------------------------------
// 🌸 基础初始化
// ------------------------------
const router = useRouter()
const route = useRoute()

const title = ref('')
const tag = ref('')
const id = ref<string | null>(null)
const fontSize = ref(16)

// ------------------------------
// 🖊️ 编辑器初始化
// ------------------------------
const editor = useEditor({
  extensions: [StarterKit, Image],
  content: '<p>God Knows</p>',
})

// 组件卸载时销毁编辑器
onBeforeUnmount(() => {
  editor.value?.destroy()
})

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
    console.log('[DEBUG] 加载到数据：', data)

    if (data && data.length > 0) {
      title.value = data[0].title
      tag.value = data[0].tag
      editor.value?.commands.setContent(data[0].content)
    }
  } catch (error) {
    console.error('❌ 获取文章失败:', error)
  }
})

// ------------------------------
// 💾 提交内容（保存修改）
// ------------------------------
async function submitContent() {
  const content = editor.value?.getHTML() || ''
  try {
    const response = await fetch('/api/posts/collection/editCollection', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: id.value,
        title: title.value,
        content,
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

// ------------------------------
// 🔠 字体大小调整
// ------------------------------
function increaseFontSize() {
  fontSize.value += 2
  updateFontSize()
}

function decreaseFontSize() {
  fontSize.value = Math.max(fontSize.value - 2, 10)
  updateFontSize()
}

function updateFontSize() {
  const editorEl = document.querySelector('.ProseMirror') as HTMLElement
  if (editorEl) {
    editorEl.style.fontSize = `${fontSize.value}px`
  }
}

// ------------------------------
// ⌨️ 键盘快捷键支持
// ------------------------------
function handleKeyDown(event: KeyboardEvent) {
  if (!editor.value) return

  if (event.key === 'Tab') {
    event.preventDefault()
    handleTabIndent()
  }

  if (event.ctrlKey) {
    handleCtrlShortcuts(event)
  }
}

function handleTabIndent() {
  if (!editor.value) return

  if (editor.value.isActive('listItem')) {
    editor.value.chain().focus().sinkListItem('listItem').run()
  } else {
    editor.value.chain().focus().insertContent('    ').run()
  }
}

function handleCtrlShortcuts(event: KeyboardEvent) {
  if (!editor.value) return

  switch (event.key) {
    case 'b': // Ctrl + B 加粗
      event.preventDefault()
      editor.value.chain().focus().toggleBold().run()
      break
    case 'i': // Ctrl + I 斜体
      event.preventDefault()
      editor.value.chain().focus().toggleItalic().run()
      break
    case 'z': // Ctrl + Z 撤销
      event.preventDefault()
      editor.value.chain().focus().undo().run()
      break
    case '1': // Ctrl + 1 一级标题
      event.preventDefault()
      editor.value.chain().focus().toggleHeading({ level: 1 }).run()
      break
    case '2': // Ctrl + 2 二级标题
      event.preventDefault()
      editor.value.chain().focus().toggleHeading({ level: 2 }).run()
      break
    case '3': // Ctrl + 3 三级标题
      event.preventDefault()
      editor.value.chain().focus().toggleHeading({ level: 3 }).run()
      break
    case 'o': // Ctrl + O 有序列表
      event.preventDefault()
      editor.value.chain().focus().toggleOrderedList().run()
      break
  }
}

// ------------------------------
// 🖼️ 图片上传逻辑
// ------------------------------
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
      editor.value?.chain().focus().setImage({ src: imageSrc }).run()

      try {
        const title = generateRandomTitle()
        const uploadPath = await uploadImage(imageSrc, title)
        if (uploadPath) {
          editor.value?.chain().focus().setImage({ src: uploadPath }).run()
        }
      } catch (error) {
        console.error('❌ 图片上传失败:', error)
      }
    }

    reader.readAsDataURL(file)
  }
}

function generateRandomTitle(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

async function uploadImage(image: string, title: string) {
  try {
    const response = await fetch('/api/posts/article/uploadImage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, title }),
    })

    if (!response.ok) throw new Error(await response.text())
    const result = await response.json()

    if (result.status === 'success' && result.filePath) {
      return result.filePath
    } else {
      throw new Error('图片上传失败')
    }
  } catch (error) {
    console.error('❌ 上传出错:', error)
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
