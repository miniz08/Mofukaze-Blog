import { defineEventHandler } from 'h3';
import { ArticleController } from '../controllers/articleController.js';

// 预留的权限标记类型，后续由 API Gateway 统一鉴权
export type AccessLevel = 'public' | 'private';

// 每个文章相关接口的访问级别配置（目前全部设为 public，后续可按需调整）
export const articleAccessConfig: Record<string, AccessLevel> = {
  submitArticle: 'public',
  getAllTag: 'public',
  getSubTag: 'public',
  findArticleByID: 'public',
  getArticleInfo: 'public',
  getLatestArticles: 'public',
  getArticlesByTag: 'public',
  getLatestArticlesByTag: 'public',
  editArticle: 'public',
  deleteArticle: 'public',
  deleteArticlesByTag: 'public',
  uploadImage: 'private',
};

// 将所有文章接口聚合在一个文件中导出，便于统一管理和后续按 public/private 分类

export const submitArticleHandler = defineEventHandler((event) =>
  ArticleController.submitArticle(event),
);

export const getAllTagHandler = defineEventHandler((event) =>
  ArticleController.getAllTag(event),
);

export const getSubTagHandler = defineEventHandler((event) =>
  ArticleController.getSubTag(event),
);

export const findArticleByIDHandler = defineEventHandler((event) =>
  ArticleController.findArticleByID(event),
);

export const getArticleInfoHandler = defineEventHandler((event) =>
  ArticleController.getArticleInfo(event),
);

export const getLatestArticlesHandler = defineEventHandler((event) =>
  ArticleController.getLatestArticles(event),
);

export const getArticlesByTagHandler = defineEventHandler((event) =>
  ArticleController.getArticlesByTag(event),
);

export const getLatestArticlesByTagHandler = defineEventHandler((event) =>
  ArticleController.getLatestArticlesByTag(event),
);

export const editArticleHandler = defineEventHandler((event) =>
  ArticleController.editArticle(event),
);

export const deleteArticleHandler = defineEventHandler((event) =>
  ArticleController.deleteArticle(event),
);

export const deleteArticlesByTagHandler = defineEventHandler((event) =>
  ArticleController.deleteArticlesByTag(event),
);

export const uploadArticleImageHandler = defineEventHandler((event) =>
  ArticleController.uploadImage(event),
);


export const articleRoutes = {
  "/article/submitArticle": submitArticleHandler,
  "/article/getAllTag": getAllTagHandler,
  "/article/getSubTag": getSubTagHandler,
  "/article/findArticleByID": findArticleByIDHandler,
  "/article/getArticleInfo": getArticleInfoHandler,
  "/article/getLatestArticles": getLatestArticlesHandler,
  "/article/getArticlesByTag": getArticlesByTagHandler,
  "/article/getLatestArticlesByTag": getLatestArticlesByTagHandler,
  "/article/editArticle": editArticleHandler,
  "/article/deleteArticle": deleteArticleHandler,
  "/article/deleteArticlesByTag": deleteArticlesByTagHandler,
  "/article/uploadImage": uploadArticleImageHandler,
};
