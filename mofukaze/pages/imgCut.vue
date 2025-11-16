<template>
  <div>
    <!-- 裁剪图片功能 -->
    <el-button @click="dialogVisible = true">添加封面信息</el-button>
    <el-dialog 
      v-model="dialogVisible"
      id="Box"
      @close="resetCropper">
      <h3>预览</h3>
      <div class="before"></div>
      <el-button @click="sureSava">确认裁剪</el-button>
      <el-button @click="resetCropper" type="warning">重置</el-button>
      <div class="box">
        <div class="box_1">
          <input type="file" @change="onFileChange" accept="image/*" />
          <img v-if="imageSrc" :src="imageSrc" ref="image" @load="initCropper" />
        </div>
      </div>
    </el-dialog>
      <!-- Display cropped image on the main page -->
  <div v-if="afterImg" class="cropped-image-container">
    <h3>裁剪后的封面</h3>
    <img :src="afterImg" alt="Cropped Image" />
  </div>

    <!-- 文章编辑功能 -->
    <div class="editor-container">
      <div class="input-group">
        <label for="title">标题:</label>
        <input id="title" v-model="title" type="text" placeholder="请输入文章标题" />
      </div>

      <div class="input-group">
        <label for="tag">标签:</label>
        <el-select
          v-model="tag"
          placeholder="选择文章类型"
          style="width: 240px"
        >
          <el-option
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>

      <div v-if="editor" class="editor-toolbar">
        <button
          @click="editor.chain().focus().toggleBold().run()"
          :disabled="!editor.can().chain().focus().toggleBold().run()"
          :class="{ 'is-active': editor.isActive('bold') }"
        >
          加粗
        </button>
        <button
          @click="editor.chain().focus().toggleItalic().run()"
          :disabled="!editor.can().chain().focus().toggleItalic().run()"
          :class="{ 'is-active': editor.isActive('italic') }"
        >
          斜体
        </button>
        <button
          @click="editor.chain().focus().toggleStrike().run()"
          :disabled="!editor.can().chain().focus().toggleStrike().run()"
          :class="{ 'is-active': editor.isActive('strike') }"
        >
          删除线
        </button>
        <button
          @click="editor.chain().focus().toggleCode().run()"
          :disabled="!editor.can().chain().focus().toggleCode().run()"
          :class="{ 'is-active': editor.isActive('code') }"
        >
          代码
        </button>
        <button @click="editor.chain().focus().unsetAllMarks().run()">
          清除格式
        </button>
        <button @click="editor.chain().focus().clearNodes().run()">
          清除节点
        </button>
        <button
          @click="editor.chain().focus().setParagraph().run()"
          :class="{ 'is-active': editor.isActive('paragraph') }"
        >
          段落
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
        >
          标题1
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
        >
          标题2
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
        >
          标题3
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 4 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 4 }) }"
        >
          标题4
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 5 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 5 }) }"
        >
          标题5
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 6 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 6 }) }"
        >
          标题6
        </button>
        <button
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'is-active': editor.isActive('bulletList') }"
        >
          无序列表
        </button>
        <button
          @click="editor.chain().focus().toggleOrderedList().run()"
          :class="{ 'is-active': editor.isActive('orderedList') }"
        >
          有序列表
        </button>
        <button
          @click="editor.chain().focus().toggleCodeBlock().run()"
          :class="{ 'is-active': editor.isActive('codeBlock') }"
        >
          代码块
        </button>
        <button
          @click="editor.chain().focus().toggleBlockquote().run()"
          :class="{ 'is-active': editor.isActive('blockquote') }"
        >
          引用
        </button>
        <button @click="editor.chain().focus().setHorizontalRule().run()">
          水平线
        </button>
        <button @click="editor.chain().focus().setHardBreak().run()">
          换行
        </button>
        <button
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().chain().focus().undo().run()"
        >
          撤销
        </button>
        <button
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().chain().focus().redo().run()"
        >
          重做
        </button>
        <button @click="addImage">
          添加图片
        </button>
      </div>
      <EditorContent class="editor-content" :editor="editor" />

      <div class="submit-container">
        <button @click="submitContent" class="submit-button">提交内容</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Cropper from "cropperjs";
import 'cropperjs/dist/cropper.css';
import { useRouter } from 'vue-router'

const editor = ref(useEditor({
  extensions: [StarterKit, Image],
  content: "<p>God Knows</p>",
}))

const title = ref('')
const tag = ref('')
const image = ref(null);
const myCropper = ref(null);
const afterImg = ref(''); 
const imageSrc = ref(null);
const dialogVisible = ref(false)


onBeforeUnmount(() => {
  editor.value.destroy()
})

// 初始化 Cropper 实例
const initCropper = () => {
  if (image.value) {
    myCropper.value = new Cropper(image.value, {
      aspectRatio: 1,
      viewMode: 3,
      dragMode: 'move',
      background: true,
      preview: '.before',
      autoCropArea: 1,
      zoomOnWheel: true,
      center: true,
      cropBoxResizable: false,
      cropBoxMovable: true,
    });
  } else {
    console.error("Image reference is null, Cropper initialization failed.");
  }
};

// 确认裁剪并保存预览（不立即存储）
const sureSava = () => {
  if (myCropper.value) {
    afterImg.value = myCropper.value.getCroppedCanvas({
      width: 200,
      height: 200,
      imageSmoothingQuality: 'high'
    }).toDataURL('image/jpeg');
    dialogVisible.value = false;
  } else {
    console.error("Cropper instance is not initialized.");
  }
};

// 重置 Cropper
const resetCropper = () => {
  if (myCropper.value) {
    myCropper.value.destroy();
    myCropper.value = null;
    imageSrc.value = null;
  }
};

// 上传图片时触发的事件
const onFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      imageSrc.value = event.target.result;
      onMounted(() => {
        initCropper();
      });
    };
    reader.readAsDataURL(file);
  }
};

// 添加图片到编辑器
function addImage() {
  const url = window.prompt('请输入图片URL')
  if (url) {
    editor.value.chain().focus().setImage({ src: url }).run()
  }
}


// 确保 submitContent 在 uploadImage 之后被调用
const uploadImage = async (image, title) => {
  try {
    const response = await fetch('/api/posts/collection/uploadImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image, title }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response not OK:', errorText);
      throw new Error('Image upload failed: ' + errorText);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error during image upload:', error);
    throw error;
  }
};

async function submitContent() {
  const content = editor.value.getHTML();
  let imageUrl = '';

  try {
    imageUrl = await uploadImage(afterImg.value, title.value); // 在提交时上传图片
  } catch (error) {
    console.error('图片上传失败', error);
    alert('图片上传失败，请重试');
    return;
  }

  // 这里是提交内容的逻辑
  try {
    const response = await fetch('/api/posts/collection/submitCollection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: title.value, content, tag: tag.value, imageUrl:imageUrl.filePath }),
    });

    const result = await response.json();
    if (result.status === 'success') {
      alert('提交成功');
    } else {
      console.error('提交失败:', result.message);
    }
  } catch (error) {
    console.error('提交内容失败', error);
  }
}


const options = [
  {
    value: '动漫',
    label: '动漫',
  },
  {
    value: '游戏',
    label: '游戏',
  },
  {
    value: '电影',
    label: '电影',
  },
  {
    value: '音乐',
    label: '音乐',
  },
]

const router = useRouter()
</script>


<style scoped>
.cropped-image-container {
  margin-top: 20px;
}

.cropped-image-container img {
  border: 1px solid #ddd;
  padding: 5px;
  background-color: #f9f9f9;
}
#Box {
  border: 1px silver solid;
  padding: 20px;
  margin-top: 20px;
  border-radius: 5px;
  height: 800px;
}

.before {
  width: 150px;
  height: 150px;
  position: relative;
  left: 150px;
  overflow: hidden;
}

.box {
  display: flex;
  column-gap: 6rem;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  div {
    flex: 1;
    height: 500px;
    background: #ccc;
    img {
      display: block;
      max-width: 100%;
      max-height: 100%;
    }
  }
}

.editor-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-group label {
  margin-bottom: 4px;
  font-weight: bold;
}

.input-group input,
.input-group select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.editor-toolbar button {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f5f5f5;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-family: 喵字摄影体;
}

.editor-toolbar button.is-active {
  background-color: #007bff;
  color: #fff;
}

.editor-toolbar button:disabled {
  background-color: #e0e0e0;
  cursor: not-allowed;
}

.editor-toolbar button:not(:disabled):hover {
  background-color: #e0e0e0;
}

.editor-content {
  border: 1px solid #ccc;
  padding: 8px;
  border-radius: 4px;
  min-height: 200px;
  background-color: #fff;
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