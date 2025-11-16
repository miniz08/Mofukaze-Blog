# =============================
# 1️⃣ 构建阶段
# =============================
FROM node:20 AS builder
WORKDIR /app

# 先只拷贝依赖文件，利用 Docker 缓存
COPY package*.json ./
RUN npm install

# 拷贝源代码
COPY . .

# 构建 TypeScript → dist/
RUN npm run build

# =============================
# 2️⃣ 生产阶段
# =============================
FROM node:20-slim
WORKDIR /app

# 先拷贝依赖文件
COPY package*.json ./

# 生产依赖安装（利用缓存）
RUN npm install --omit=dev

# 只拷贝构建输出
COPY --from=builder /app/dist ./dist

# 设置环境变量
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/index.js"]
