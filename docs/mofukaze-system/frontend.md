# 前端设计

## 入口与布局

主布局在 `mofukaze/layouts/default.vue`。它负责背景层、主题切换、导航、固定按钮、音乐播放器和页面内容容器。

导航组件在 `mofukaze/components/main/top.vue`：

- 常态是完整导航，包含站点名 `Mofukaze.me`、社交图标和页面入口。
- 滚动到内容区域附近后切换为迷你导航，减少阅读时的遮挡。
- 管理员入口只在 `useAdmin().isAdmin` 为真时显示。

## 页面模块

- `pages/index.vue`：首页最新文章列表。保留大图背景条目，但摘要会去除 HTML，背景图按文章 id 稳定选择。
- `pages/articleList.vue`：按标签展开文章。
- `pages/List/[articleList].vue`：某个标签下的文章列表。
- `pages/article/[id].vue`：文章详情、目录、评论、媒体展示和管理员编辑入口。
- `pages/collection.vue`：收藏架总览。
- `pages/collections/[id].vue`：收藏详情。
- `pages/about.vue`：回忆录式关于页，管理员可追加纯文本段落。
- `pages/moments.vue`：动态页，管理员可使用现有富文本编辑器发布图片/视频动态。
- `pages/admin.vue`：访问统计等管理视图。
- `pages/login.vue`：管理员 token 登录。

## 编辑器

主要编辑器是 `components/editor/editor.vue`，基于 TipTap：

- 支持标题、粗体、斜体、列表、引用、代码块、链接、LaTeX、图片和视频。
- 图片上传使用 `purpose = article-image`。
- 视频上传使用 `purpose = video`。
- 编辑器已改为主题变量样式，避免默认白色工具栏破坏主题氛围。

收藏编辑、文章编辑和动态发布都复用这套编辑器，降低维护成本。

## 主题系统

主题定义在 `composables/useTheme.ts`，主题视觉补充在：

- `assets/css/base.css`
- `assets/css/themes.css`
- `assets/css/layout.css`
- `assets/css/components.css`
- `assets/css/animations.css`

主题通过 CSS 变量驱动：

- `--theme-text`
- `--theme-accent`
- `--surface-card`
- `--surface-reading`
- `--border-soft`
- `--theme-shadow`
- `--theme-glow`

新增页面或组件时，优先使用这些变量，不建议直接写固定深黑遮罩或固定白底。

## 音乐播放器

`components/BackgroundMusic.vue` 读取 `runtimeConfig.public.musicBase` 下的 `playlist.json`。

推荐的播放列表格式：

```json
{
  "tracks": [
    {
      "title": "Song title",
      "artist": "Artist",
      "src": "song.mp3",
      "cover": "cover.jpg"
    }
  ]
}
```

`src` 和 `cover` 可以是完整 URL，也可以是相对音乐目录的路径。
