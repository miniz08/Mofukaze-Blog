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
    <button
  @click="addLink"
  :class="{ 'is-active': editor.isActive('link') }"
  title="添加超链接"
>
  <LinkIcon size="13" />
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
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Code, Undo, Redo, Minus, Link as LinkIcon } from 'lucide-vue-next'
import { useAdmin } from '~/composables/useAdmin'
import Link from '@tiptap/extension-link'

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
// Image Upload Helper Functions
// ------------------------------
function generateRandomTitle(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) result += chars[Math.floor(Math.random() * chars.length)]
  return result
}

async function uploadImage(file: File, title: string) {
  try {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('title', title)

    const res = await fetch('/api/posts/article/uploadImage', {
      method: 'POST',
      headers: {
        ...admin.getAuthHeader()   // ⭐ 加上管理员鉴权 Header
        // 注意：不要设置 Content-Type，让浏览器自动设置 multipart/form-data boundary
      },
      body: formData
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

// ------------------------------
// Keyboard Shortcuts
// ------------------------------
const CustomShortcuts = Extension.create({
  name: 'customShortcuts',
  addKeyboardShortcuts() {
    return {
      'Mod-b': () => this.editor.chain().focus().toggleBold().run(),
      'Mod-i': () => this.editor.chain().focus().toggleItalic().run(),
      'Mod-z': () => this.editor.chain().focus().undo().run(),
      'Mod-Shift-z': () => this.editor.chain().focus().redo().run(),

      'Mod-1': () => this.editor.chain().focus().toggleHeading({ level: 1 }).run(),
      'Mod-2': () => this.editor.chain().focus().toggleHeading({ level: 2 }).run(),
      'Mod-3': () => this.editor.chain().focus().toggleHeading({ level: 3 }).run(),

      'Mod-o': () => this.editor.chain().focus().toggleOrderedList().run(),
      'Mod-n': () => this.editor.chain().focus().toggleBulletList().run(),
      'Mod-Shift-c': () => this.editor.chain().focus().toggleCodeBlock().run(),
      'Mod-l': () => {
      const url = prompt("请输入链接 URL 💡")
      if (url) {
      this.editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run()
      }
      return true
      },
      // P - 添加图片
      'Mod-p': () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.jpg,.jpeg,.png'
        input.click()

        input.onchange = async (e: any) => {
          const file = e.target.files[0]
          if (!file) return

          // 创建临时预览 URL
          const imageSrc = URL.createObjectURL(file)
          
          // 插入临时图片并记录位置
          this.editor.chain().focus().setImage({ src: imageSrc }).run()
          
          // 记录插入位置（在插入后立即获取）
          const currentPos = this.editor.state.selection.anchor

          try {
            const title = generateRandomTitle()
            const uploadPath = await uploadImage(file, title)
            if (uploadPath) {
              // 查找包含 blob URL 的图片节点并替换
              let imagePos: number | null = null
              this.editor.state.doc.descendants((node, pos) => {
                if (node.type.name === 'image' && node.attrs.src === imageSrc) {
                  imagePos = pos
                  return false // 停止遍历
                }
              })
              
              if (imagePos !== null) {
                // 选中图片节点并更新
                this.editor
                  .chain()
                  .setTextSelection({ from: imagePos, to: imagePos + 1 })
                  .updateAttributes('image', { src: uploadPath })
                  .run()
              } else {
                // 如果找不到，尝试更新当前选中的图片
                this.editor
                  .chain()
                  .focus()
                  .updateAttributes('image', { src: uploadPath })
                  .run()
              }
            }
          } catch (error) {
            console.error('图片上传失败', error)
          } finally {
            // 清理临时 URL
            URL.revokeObjectURL(imageSrc)
          }
        }
        return true
      },

      // Tab（列表缩进）
      Tab: () => {
        if (this.editor.isActive('listItem')) {
          return this.editor.chain().focus().sinkListItem('listItem').run()
        }
        return this.editor.chain().focus().insertContent('    ').run()
      },
    }
  },
})

// ------------------------------
// Editor State
// ------------------------------
const editor = ref(useEditor({
  extensions: [StarterKit, Image,Link.configure({
    openOnClick: true,
    linkOnPaste: true,
  }), CustomShortcuts],
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
// Image Upload (for toolbar button)
// ------------------------------
async function addImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.jpg,.jpeg,.png'
  input.click()

  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return

    // 1️⃣ 创建临时预览 URL
    const imageSrc = URL.createObjectURL(file)

    // 插入临时图片
    editor.value.chain().focus().setImage({ src: imageSrc }).run()

    try {
      const title = generateRandomTitle()
      // 2️⃣ 上传图片
      const uploadPath = await uploadImage(file, title)

      if (uploadPath) {
        // 3️⃣ 查找包含 blob URL 的图片节点并替换
        let imagePos: number | null = null
        editor.value.state.doc.descendants((node, pos) => {
          if (node.type.name === 'image' && node.attrs.src === imageSrc) {
            imagePos = pos
            return false // 停止遍历
          }
        })
        
        if (imagePos !== null) {
          // 选中图片节点并更新
          editor.value
            .chain()
            .setTextSelection({ from: imagePos, to: imagePos + 1 })
            .updateAttributes('image', { src: uploadPath })
            .run()
        } else {
          // 如果找不到，尝试更新当前选中的图片
          editor.value
            .chain()
            .focus()
            .updateAttributes('image', { src: uploadPath })
            .run()
        }
      }

    } catch (error) {
      console.error('图片上传失败', error)
    } finally {
      // 4️⃣ 无论成功失败，都撤销临时 URL
      URL.revokeObjectURL(imageSrc)
    }
  }
}
function addLink() {
  const url = prompt("请输入链接 URL 💡")
  if (url) {
    editor.value
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run()
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