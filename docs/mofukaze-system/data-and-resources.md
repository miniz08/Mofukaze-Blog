# 数据模型与资源路径

## Prisma 数据模型

主要模型在 `blog_service/prisma/schema.prisma`。

### Article

文章主体：

- `title`
- `content`
- `tag`
- `subTag`
- `visible`
- `posttime`

文章详情页、首页、文章列表和统计模块都依赖它。

### Collection

收藏主体：

- `title`
- `content`
- `tag`
- `imageUrl`
- `posttime`

封面通过统一资源上传保存，页面展示时解析为 CDN/媒体地址。

### Comment

评论内容：

- `articleId`
- `username`
- `content`
- `parentId`
- `visible`
- `posttime`

用于文章详情页的评论区。

### VisitEvent

访问统计：

- `articleId`
- `visitorId`
- `path`
- `referrer`
- `userAgent`
- `createdAt`

用于后台统计视图。

### AboutSegment

关于页与动态页共用：

- `kind`：`about` 或 `moment`
- `title`
- `content`
- `mood`
- `sortOrder`
- `visible`
- `posttime`
- `updatedAt`

关于页按 `sortOrder ASC, posttime ASC` 排序。动态页按 `posttime DESC` 排序。

## 资源目录

当前部署推荐路径：

- 图片正文：`/media/img/text`
- 收藏封面：`/media/img/cover`
- 视频：`/media/video`
- 音乐：`/media/music`

Docker 环境变量：

```yaml
UPLOAD_URL: "http://mofukaze.me"
UPLOAD_IMG_TEXT_DIR: "/media/img/text"
UPLOAD_IMG_COVER_DIR: "/media/img/cover"
UPLOAD_VIDEO_DIR: "/media/video"
UPLOAD_MUSIC_DIR: "/media/music"
```

Nginx 负责把 `/img`、`/video`、`/music`、`/font` 映射到服务器对应目录。

## 哈希存储

资源服务会根据文件内容生成哈希，并按前几位拆分目录，例如：

```text
/media/img/text/ab/cd/<hash>.jpg
/media/video/ab/cd/<hash>.mp4
```

这样可以避免同名覆盖，也能让同一文件重复上传时保持稳定地址。
