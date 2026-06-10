# 部署说明

## Docker Compose

`docker-compose.yml` 定义了：

- `mofukaze`：Nuxt SSR 前端。
- `api_gateway`：API 网关。
- `blog_service`：博客服务。
- `nginx`：外部入口和静态资源映射。

生产环境需要确认：

- `ADMIN_TOKEN` 不使用默认值。
- `UPLOAD_URL` 指向最终站点域名。
- `/media` 已挂载到真实服务器媒体目录。
- `MUSIC_BASE` 如需自定义，需要传给前端容器。

## 数据库迁移

新增关于/动态复用字段后，需要在 `blog_service` 执行 Prisma 迁移：

```bash
npm run prisma:migrate
```

或在生产流程中使用你自己的 Prisma migrate deploy 方式。

相关迁移：

- `20260610000000_about_segments`：创建 `about_segment`。
- `20260610010000_about_segment_kind`：添加 `kind` 字段，用于区分关于页和动态页。

代码对旧库读取关于页做了兜底，但动态页写入需要完成 `kind` 字段迁移。

## 音乐目录

音乐文件放在 Nginx 映射的音乐目录下，例如：

```text
/media/music/playlist.json
/media/music/song.mp3
/media/music/cover.jpg
```

前端默认从：

```text
${CDN}/music/playlist.json
```

读取播放列表。

## 本地开发

常用启动方式：

```bash
cd blog_service && npm run dev
cd api_gateway && npm run dev
cd mofukaze && npm run dev
```

默认端口：

- Nuxt：`3000`
- API Gateway：`3001`
- Blog Service：`3002`

前端通过 `/api` 访问网关。
