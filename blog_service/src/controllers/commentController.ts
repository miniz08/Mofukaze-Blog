// import { CommentService } from '../services/commentService.js';
// import { readBody, getQuery } from 'h3';

// export class CommentController {
//   /**
//    * 加载评论
//    */
//   static async loadComments(event: any) {
//     try {
//       const query = getQuery(event);
//       const articleId = query.articleId ? Number(query.articleId) : null;
//       const collectionId = query.collectionId ? Number(query.collectionId) : null;

//       if (articleId && !isNaN(articleId)) {
//         const data = await CommentService.loadCommentsByArticleId(articleId);
//         return data;
//       } else if (collectionId && !isNaN(collectionId)) {
//         const data = await CommentService.loadCommentsByCollectionId(collectionId);
//         return data;
//       } else {
//         return { status: 'error', message: 'Invalid article ID or collection ID' };
//       }
//     } catch (error: any) {
//       return { status: 'error', message: error.message };
//     }
//   }

//   /**
//    * 提交评论
//    */
//   static async submitComment(event: any) {
//     try {
//       const body = await readBody(event);
//       const { articleId, collectionId, name, email, content } = body;

//       if (!content || !name || !email) {
//         return { status: 'error', message: 'Missing required fields: name, email, content' };
//       }

//       if (articleId && !isNaN(Number(articleId))) {
//         const data = await CommentService.submitCommentForArticle(
//           Number(articleId),
//           name,
//           email,
//           content
//         );
//         return { status: 'success', data };
//       } else if (collectionId && !isNaN(Number(collectionId))) {
//         const data = await CommentService.submitCommentForCollection(
//           Number(collectionId),
//           name,
//           email,
//           content
//         );
//         return { status: 'success', data };
//       } else {
//         return { status: 'error', message: 'Missing required field: articleId or collectionId' };
//       }
//     } catch (error: any) {
//       return { status: 'error', message: error.message };
//     }
//   }

//   /**
//    * 上传图片
//    */
//   static async uploadImage(event: any) {
//     try {
//       const body = await readBody(event);
//       const { image, title } = body;

//       const result = await CommentService.uploadImage(image, title);
//       return {
//         status: 'success',
//         filePath: result.filePath,
//       };
//     } catch (error: any) {
//       console.error('❌ Error saving the image:', error);
//       return {
//         statusCode: 500,
//         status: 'fail',
//         message: error.message || 'Error saving the image',
//       };
//     }
//   }
// }

