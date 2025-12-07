export const routeTable = [
  {
    path: "/users",
    target: "http://localhost:3003", // 用户服务
  },
  {
    path: "/posts",
    target: "http://blog_service:3002", // 帖子服务,生产模式
    // target: "http://localhost:3002", // 帖子服务,开发模式
  },
];
