import type { Express, Request } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { Options, RequestHandler } from "http-proxy-middleware";

// 定义 routeTable 的类型，允许可选 rewrite 字段
interface RouteItem {
  path: string;
  target: string;
  rewrite?: Record<string, string>;
}

import { routeTable } from "../config/routes.js";

export function setupProxies(app: Express) {
  (routeTable as RouteItem[]).forEach(({ path, target, rewrite }) => {
    console.log(`🔀 路由映射: ${path} → ${target}`);

    const options: Options = {
      target,
      changeOrigin: true,
      pathRewrite:
        rewrite || ((pathReq) => pathReq.replace(new RegExp(`^${path}`), "")),
      secure: false, // 如果用 https，可禁用证书校验
    };

    const proxy: RequestHandler = createProxyMiddleware(options);
    app.use(path, proxy);
  });
}
