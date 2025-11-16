import { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";

export function verifyJWT(req: Request, res: Response, next: NextFunction) {
  // 🧪【测试模式】直接放行所有请求！
  return next();

  /*  // 🚫 原逻辑暂时注释
  // 登录、注册接口可以直接放行
  if (req.path.startsWith("/api/users/login") || req.path.startsWith("/api/users/register")) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "缺少 Authorization 头" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "缺少 Token" });

  try {
    const secret = process.env.JWT_SECRET || "default_secret";
    const decoded = jwt.verify(token, secret);
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: "Token 无效或已过期" });
  }
  */
}
