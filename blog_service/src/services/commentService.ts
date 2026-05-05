import { prisma } from '../../lib/prisma.js';

const publicCommentSelect = {
  id: true,
  name: true,
  homepage: true,
  content: true,
  posttime: true,
  articleId: true,
  collectionId: true,
  parentId: true,
  status: true,
} as const;

type PublicComment = {
  id: number;
  name: string;
  homepage: string | null;
  content: string;
  posttime: Date;
  articleId: number | null;
  collectionId: number | null;
  parentId: number | null;
  status: string;
  replies?: PublicComment[];
};

type SubmitCommentInput = {
  articleId?: number | null;
  collectionId?: number | null;
  parentId?: number | null;
  name: string;
  email?: string | null;
  homepage?: string | null;
  content: string;
};

const normalizeHomepage = (homepage?: string | null) => {
  const value = String(homepage || '').trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    return value.slice(0, 191);
  }

  return `https://${value}`.slice(0, 191);
};

const buildCommentTree = (comments: PublicComment[]) => {
  const byId = new Map<number, PublicComment>();
  const roots: PublicComment[] = [];

  comments.forEach((comment) => {
    byId.set(comment.id, { ...comment, replies: [] });
  });

  byId.forEach((comment) => {
    if (comment.parentId && byId.has(comment.parentId)) {
      byId.get(comment.parentId)!.replies!.push(comment);
      return;
    }

    roots.push(comment);
  });

  return roots;
};

export class CommentService {
  static async loadCommentsByArticleId(articleId: number) {
    const comments = await prisma.comment.findMany({
      where: {
        articleId,
        status: 'approved',
      },
      orderBy: { posttime: 'asc' },
      select: publicCommentSelect,
    });

    return buildCommentTree(comments);
  }

  static async loadCommentsByCollectionId(collectionId: number) {
    const comments = await prisma.comment.findMany({
      where: {
        collectionId,
        status: 'approved',
      },
      orderBy: { posttime: 'asc' },
      select: publicCommentSelect,
    });

    return buildCommentTree(comments);
  }

  static async submitComment(input: SubmitCommentInput) {
    const articleId = input.articleId || null;
    const collectionId = input.collectionId || null;
    const parentId = input.parentId || null;

    if (!articleId && !collectionId) {
      throw new Error('Missing articleId or collectionId');
    }

    if (articleId && collectionId) {
      throw new Error('A comment can only belong to one target');
    }

    if (parentId) {
      const parent = await prisma.comment.findFirst({
        where: {
          id: parentId,
          status: 'approved',
          articleId: articleId || undefined,
          collectionId: collectionId || undefined,
        },
        select: { id: true },
      });

      if (!parent) {
        throw new Error('Parent comment not found');
      }
    }

    return await prisma.comment.create({
      data: {
        articleId,
        collectionId,
        parentId,
        name: input.name.slice(0, 191),
        email: input.email ? input.email.slice(0, 191) : null,
        homepage: normalizeHomepage(input.homepage),
        content: input.content,
        status: 'approved',
      },
      select: publicCommentSelect,
    });
  }

  static async getLatestComments(take = 8) {
    return await prisma.comment.findMany({
      where: { status: 'approved' },
      orderBy: { posttime: 'desc' },
      take,
      select: {
        id: true,
        name: true,
        homepage: true,
        content: true,
        posttime: true,
        parentId: true,
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
