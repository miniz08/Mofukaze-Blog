<template>
  <el-button @click="dialogVisible = true">添加封面信息</el-button>
  <el-dialog 
    v-model="dialogVisible"
    id="Box">
    <h3>预览</h3>
    <div class="before"></div>
    <el-button @click="sureSava">裁剪</el-button>
    <el-button @click="resetCropper" type="warning">重置</el-button>
    <div class="box">
      <div class="box_1">
        <input type="file" @change="onFileChange" accept="image/*" />
        <img v-if="imageSrc" :src="imageSrc" ref="image" @load="initCropper" />
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Cropper from "cropperjs";
import 'cropperjs/dist/cropper.css';

const image = ref(null); // 用于绑定图片的ref
const myCropper = ref(null); // 用于存储 Cropper 实例的ref
const afterImg = ref(''); // 用于存储裁剪后的图片
const imageSrc = ref(null); // 存储上传图片的路径
const dialogVisible = ref(false)

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
      zoomable: true,
      ready() {
      }
    });
  } else {
    console.error("⚠️ Image reference is null, Cropper initialization failed.");
  }
};

const sureSava = () => {
  if (myCropper.value) {
    afterImg.value = myCropper.value.getCroppedCanvas({
      width: 200,
      height: 200,
      imageSmoothingQuality: 'high'
    }).toDataURL('image/jpeg');
  } else {
    console.error("⚠️ Cropper instance is not initialized.");
  }
};

const resetCropper = () => {
  if (myCropper.value) {
    myCropper.value.destroy();
    myCropper.value = null;
    imageSrc.value = null;
  }
};

const onFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      imageSrc.value = event.target.result;

      // 重新初始化 Cropper
      onMounted(() => {
        initCropper();
      });
    };
    reader.readAsDataURL(file);
  } else {
    console.warn('用户未选择文件');
  }
};

onMounted(() => {
  if (image.value && image.value.complete) {
    initCropper();
  }
});
</script>
