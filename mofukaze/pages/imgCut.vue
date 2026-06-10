<template>
  <section class="collection-editor-page">
    <header class="collection-editor-header">
      <div>
        <p>Collection Editor</p>
        <h1>添加收藏</h1>
      </div>
      <button type="button" class="primary-action" @click="dialogVisible = true">
        选择封面
      </button>
    </header>

    <div class="collection-form">
      <div class="meta-grid">
        <label>
          <span>标题</span>
          <input v-model.trim="title" type="text" placeholder="请输入标题" />
        </label>

        <label>
          <span>标签</span>
          <el-select v-model="tag" placeholder="选择收藏类型" class="tag-select">
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </label>
      </div>

      <div class="cover-strip" :class="{ empty: !coverPreview }">
        <img v-if="coverPreview" :src="coverPreview" alt="收藏封面预览" />
        <div>
          <span>封面</span>
          <strong>{{ coverPreview ? '已裁剪' : '尚未选择' }}</strong>
        </div>
        <button type="button" @click="dialogVisible = true">
          {{ coverPreview ? '重新裁剪' : '添加封面' }}
        </button>
      </div>

      <Editor ref="editorRef" v-model="content" />

      <div class="submit-container">
        <button
          type="button"
          class="submit-button"
          :disabled="isSubmitting"
          @click="submitContent"
        >
          {{ isSubmitting ? '提交中...' : '提交内容' }}
        </button>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="封面裁剪"
      width="min(920px, 92vw)"
      @closed="resetCropper"
    >
      <div class="cropper-panel">
        <div class="cropper-toolbar">
          <button
            v-for="ratio in cropRatios"
            :key="ratio.label"
            type="button"
            :class="{ active: selectedRatio.label === ratio.label }"
            @click="selectRatio(ratio)"
          >
            {{ ratio.label }}
          </button>
          <input type="file" accept="image/*" @change="onFileChange" />
        </div>

        <div class="cropper-layout">
          <div class="cropper-source">
            <img v-if="imageSrc" ref="imageRef" :src="imageSrc" alt="待裁剪图片" @load="initCropper" />
            <div v-else class="cropper-empty">请选择图片</div>
          </div>

          <div class="cropper-preview-wrap">
            <span>预览</span>
            <div
              class="cropper-preview"
              :style="{ aspectRatio: `${selectedRatio.width} / ${selectedRatio.height}` }"
            ></div>
          </div>
        </div>

        <div class="cropper-actions">
          <button type="button" @click="resetCropper">重置</button>
          <button type="button" class="primary-action" @click="confirmCrop">
            确认裁剪
          </button>
        </div>
      </div>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import Editor from '~/components/editor/editor.vue'

type CropRatio = {
  label: string
  value: number
  width: number
  height: number
}

const cropRatios: CropRatio[] = [
  { label: '3:4', value: 3 / 4, width: 900, height: 1200 },
  { label: '1:1', value: 1, width: 1000, height: 1000 },
  { label: '16:9', value: 16 / 9, width: 1280, height: 720 },
]

const options = [
  { value: '动漫', label: '动漫' },
  { value: '游戏', label: '游戏' },
  { value: '电影', label: '电影' },
  { value: '音乐', label: '音乐' },
]

const router = useRouter()
const admin = useAdmin()
const { uploadResource } = useResourceUpload()

const title = ref('')
const tag = ref('')
const content = ref('<p>God Knows</p>')
const editorRef = ref<InstanceType<typeof Editor> | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)
const cropper = ref<Cropper | null>(null)
const imageSrc = ref('')
const coverPreview = ref('')
const coverBlob = ref<Blob | null>(null)
const dialogVisible = ref(false)
const isSubmitting = ref(false)
const selectedRatio = ref<CropRatio>(cropRatios[0])
const sourceObjectUrl = ref('')
const previewObjectUrl = ref('')

const coverFilename = computed(() => {
  const safeTitle = title.value.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') || 'collection-cover'
  return `${safeTitle}.jpg`
})

watch(tag, (nextTag) => {
  if (coverBlob.value) return
  selectedRatio.value = nextTag === '音乐' ? cropRatios[1] : cropRatios[0]
  cropper.value?.setAspectRatio(selectedRatio.value.value)
})

function revokeSourceUrl() {
  if (sourceObjectUrl.value) URL.revokeObjectURL(sourceObjectUrl.value)
  sourceObjectUrl.value = ''
}

function revokePreviewUrl() {
  if (previewObjectUrl.value) URL.revokeObjectURL(previewObjectUrl.value)
  previewObjectUrl.value = ''
}

function initCropper() {
  if (!imageRef.value) return

  cropper.value?.destroy()
  cropper.value = new Cropper(imageRef.value, {
    aspectRatio: selectedRatio.value.value,
    viewMode: 2,
    dragMode: 'move',
    autoCropArea: 0.92,
    background: false,
    center: true,
    preview: '.cropper-preview',
    responsive: true,
    checkOrientation: true,
  })
}

function selectRatio(ratio: CropRatio) {
  selectedRatio.value = ratio
  cropper.value?.setAspectRatio(ratio.value)
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  revokeSourceUrl()
  sourceObjectUrl.value = URL.createObjectURL(file)
  imageSrc.value = sourceObjectUrl.value
  nextTick(initCropper)
}

async function confirmCrop() {
  if (!cropper.value) {
    alert('请先选择封面图片')
    return
  }

  const canvas = cropper.value.getCroppedCanvas({
    width: selectedRatio.value.width,
    height: selectedRatio.value.height,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  })

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.92)
  })

  if (!blob) {
    alert('封面裁剪失败，请换一张图片试试')
    return
  }

  revokePreviewUrl()
  coverBlob.value = blob
  previewObjectUrl.value = URL.createObjectURL(blob)
  coverPreview.value = previewObjectUrl.value
  dialogVisible.value = false
}

function resetCropper() {
  cropper.value?.destroy()
  cropper.value = null
  imageSrc.value = ''
  revokeSourceUrl()
}

async function submitContent() {
  const htmlContent = editorRef.value?.getHTML() || content.value

  if (!title.value || !tag.value) {
    alert('标题和标签不能为空')
    return
  }

  if (!coverBlob.value) {
    alert('请先选择并裁剪封面')
    return
  }

  if (/blob:/.test(htmlContent)) {
    alert('有资源还在上传中，请稍等一下')
    return
  }

  isSubmitting.value = true
  try {
    const imageUrl = await uploadResource(coverBlob.value, 'collection-cover', {
      title: title.value,
      filename: coverFilename.value,
    })

    const response = await fetch('/api/posts/collection/submitCollection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...admin.getAuthHeader(),
      },
      body: JSON.stringify({
        title: title.value,
        content: htmlContent,
        tag: tag.value,
        imageUrl,
      }),
    })

    const result = await response.json()
    if (result.status !== 'success') {
      throw new Error(result.message || '提交失败')
    }

    alert('提交成功')
    router.push('/collection')
  } catch (error: any) {
    console.error('提交内容失败', error)
    alert(error?.message || '提交失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

onBeforeUnmount(() => {
  resetCropper()
  revokePreviewUrl()
})
</script>

<style scoped>
.collection-editor-page {
  color: var(--theme-text);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.collection-editor-header {
  align-items: center;
  display: flex;
  gap: 18px;
  justify-content: space-between;
}

.collection-editor-header p,
.cover-strip span,
.cropper-preview-wrap span {
  color: var(--theme-accent);
  font-size: 13px;
  letter-spacing: 0;
  margin: 0 0 4px;
}

.collection-editor-header h1 {
  font-size: clamp(28px, 4vw, 42px);
  margin: 0;
}

.collection-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.meta-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1fr) 260px;
}

.meta-grid label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-grid input,
:deep(.tag-select .el-select__wrapper) {
  background: color-mix(in srgb, var(--surface-reading) 72%, var(--surface-soft));
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  box-shadow: none;
  color: var(--theme-text);
  min-height: 42px;
}

.meta-grid input {
  box-sizing: border-box;
  font: inherit;
  padding: 10px 12px;
}

.tag-select {
  width: 100%;
}

.cover-strip {
  align-items: center;
  background: var(--surface-card);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  display: grid;
  gap: 14px;
  grid-template-columns: 74px minmax(0, 1fr) auto;
  min-height: 90px;
  padding: 10px;
}

.cover-strip.empty {
  grid-template-columns: minmax(0, 1fr) auto;
}

.cover-strip img {
  aspect-ratio: 3 / 4;
  border-radius: 6px;
  height: 74px;
  object-fit: cover;
  width: 74px;
}

.cover-strip strong {
  display: block;
  font-size: 18px;
}

button {
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
}

.primary-action,
.submit-button,
.cover-strip button,
.cropper-toolbar button,
.cropper-actions button {
  background: color-mix(in srgb, var(--theme-accent) 24%, var(--surface-soft));
  border: 1px solid color-mix(in srgb, var(--theme-accent) 24%, var(--border-soft));
  color: var(--theme-text);
  padding: 10px 14px;
  transition: background 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}

.primary-action:hover,
.submit-button:hover:not(:disabled),
.cover-strip button:hover,
.cropper-toolbar button:hover,
.cropper-toolbar button.active,
.cropper-actions button:hover {
  background: color-mix(in srgb, var(--theme-accent) 34%, var(--surface-soft));
  box-shadow: 0 8px 22px var(--theme-shadow);
  transform: translateY(-1px);
}

.submit-container {
  display: flex;
  justify-content: flex-end;
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.cropper-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cropper-toolbar {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.cropper-toolbar input {
  color: var(--theme-text);
}

.cropper-layout {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) 180px;
  min-height: 420px;
}

.cropper-source {
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  border: 1px dashed var(--border-medium);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.cropper-source img {
  display: block;
  max-height: 420px;
  max-width: 100%;
}

.cropper-empty {
  color: var(--readable-muted);
}

.cropper-preview-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cropper-preview {
  aspect-ratio: 3 / 4;
  border-radius: 8px;
  overflow: hidden;
  width: 160px;
}

.cropper-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

:deep(.el-dialog) {
  background: var(--surface-reading);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  color: var(--theme-text);
}

:deep(.el-dialog__title),
:deep(.el-dialog__body) {
  color: var(--theme-text);
}

@media (max-width: 760px) {
  .collection-editor-header,
  .meta-grid,
  .cropper-layout {
    grid-template-columns: 1fr;
  }

  .collection-editor-header {
    align-items: stretch;
    flex-direction: column;
  }

  .cover-strip,
  .cover-strip.empty {
    grid-template-columns: 1fr;
  }

  .cropper-preview {
    width: 100%;
  }
}
</style>
