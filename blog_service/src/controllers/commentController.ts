import { getQuery, readBody } from 'h3';
import { CommentService } from '../services/commentService.js';

const toOptionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === '') return null;
  const nextValue = Number(value);
  return Number.isFinite(nextValue) && nextValue > 0 ? nextValue : null;
};

const cleanString = (value: unknown, maxLength: number) => {
  return String(value || '').trim().slice(0, maxLength);
};

const cleanOptionalString = (value: unknown, maxLength: number) => {
  const nextValue = cleanString(value, maxLength);
  return nextValue || null;
};

export class CommentController {
  static async loadComments(event: any) {
    try {
      const query = getQuery(event);
      const articleId = toOptionalNumber(query.articleId);
      const collectionId = toOptionalNumber(query.collectionId);

      if (articleId) {
        const comments = await CommentService.loadCommentsByArticleId(articleId);
        return { status: 'success', comments };
      }

      if (collectionId) {
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
      const articleId = toOptionalNumber(body.articleId);
      const collectionId = toOptionalNumber(body.collectionId);
      const parentId = toOptionalNumber(body.parentId);
      const name = cleanString(body.name, 191);
      const email = cleanOptionalString(body.email, 191);
      const homepage = cleanOptionalString(body.homepage, 191);
      const content = cleanString(body.content, 5000);

      if (!name || !content) {
        return { status: 'error', message: 'Missing required fields: name, content' };
      }

      const comment = await CommentService.submitComment({
        articleId,
        collectionId,
        parentId,
        name,
        email,
        homepage,
        content,
      });

      return { status: 'success', comment };
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
