import { Request, Response, NextFunction } from "express";

// 一个极简的“单管理员令牌”鉴权方案：
// - 不需要用户系统
// - 只要在 .env 里配置 ADMIN_TOKEN=xxx
// - 前端把这个 token 放在 Authorization 头里就行
//
// 约定支持两种写法（任选其一，便于调试/切换）：
//   Authorization: AdminToken <token>
//   Authorization: Bearer <token>
//
// 行为策略：
// - 所有只读请求（GET / HEAD / OPTIONS）都允许访问
// - 如果令牌匹配 ADMIN_TOKEN，则视为管理员，可以执行写操作
// - 否则写操作被拒绝（返回 403）
export function verifyAdminToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.header("authorization") || "";

  // 支持两种前缀：AdminToken / Bearer，方便前端选择
  let token = authHeader.trim();
  if (/^AdminToken\s+/i.test(token)) {
    token = token.replace(/^AdminToken\s+/i, "").trim();
  } else if (/^Bearer\s+/i.test(token)) {
    token = token.replace(/^Bearer\s+/i, "").trim();
  }

  const isAdmin =
    !!process.env.ADMIN_TOKEN && token === String(process.env.ADMIN_TOKEN);

  // 挂到 req 上，方便后续中间件或路由使用
  (req as any).isAdmin = isAdmin;

  // 只读方法直接放行（不要求是管理员）
  const method = req.method.toUpperCase();
  const isReadOnly = method === "GET" || method === "HEAD" || method === "OPTIONS";
  if (isReadOnly) {
    return next();
  }

  const publicWritePaths = [
    /^\/posts\/analytics\/trackVisit$/,
    /^\/posts\/comment\/submitComment$/,
    /^\/posts\/comment$/,
    /^\/posts\/submitComment$/,
  ];
  const isPublicWrite = publicWritePaths.some((pattern) => pattern.test(req.path));
  if (isPublicWrite) {
    return next();
  }

  // 写操作（POST / PUT / PATCH / DELETE 等）需要管理员权限
  if (!isAdmin) {
    return res.status(403).json({ message: "需要管理员权限" });
  }

  return next();
}
