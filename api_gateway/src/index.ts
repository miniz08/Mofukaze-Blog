import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { logger } from "./middlewares/logger.js";
import { verifyAdminToken } from "./middlewares/auth.js";
// import { limiter } from "./middlewares/rateLimiter.js";
import { setupProxies } from "./proxy/proxyHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ✨ CORS 一定要放最前面
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 其它中间件
app.use(logger);
// app.use(limiter);

// 🔐 全局管理员鉴权（只拦截写操作，读操作只标记 isAdmin，不阻止访问）
app.use(verifyAdminToken);

// 前端用来判断“当前请求是否为管理员”的接口
// 前端只需要带上 Authorization 头，请求这个地址即可拿到状态
app.get("/auth/status", (req, res) => {
  res.json({
    isAdmin: (req as any).isAdmin === true,
  });
});

// 注册各个后端服务的代理
setupProxies(app);

// ✅ 兼容 Express v5 的 fallback 写法：
app.all("/", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway 运行在 http://localhost:${PORT}`);
});
