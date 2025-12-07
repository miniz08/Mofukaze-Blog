# =========================
# 1️⃣ 构建阶段：Node 构建 Nuxt
# =========================
FROM node:20 AS builder
WORKDIR /app

# ✅ 先只拷贝依赖文件，利用 Docker 缓存
COPY package*.json ./
RUN npm install

# 拷贝源码
COPY . .

# 构建 Nuxt SSR 产物
RUN npm run build

# =========================
# 2️⃣ 生产阶段：只跑 Node
# =========================
FROM node:20-slim
WORKDIR /app

# 拷贝依赖文件并安装生产依赖
COPY package*.json ./
RUN npm install --omit=dev

# 拷贝构建产物
COPY --from=builder /app/.output /app/.output

# 设置环境变量
ENV NODE_ENV=production

# 暴露端口给其他容器访问
EXPOSE 3000

# 启动 Nuxt SSR
CMD ["node", "/app/.output/server/index.mjs", "--port", "3000"]
