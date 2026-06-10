# 后端与接口

## API 网关

`api_gateway/` 使用 Express。它的职责是：

- 统一接收前端 `/api/*` 请求。
- 代理到 `blog_service` 等后端服务。
- 用 `ADMIN_TOKEN` 鉴权写操作。
- 提供 `/auth/status` 给前端检测管理员状态。

只读请求 `GET / HEAD / OPTIONS` 默认放行。文章提交、资源上传、关于/动态写入、收藏编辑等写操作需要管理员 token。

## Blog Service

`blog_service/` 使用 H3。入口是 `src/index.ts`，启动时扫描 `src/api` 下所有 `xxxRoutes` 导出并注册。

主要 API 文件：

- `src/api/article.ts`：文章增删改查、标签查询。
- `src/api/collection.ts`：收藏增删改查。
- `src/api/comment.ts`：评论提交与读取。
- `src/api/analytics.ts`：访问统计。
- `src/api/resource.ts`：统一资源上传。
- `src/api/about.ts`：关于页与动态页共用接口。

路由扫描调试日志通过 `DEBUG_ROUTES=true` 开启，默认生产环境更安静。

## 关于页与动态页

关于页和动态页共用 `AboutService`：

- `GET /about/getSegments?kind=about`：读取关于页分段。
- `GET /about/getSegments?kind=moment`：读取动态流。
- `POST /about/createSegment`：创建分段或动态。
- `PUT /about/updateSegment`：更新分段或动态。
- `DELETE /about/deleteSegment`：删除分段或动态。

`kind` 默认为 `about`。动态页使用 `kind = moment`。

## 资源上传

统一入口：

```http
POST /resource/upload
```

支持 `multipart/form-data` 和 JSON data URL。前端统一走 `mofukaze/composables/useResourceUpload.ts`。

`purpose` 可选值：

- `article-image`
- `collection-cover`
- `video`
- `music`

后端会基于文件内容生成哈希路径，避免重复文件和原始文件名混乱。
