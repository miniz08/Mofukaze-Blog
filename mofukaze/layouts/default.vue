<template>
  <div id="wrapper">
    <!-- 背景 -->
    <div id="background"></div>

    <!-- 顶部导航 -->
    <Top class="top-global" />

    <!-- 页面内容 -->
    <div id="content">
      <div class="paper">
        <slot /> <!-- ✅ Nuxt布局用 slot，VueRouter 用 router-view -->
      </div>
    </div>

    <!-- 固定按钮（位于最外层，不在 paper 内） -->
    <button @click="scrollTop" class="fixed-button" id="back-to-top">
      回到顶部
    </button>
    <button @click="scrollBottom" class="fixed-button" id="back-to-bottom">
      回到底部
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

useVisitTracker()

function scrollTop() {
  const target = document.scrollingElement || document.documentElement || document.body
  target.scrollTo({ top: 0, behavior: 'smooth' })
}

function scrollBottom() {
  const target = document.scrollingElement || document.documentElement || document.body
  target.scrollTo({ top: target.scrollHeight, behavior: 'smooth' })
}



// ✅ Nuxt专用SEO函数
useSeoMeta({
  title: 'Mofukaze',
  ogTitle: '北风',
  description: '夹杂雪花的强风，来自北方的孤风。',
  ogDescription: '夹杂雪花的强风，来自北方的孤风。',
})
</script>

<style>
@font-face {
  font-family: "喵字摄影体";
  src: url("/font/%E5%96%B5%E5%AD%97%E6%91%84%E5%BD%B1%E4%BD%93.ttf") format("truetype");
  font-weight: normal;
  font-style: normal;
}


/* 全局字体 */
html, body {
  font-family: "喵字摄影体", sans-serif;
}


html, body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto; /* ✅ 允许纵向滚动 */
}

.paper > top,
.paper > .top-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 2000;
  pointer-events: auto;
}

/* 为了不让内容被顶部遮住，加个上间距 */
#content {
  padding-top: 160px; /* 顶部栏高度 + 一点空隙 */
}
/* 🌌 整体布局 */
#wrapper {
  position: relative;
  min-height: 80%;
}

/* 🌠 背景图 */
#background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
background: url('http://mofukaze.me/img/frame/Koishi in the sky.jpg') no-repeat center center fixed;
  background-size: cover;
  z-index: -3;
  filter: brightness(0.95) saturate(110%);
  animation: backgroundDrift 36s ease-in-out infinite alternate;
  transform: scale(1.03);
  transform-origin: center;
}

#background::before {
  content: "";
  position: fixed;
  inset: -12%;
  pointer-events: none;
  background:
    linear-gradient(118deg, transparent 10%, rgba(132, 196, 255, 0.18) 32%, transparent 58%),
    linear-gradient(62deg, transparent 18%, rgba(255, 172, 214, 0.12) 45%, transparent 72%),
    linear-gradient(158deg, transparent 20%, rgba(122, 224, 196, 0.12) 54%, transparent 78%);
  mix-blend-mode: screen;
  opacity: 0.78;
  animation: auroraSweep 18s ease-in-out infinite alternate;
}

@keyframes backgroundDrift {
  from { transform: scale(1.03) translate3d(-0.6%, -0.4%, 0); }
  to { transform: scale(1.07) translate3d(0.7%, 0.5%, 0); }
}

@keyframes auroraSweep {
  from { transform: translate3d(-4%, -2%, 0) rotate(0.5deg); opacity: 0.45; }
  to { transform: translate3d(4%, 3%, 0) rotate(-0.8deg); opacity: 0.82; }
}

/* 🌌 星光粒子层（主星层） */
#background::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  background-image:
    radial-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px),
    radial-gradient(rgba(255, 255, 255, 0.3) 2px, transparent 2px),
    radial-gradient(rgba(255, 255, 255, 0.1) 3px, transparent 3px);
  background-size: 120px 120px, 240px 240px, 360px 360px;
  animation: floatStars 60s linear infinite, twinkleStars 3s ease-in-out infinite;
  opacity: 0.7;
}

@keyframes floatStars {
  from { background-position: 0 0, 0 0, 0 0; }
  to { background-position: 1000px 1000px, 2000px 2000px, 1500px 1500px; }
}

@keyframes twinkleStars {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* 🌈 星光漂浮粒子层2（细微动态层次） */
#wrapper::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image:
    radial-gradient(rgba(173, 216, 255, 0.15) 1px, transparent 1px),
    radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    radial-gradient(rgba(255, 182, 193, 0.08) 2px, transparent 2px);
  background-size: 240px 240px, 180px 180px, 300px 300px;
  background-position: 0 0, 60px 60px, 30px 120px;
  animation: starsFloat 80s linear infinite, subtleTwinkle 4s ease-in-out infinite;
}

@keyframes starsFloat {
  from { background-position: 0 0, 0 0, 0 0; }
  to { background-position: -800px 1200px, 900px -900px, 1500px 500px; }
}

@keyframes subtleTwinkle {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.8; }
}


/* 🩵 主内容区 */
#content {
  padding-top: 160px;
  display: flex;
  justify-content: center;
  animation: contentRise 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes contentRise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 📜 玻璃质感容器 */
.paper {
  width: min(86%, 1320px);
  top:160px;
  padding: 20px;
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(22px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 10px 40px rgba(80, 160, 255, 0.25);
  transition: all 0.4s ease;
}
.paper img {
  max-width: 89%;
  height: auto;
  display: block;
  margin: 10px auto;
}


/* 浮动动画 */
.paper:hover {
  transform: translateY(-6px);
  box-shadow: 0 14px 50px rgba(100, 180, 255, 0.35);
}

/* ✨ 内部光晕效果 */
.paper::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(circle at 30% 20%, rgba(200, 220, 255, 0.15), transparent 60%),
              radial-gradient(circle at 80% 80%, rgba(180, 240, 255, 0.15), transparent 60%);
  opacity: 0.8;
  animation: gentleGlow 10s ease-in-out infinite alternate;
  
}

@keyframes gentleGlow {
  from { opacity: 0.5; transform: scale(1); }
  to { opacity: 0.9; transform: scale(1.02); }
}

.paper::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(112deg, transparent 0%, transparent 32%, rgba(255, 255, 255, 0.2) 43%, transparent 56%, transparent 100%);
  opacity: 0.58;
  transform: translateX(-120%);
  animation: paperSheen 9s ease-in-out infinite;
}

@keyframes paperSheen {
  0%, 48% { transform: translateX(-120%); opacity: 0; }
  56% { opacity: 0.45; }
  72%, 100% { transform: translateX(120%); opacity: 0; }
}

.paper > * {
  position: relative;
  z-index: 1;
}

.paper p {
  margin: 0;
  font-size: 18px;
  line-height: 1.7;
}
/* 🌟 漂亮的悬浮按钮样式 */
.fixed-button {
  position: fixed;
  left: 20px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  color: #fff;
  font-size: 16px;
  box-shadow: 0 4px 15px rgba(100, 180, 255, 0.25);
  z-index: 3000;
  transform: translateY(20px);
  transition: all 0.4s ease;
}

/* 🪄 鼠标悬浮特效 */
.fixed-button:hover {
  background: rgba(120, 180, 255, 0.5);
  box-shadow: 0 0 15px rgba(120, 180, 255, 0.6);
  transform: scale(1.05);
}

/* ✨ 上下位置 */
#back-to-top {
  bottom: 600px;
}

#back-to-bottom {
  bottom: 240px;
}
#wrapper {
  position: relative;
  min-height: 60vh; /* ✅ 保证至少等于一屏高 */
  display: flex;
  flex-direction: column;
  justify-content: center; /* ✅ 垂直居中 */
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.32s ease, transform 0.32s ease, filter 0.32s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(8px);
  filter: blur(4px);
}

@media (max-width: 900px) {
  .paper {
    width: min(92%, 1320px);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
