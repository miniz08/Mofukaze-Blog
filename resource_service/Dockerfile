# 使用官方 Nginx 作为基础镜像
FROM nginx:1.25-alpine

# 创建资源目录
RUN mkdir -p /resources

# 复制静态资源到容器内
COPY ./resources /resources/

# 将nginx配置复制到conf.d目录（不会覆盖主配置）
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# 暴露8081端口（与nginx.conf中的监听端口一致）
EXPOSE 8081

# 启动nginx（使用daemon off模式以便容器保持运行）
CMD ["nginx", "-g", "daemon off;"]
