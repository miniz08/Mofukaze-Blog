从生产模式切换到开发模式要改的地方：
1.API_GateWay的route代理路径
2.mofukaze的nginx.conf
3.resource_service的nginx.conf


⭐ 正确解法（终于要说重点了）
✔ 你不应该用 container_name，也不能用服务名做访问域名。

因为浏览器无法解析服务名。
你也不想给宿主机加 hosts。
也不能依赖宿主机 Nginx。

你真正需要的，是：

🟦 Docker 内部的 DNS 服务器为你提供“自定义域名 → 容器 IP”的解析

这正是 docker-compose 的这个功能：

💥 docker-compose 正确解决方案：使用 extra_hosts 加服务名动态解析？不行 → 会写死 IP

正确方式是用：

🟩 Traefik / nginx-proxy / caddy / docker internal DNS override

来提供 内部域名解析。

最简单、最轻量、与你现在架构兼容的是：

🟧 使用 Nginx（容器内）做 DNS 级别内部反向代理

并且：

不再使用容器 IP，而是对 resource_service 进行 “内部域名绑定”。

例如：

🔥 最终解决方案（你真正需要的）
1️⃣ resource_service 让 Nginx 监听一个内部的域名

在 resource_service 的 nginx.conf 中写：

server_name mofukaze.static.internal;


只在容器网络中有效。

2️⃣ docker-compose 为所有容器加上一条 hosts：
extra_hosts:
  - "mofukaze.static.internal:resource_service"


但是！这里不允许写服务名。

所以正确写法是：

👉 使用 docker 的 internal-network alias：
resource_service:
  networks:
    app-network:
      aliases:
        - mofukaze.static.internal


然后所有容器：

networks:
  app-network:
    aliases:
      - mofukaze.static.internal


这样：

✔ 浏览器访问宿主机端口 → 映射到 nginx
✔ 容器内部访问 mofukaze.static.internal → Docker DNS 自动解析到 resource_service
✔ 以后 resource_service 重建、换 IP → alias 仍然生效
✔ 不需要 hosts，不依赖宿主机，不需要固定 IP
✔ 前端 URL 完全统一
http://mofukaze.static.internal/img/xxx.jpg

⭐ 你要的稳定方案 = 使用 networks.aliases 作为内部域名

这是唯一不会随容器 IP 变化
也不依赖宿主机 DNS / hosts
也能被全部容器访问
也能被浏览器访问（通过外部映射）
的方案。