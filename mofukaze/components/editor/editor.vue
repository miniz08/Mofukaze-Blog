<template>
<div>
    <!-- ✏️ 编辑器正文 -->
    <div class="editor-content-wrapper">
      <EditorContent class="editor-content" :editor="editor" :style="{ fontSize: `${fontSize}px` }" />
    </div>

    <!-- 🌈 工具栏区域（移动到正文下方） -->
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
      title="代码块（Shift+Enter 在代码块内换行）"
    >
      <Code size="13" />
    </button>
    <button
      @click="addImage"
      title="添加图片"
    >
      <ImageIcon size="13" />
    </button>
    <button
      @click="addVideo"
      title="添加视频"
    >
      <Film size="13" />
    </button>
    <button
  @click="addLink"
  :class="{ 'is-active': editor.isActive('link') }"
  title="添加超链接"
>
  <LinkIcon size="13" />
</button>
    <button
      @click="openLatexInput()"
      :class="{ 'is-active': isLatexMode }"
      title="LaTeX 公式 (Ctrl+Shift+L)"
    >
      <Sigma size="13" />
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
    <div v-if="isLatexMode" class="latex-input-panel">
      <textarea
        ref="latexInputRef"
        v-model="latexSource"
        aria-label="LaTeX"
        class="latex-input"
        placeholder="E = mc^2"
        rows="3"
        @keydown.ctrl.enter.prevent="applyLatex"
        @keydown.meta.enter.prevent="applyLatex"
        @keydown.esc.prevent="closeLatexInput"
      ></textarea>
      <div class="latex-preview" v-html="latexPreviewHtml"></div>
      <div class="latex-actions">
        <button type="button" @click="applyLatex">插入</button>
        <button type="button" @click="closeLatexInput">取消</button>
      </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { Extension, Node, mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import ImageResize from 'tiptap-extension-resize-image'
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Code, Undo, Redo, Minus, Link as LinkIcon, Sigma, Image as ImageIcon, Film } from 'lucide-vue-next'
import Link from '@tiptap/extension-link'
import { LatexNode } from './latexNode'
import { renderLatexToHtml } from '~/utils/latex'

const { uploadResource } = useResourceUpload()
type MediaNodeName = 'imageResize' | 'video'
const inlineImageWrapperStyle = 'display: inline-block; float: none; margin: 0.25em 0.35em;'

const getDefaultInlineImageWidth = () => {
  const editorWidth = editor.value?.view.dom.clientWidth || 720
  return Math.round(Math.min(360, Math.max(160, editorWidth * 0.42)))
}

const createInlineImageAttrs = (src: string, alt: string) => {
  const width = getDefaultInlineImageWidth()

  return {
    src,
    alt,
    width,
    containerStyle: `width: ${width}px; height: auto; cursor: pointer; display: inline-block; float: none; margin: 0.25em 0.35em;`,
    wrapperStyle: inlineImageWrapperStyle,
  }
}
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
  return uploadResource(file, 'article-image', { title, filename: file.name })
}

async function uploadVideo(file: File, title: string) {
  return uploadResource(file, 'video', { title, filename: file.name })
}

// ------------------------------
// LaTeX Input
// ------------------------------
type LatexEditEvent = CustomEvent<{
  latex?: string
  pos?: number
}>

const isLatexMode = ref(false)
const latexSource = ref('')
const latexEditPos = ref<number | null>(null)
const latexInputRef = ref<HTMLTextAreaElement | null>(null)

const latexPreviewHtml = computed(() => {
  const source = latexSource.value.trim()
  return source ? renderLatexToHtml(source) : ''
})

function focusLatexInput() {
  nextTick(() => {
    latexInputRef.value?.focus()
    latexInputRef.value?.select()
  })
}

function getSelectedLatexSource() {
  if (!editor.value) return ''

  const { from, to, empty } = editor.value.state.selection
  return empty ? '' : editor.value.state.doc.textBetween(from, to, ' ')
}

function openLatexInput(source?: string, pos: number | null = null) {
  latexSource.value = source ?? getSelectedLatexSource()
  latexEditPos.value = pos
  isLatexMode.value = true
  focusLatexInput()
  return true
}

function closeLatexInput() {
  isLatexMode.value = false
  latexSource.value = ''
  latexEditPos.value = null
  editor.value?.commands.focus()
}

function updateLatexAtPosition(pos: number, latex: string) {
  return editor.value?.commands.command(({ tr }) => {
    const node = tr.doc.nodeAt(pos)
    if (node?.type.name !== 'latex') return false

    tr.setNodeMarkup(pos, undefined, { latex })
    return true
  })
}

function applyLatex() {
  const source = latexSource.value.trim()
  if (!source || !editor.value) return

  const updatedExistingNode =
    latexEditPos.value !== null && updateLatexAtPosition(latexEditPos.value, source)

  if (!updatedExistingNode) {
    editor.value.chain().focus().insertLatex({ latex: source }).run()
  }

  closeLatexInput()
}

function handleLatexEdit(event: Event) {
  const { latex = '', pos } = (event as LatexEditEvent).detail || {}
  openLatexInput(latex, typeof pos === 'number' ? pos : null)
}

const VideoNode = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [{ tag: 'video[src]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, {
      controls: '',
      preload: 'metadata',
      playsinline: '',
    })]
  },
})

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
      Enter: () => {
        if (!this.editor.isActive('codeBlock')) return false
        return this.editor.commands.exitCode()
      },
      'Shift-Enter': () => {
        if (!this.editor.isActive('codeBlock')) return false
        return this.editor.commands.insertContent('\n')
      },
      'Mod-l': () => openLatexInput(),
      'Mod-alt-l': () => {
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
        addImage()
        return true
      },
      'Mod-Shift-v': () => {
        addVideo()
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
  extensions: [StarterKit, ImageResize.configure({
    inline: true,
    minWidth: 48,
  }), VideoNode, LatexNode, Link.configure({
    openOnClick: true,
    linkOnPaste: true,
  }), CustomShortcuts],
  content: props.modelValue || '<p></p>',
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
}))

const fontSize = ref(16)

// 监听外部内容变化
watch(() => props.modelValue, (newValue) => {
  const nextContent = newValue || '<p></p>'
  if (editor.value && editor.value.getHTML() !== nextContent) {
    editor.value.commands.setContent(nextContent)
  }
})

// 暴露方法供父组件调用
defineExpose({
  getHTML: () => editor.value?.getHTML() || '',
  getJSON: () => editor.value?.getJSON() || null,
  setContent: (content: string) => editor.value?.commands.setContent(content)
})

onMounted(() => {
  window.addEventListener('mofukaze:edit-latex', handleLatexEdit)
})

onBeforeUnmount(() => {
  window.removeEventListener('mofukaze:edit-latex', handleLatexEdit)
  editor.value?.destroy()
})
// ------------------------------
// Image Upload (for toolbar button)
// ------------------------------
function replaceNodeSource(nodeName: MediaNodeName, localSrc: string, remoteSrc: string) {
  const instance = editor.value
  if (!instance) return

  let updated = false
  instance.commands.command(({ state, tr, dispatch }) => {
    state.doc.descendants((node, pos) => {
      if (node.type.name !== nodeName || node.attrs.src !== localSrc) return

      tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: remoteSrc })
      updated = true
      return false
    })

    if (!updated) return false

    dispatch?.(tr)
    return true
  })

  if (!updated) {
    instance.chain().focus().updateAttributes(nodeName, { src: remoteSrc }).run()
  }
}

async function addImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.click()

  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return

    const imageSrc = URL.createObjectURL(file)
    editor.value
      .chain()
      .focus()
      .insertContent({ type: 'imageResize', attrs: createInlineImageAttrs(imageSrc, file.name) })
      .run()

    try {
      const title = generateRandomTitle()
      const uploadPath = await uploadImage(file, title)

      if (uploadPath) {
        replaceNodeSource('imageResize', imageSrc, uploadPath)
      }

    } catch (error) {
      console.error('图片上传失败', error)
    } finally {
      URL.revokeObjectURL(imageSrc)
    }
  }
}

async function addVideo() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'video/*'
  input.click()

  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return

    const videoSrc = URL.createObjectURL(file)
    editor.value
      .chain()
      .focus()
      .insertContent({ type: 'video', attrs: { src: videoSrc } })
      .run()

    try {
      const title = generateRandomTitle()
      const uploadPath = await uploadVideo(file, title)
      if (uploadPath) {
        replaceNodeSource('video', videoSrc, uploadPath)
      }
    } catch (error) {
      console.error('视频上传失败', error)
    } finally {
      URL.revokeObjectURL(videoSrc)
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
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent),
    var(--surface-soft);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  box-shadow: 0 8px 22px color-mix(in srgb, var(--theme-shadow) 52%, transparent);
  margin: 0.6rem;
  backdrop-filter: blur(12px) saturate(125%);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.editor-toolbar button {
  align-items: center;
  background: color-mix(in srgb, var(--surface-reading) 76%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  color: var(--theme-text);
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  gap: 4px;
  min-height: 30px;
  padding: 5px 8px;
  transition: background 0.22s ease, border-color 0.22s ease, color 0.22s ease, transform 0.22s ease;
}

.editor-toolbar button.is-active {
  background: color-mix(in srgb, var(--theme-accent) 24%, var(--surface-soft));
  border-color: color-mix(in srgb, var(--theme-accent) 48%, var(--border-soft));
  color: color-mix(in srgb, var(--theme-accent) 72%, var(--theme-text));
}

.editor-toolbar button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.editor-toolbar button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--theme-accent) 16%, var(--surface-soft));
  border-color: color-mix(in srgb, var(--theme-accent) 40%, var(--border-soft));
  color: color-mix(in srgb, var(--theme-accent) 72%, var(--theme-text));
  transform: translateY(-1px);
}

.latex-input-panel {
  display: grid;
  gap: 10px;
  margin: 0 0.6rem 0.8rem;
  padding: 12px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: var(--surface-card);
}

.latex-input {
  width: 100%;
  min-height: 72px;
  resize: vertical;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface-reading) 78%, var(--surface-soft));
  color: var(--theme-text);
  padding: 9px 10px;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 14px;
}

.latex-preview {
  min-height: 42px;
  overflow-x: auto;
  border: 1px dashed var(--border-soft);
  border-radius: 8px;
  padding: 10px;
  background: var(--surface-reading);
}

.latex-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.latex-actions button {
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: var(--surface-soft);
  color: var(--theme-text);
  cursor: pointer;
  padding: 6px 12px;
}

:deep(.latex-node) {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  overflow-x: auto;
  vertical-align: middle;
}

:deep(.latex-node.is-selected) {
  outline: 2px solid var(--theme-accent);
  outline-offset: 2px;
}

/* ✏️ 编辑区 */
.editor-content-wrapper {
  border: 1px solid var(--border-soft);
  padding: 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface-reading) 86%, var(--surface-soft));
  color: var(--theme-text);
  min-height: 240px;
}

.editor-content-wrapper :deep(.ProseMirror) {
  min-height: 216px;
  outline: none;
}

.editor-content-wrapper :deep(.ProseMirror p) {
  line-height: 1.9;
}

.editor-content-wrapper :deep(.ProseMirror p:first-child) {
  margin-top: 0;
}

.editor-content-wrapper :deep(.ProseMirror p:last-child) {
  margin-bottom: 0;
}

.editor-content-wrapper :deep(.ProseMirror img:not([src^="data:image/svg+xml"])) {
  border-radius: 8px;
  display: inline-block;
  height: auto;
  margin: 0;
  max-height: 70vh;
  max-width: 100%;
  object-fit: contain;
  vertical-align: middle;
}

.editor-content-wrapper :deep([data-resize-image-ui="resize-handle"]) {
  background: var(--surface-reading) !important;
  border-color: var(--theme-accent) !important;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-accent) 18%, transparent);
}

.editor-content-wrapper :deep([data-resize-image-ui="position-controller"]) {
  background: var(--surface-floating) !important;
  border-color: var(--border-medium) !important;
  box-shadow: 0 8px 22px color-mix(in srgb, var(--theme-shadow) 60%, transparent);
  backdrop-filter: blur(12px) saturate(125%);
}

.editor-content-wrapper :deep(video) {
  border-radius: 8px;
  display: block;
  margin: 14px auto;
  max-height: 70vh;
  max-width: 100%;
}

@media (max-width: 820px) {
  .editor-toolbar {
    gap: 7px;
    margin: 0.45rem 0;
    overflow-x: auto;
    padding: 9px;
    scrollbar-width: none;
  }

  .editor-toolbar::-webkit-scrollbar {
    display: none;
  }

  .toolbar-group {
    flex: 0 0 auto;
  }

  .editor-toolbar button {
    min-height: 34px;
    min-width: 34px;
    padding: 6px 8px;
  }

  .latex-input-panel {
    margin: 0 0 0.7rem;
  }

  .editor-content-wrapper {
    min-height: 220px;
    padding: 10px;
  }

  .editor-content-wrapper :deep(.ProseMirror) {
    min-height: 198px;
  }
}

@media (max-width: 520px) {
  .editor-toolbar {
    align-items: center;
    flex-wrap: nowrap;
  }

  .editor-toolbar button {
    font-size: 13px;
  }

  .editor-content-wrapper {
    border-radius: 8px;
  }
}
</style>
