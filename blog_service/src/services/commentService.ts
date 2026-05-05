import { prisma } from '../../lib/prisma.js';

export class CommentService {
  static async loadCommentsByArticleId(articleId: number) {
    return await prisma.comment.findMany({
      where: { articleId },
      orderBy: { posttime: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        content: true,
        posttime: true,
        articleId: true,
        collectionId: true,
      },
    });
  }

  static async loadCommentsByCollectionId(collectionId: number) {
    return await prisma.comment.findMany({
      where: { collectionId },
      orderBy: { posttime: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        content: true,
        posttime: true,
        articleId: true,
        collectionId: true,
      },
    });
  }

  static async submitCommentForArticle(
    articleId: number,
    name: string,
    email: string | null,
    content: string,
  ) {
    return await prisma.comment.create({
      data: {
        articleId,
        name,
        email,
        content,
      },
      select: {
        id: true,
        name: true,
        email: true,
        content: true,
        posttime: true,
        articleId: true,
        collectionId: true,
      },
    });
  }

  static async submitCommentForCollection(
    collectionId: number,
    name: string,
    email: string | null,
    content: string,
  ) {
    return await prisma.comment.create({
      data: {
        collectionId,
        name,
        email,
        content,
      },
      select: {
        id: true,
        name: true,
        email: true,
        content: true,
        posttime: true,
        articleId: true,
        collectionId: true,
      },
    });
  }

  static async getLatestComments(take = 8) {
    return await prisma.comment.findMany({
      orderBy: { posttime: 'desc' },
      take,
      select: {
        id: true,
        name: true,
        content: true,
        posttime: true,
        article: {
          select: {
            id: true,
            title: true,
          },
        },
        collection: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }
}
