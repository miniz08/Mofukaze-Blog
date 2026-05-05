import { CommentService } from '../services/commentService.js';
import { readBody, getQuery } from 'h3';

export class CommentController {
  static async loadComments(event: any) {
    try {
      const query = getQuery(event);
      const articleId = query.articleId ? Number(query.articleId) : null;
      const collectionId = query.collectionId ? Number(query.collectionId) : null;

      if (articleId && !isNaN(articleId)) {
        const comments = await CommentService.loadCommentsByArticleId(articleId);
        return { status: 'success', comments };
      }

      if (collectionId && !isNaN(collectionId)) {
        const comments = await CommentService.loadCommentsByCollectionId(collectionId);
        return { status: 'success', comments };
      }

      return { status: 'error', message: 'Invalid article ID or collection ID' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  static async submitComment(event: any) {
    try {
      const body = await readBody(event);
      const { articleId, collectionId, name, email, content } = body;
      const safeName = String(name || '').trim();
      const safeContent = String(content || '').trim();
      const safeEmail = email ? String(email).trim() : null;

      if (!safeName || !safeContent) {
        return { status: 'error', message: 'Missing required fields: name, content' };
      }

      if (articleId && !isNaN(Number(articleId))) {
        const comment = await CommentService.submitCommentForArticle(
          Number(articleId),
          safeName,
          safeEmail,
          safeContent,
        );
        return { status: 'success', comment };
      }

      if (collectionId && !isNaN(Number(collectionId))) {
        const comment = await CommentService.submitCommentForCollection(
          Number(collectionId),
          safeName,
          safeEmail,
          safeContent,
        );
        return { status: 'success', comment };
      }

      return { status: 'error', message: 'Missing required field: articleId or collectionId' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  static async getLatestComments(event: any) {
    try {
      const query = getQuery(event);
      const take = query.take ? Number(query.take) : 8;
      const comments = await CommentService.getLatestComments(
        Number.isFinite(take) ? Math.min(Math.max(take, 1), 20) : 8,
      );

      return { status: 'success', comments };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
}
