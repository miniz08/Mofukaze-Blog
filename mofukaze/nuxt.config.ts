export default defineNuxtConfig({
  devtools: { enabled: true },

  css: ['katex/dist/katex.min.css'],

  // 🔧 应用配置
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      link: [
        { 
          rel: 'stylesheet', 
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css' 
        }
      ]
    }
  },

  // 🔧 组件自动导入
  components: [
    {
      path: '~/components/',
      pathPrefix: false,
    },
  ],

  experimental: {
    writeEarlyHints: false
  },

  tiptap: {
    prefix: "Tiptap"
  },

  modules: [
    '@element-plus/nuxt', 
    'nuxt-tiptap-editor',

  ],

  vite: {
    cacheDir: 'node_modules/.vite_cache',

    // ✨✨✨ 关键：把 CDN 常量注入到所有文件（包括 CSS！）
    define: {
      __CDN__: JSON.stringify(process.env.CDN || 'http://mofukaze.me')
    }
  },

  // ✨✨✨ 关键：Nuxt Runtime Config（TS/Vue 模板会用到）
  runtimeConfig: {
    public: {
      cdn: process.env.CDN || 'http://mofukaze.me'
    }
  }
})
