// import { defineEventHandler } from 'h3';
// import { CommentService } from '../services/commentService.js';
// import { readBody, getQuery } from 'h3';

// // 预留的权限标记类型，后续由 API Gateway 统一鉴权
// export type AccessLevel = 'public' | 'private';

// // 每个评论相关接口的访问级别配置（目前全部设为 public，后续可按需调整）
// export const commentAccessConfig: Record<string, AccessLevel> = {
//   loadComments: 'public',
//   submitComment: 'public',
//   uploadImage: 'public',
// };

// // 将所有评论接口聚合在一个文件中导出，便于统一管理和后续按 public/private 分类

// export const loadCommentsHandler = defineEventHandler(async (event) => {
//   try {
//     const query = getQuery(event);
//     const articleId = query.articleId ? Number(query.articleId) : null;
//     const collectionId = query.collectionId ? Number(query.collectionId) : null;

//     if (articleId && !isNaN(articleId)) {
//       const data = await CommentService.loadCommentsByArticleId(articleId);
//       return data;
//     } else if (collectionId && !isNaN(collectionId)) {
//       const data = await CommentService.loadCommentsByCollectionId(collectionId);
//       return data;
//     } else {
//       return { status: 'error', message: 'Invalid article ID or collection ID' };
//     }
//   } catch (error: any) {
//     return { status: 'error', message: error.message };
//   }
// });

// export const submitCommentHandler = defineEventHandler(async (event) => {
//   try {
//     const body = await readBody(event);
//     const { articleId, collectionId, name, email, content } = body;

//     if (!content || !name || !email) {
//       return { status: 'error', message: 'Missing required fields: name, email, content' };
//     }

//     if (articleId && !isNaN(Number(articleId))) {
//       const data = await CommentService.submitCommentForArticle(
//         Number(articleId),
//         name,
//         email,
//         content,
//       );
//       return { status: 'success', data };
//     } else if (collectionId && !isNaN(Number(collectionId))) {
//       const data = await CommentService.submitCommentForCollection(
//         Number(collectionId),
//         name,
//         email,
//         content,
//       );
//       return { status: 'success', data };
//     } else {
//       return { status: 'error', message: 'Missing required field: articleId or collectionId' };
//     }
//   } catch (error: any) {
//     return { status: 'error', message: error.message };
//   }
// });

// export const uploadCommentImageHandler = defineEventHandler(async (event) => {
//   try {
//     const body = await readBody(event);
//     const { image, title } = body;

//     const result = await CommentService.uploadImage(image, title);
//     return {
//       status: 'success',
//       filePath: result.filePath,
//     };
//   } catch (error: any) {
//     console.error('❌ Error saving the image:', error);
//     return {
//       statusCode: 500,
//       status: 'fail',
//       message: error.message || 'Error saving the image',
//     };
//   }
// });


