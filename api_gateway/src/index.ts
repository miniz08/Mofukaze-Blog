import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { logger } from "./middlewares/logger.js";
import { verifyJWT } from "./middlewares/auth.js";
// import { limiter } from "./middlewares/rateLimiter.js";
import { setupProxies } from "./proxy/proxyHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ✨ CORS 一定要放最前面
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 其它中间件
app.use(logger);
// app.use(limiter);
app.use(verifyJWT);
setupProxies(app);

// ✅ 兼容 Express v5 的 fallback 写法：
app.all('/', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway 运行在 http://localhost:${PORT}`);
});
