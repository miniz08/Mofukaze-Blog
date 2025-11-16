# ===============================
# ① 构建阶段（Build Stage）
# ===============================
FROM node:20 AS builder
WORKDIR /app

# 先拷贝依赖文件以利用缓存
COPY package*.json ./
RUN npm install


# 拷贝源码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 编译项目
RUN npm run build

# ===============================
# ② 生产阶段（Production Stage）
# ===============================
FROM node:20-slim
WORKDIR /app

# 安装生产依赖
COPY package*.json ./
RUN npm install --omit=dev

# 拷贝编译产物与 Prisma 相关
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma


ENV NODE_ENV=production
EXPOSE 3002

# 使用启动脚本来初始化 volume
CMD ["dist/src/index.js"]
