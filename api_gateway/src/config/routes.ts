export const routeTable = [
  {
    path: "/users",
    target: "http://localhost:3003", // 用户服务
  },
  {
    path: "/posts",
    target: process.env.BLOG_SERVICE_URL || (process.env.NODE_ENV === "production" ? "http://blog_service:3002" : "http://localhost:3002"), // 帖子服务
  },
];
