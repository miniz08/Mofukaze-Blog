import { prisma } from '../../lib/prisma.js';

type PublicComment = {
  id: number;
  name: string;
  homepage: string | null;
  content: string;
  posttime: Date;
  articleId: number | null;
  collectionId: number | null;
  momentId?: number | null;
  parentId: number | null;
  status: string;
  ipLocation?: string | null;
  browser?: string | null;
  os?: string | null;
  replies?: PublicComment[];
};

type SubmitCommentInput = {
  articleId?: number | null;
  collectionId?: number | null;
  momentId?: number | null;
  parentId?: number | null;
  name: string;
  email?: string | null;
  homepage?: string | null;
  content: string;
  ipLocation?: string | null;
  userAgent?: string | null;
  browser?: string | null;
  os?: string | null;
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

const isMissingCommentMetaColumn = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  return /Unknown column .*(momentId|ipLocation|userAgent|browser|os)|Unknown column `(momentId|ipLocation|userAgent|browser|os)`/i.test(message);
};

const normalizeComment = (comment: PublicComment): PublicComment => ({
  ...comment,
  momentId: comment.momentId ?? null,
  ipLocation: comment.ipLocation || null,
  browser: comment.browser || null,
  os: comment.os || null,
});

const normalizeComments = (comments: PublicComment[]) => comments.map(normalizeComment);

const targetCount = (...values: Array<number | null | undefined>) => {
  return values.filter((value) => Number.isFinite(value) && Number(value) > 0).length;
};

export class CommentService {
  static async loadCommentsByArticleId(articleId: number) {
    try {
      const comments = await prisma.$queryRaw<PublicComment[]>`
        SELECT id, name, homepage, content, posttime, articleId, collectionId, momentId, parentId, status, ipLocation, browser, os
        FROM \`comment\`
        WHERE articleId = ${articleId} AND status = 'approved'
        ORDER BY posttime ASC, id ASC
      `;

      return buildCommentTree(normalizeComments(comments));
    } catch (error) {
      if (!isMissingCommentMetaColumn(error)) throw error;

      const comments = await prisma.$queryRaw<PublicComment[]>`
        SELECT id, name, homepage, content, posttime, articleId, collectionId, NULL AS momentId, parentId, status, NULL AS ipLocation, NULL AS browser, NULL AS os
        FROM \`comment\`
        WHERE articleId = ${articleId} AND status = 'approved'
        ORDER BY posttime ASC, id ASC
      `;

      return buildCommentTree(normalizeComments(comments));
    }
  }

  static async loadCommentsByCollectionId(collectionId: number) {
    try {
      const comments = await prisma.$queryRaw<PublicComment[]>`
        SELECT id, name, homepage, content, posttime, articleId, collectionId, momentId, parentId, status, ipLocation, browser, os
        FROM \`comment\`
        WHERE collectionId = ${collectionId} AND status = 'approved'
        ORDER BY posttime ASC, id ASC
      `;

      return buildCommentTree(normalizeComments(comments));
    } catch (error) {
      if (!isMissingCommentMetaColumn(error)) throw error;

      const comments = await prisma.$queryRaw<PublicComment[]>`
        SELECT id, name, homepage, content, posttime, articleId, collectionId, NULL AS momentId, parentId, status, NULL AS ipLocation, NULL AS browser, NULL AS os
        FROM \`comment\`
        WHERE collectionId = ${collectionId} AND status = 'approved'
        ORDER BY posttime ASC, id ASC
      `;

      return buildCommentTree(normalizeComments(comments));
    }
  }

  static async loadCommentsByMomentId(momentId: number) {
    try {
      const comments = await prisma.$queryRaw<PublicComment[]>`
        SELECT id, name, homepage, content, posttime, articleId, collectionId, momentId, parentId, status, ipLocation, browser, os
        FROM \`comment\`
        WHERE momentId = ${momentId} AND status = 'approved'
        ORDER BY posttime ASC, id ASC
      `;

      return buildCommentTree(normalizeComments(comments));
    } catch (error) {
      if (isMissingCommentMetaColumn(error)) return [];
      throw error;
    }
  }

  static async submitComment(input: SubmitCommentInput) {
    const articleId = input.articleId || null;
    const collectionId = input.collectionId || null;
    const momentId = input.momentId || null;
    const parentId = input.parentId || null;

    if (targetCount(articleId, collectionId, momentId) === 0) {
      throw new Error('Missing articleId, collectionId or momentId');
    }

    if (targetCount(articleId, collectionId, momentId) > 1) {
      throw new Error('A comment can only belong to one target');
    }

    if (parentId) {
      const parent = momentId
        ? await prisma.$queryRaw<{ id: number }[]>`
            SELECT id FROM \`comment\`
            WHERE id = ${parentId} AND status = 'approved' AND momentId = ${momentId}
            LIMIT 1
          `
        : articleId
          ? await prisma.$queryRaw<{ id: number }[]>`
              SELECT id FROM \`comment\`
              WHERE id = ${parentId} AND status = 'approved' AND articleId = ${articleId}
              LIMIT 1
            `
          : await prisma.$queryRaw<{ id: number }[]>`
              SELECT id FROM \`comment\`
              WHERE id = ${parentId} AND status = 'approved' AND collectionId = ${collectionId}
              LIMIT 1
            `;

      if (!parent[0]) {
        throw new Error('Parent comment not found');
      }
    }

    const name = input.name.slice(0, 191);
    const email = input.email ? input.email.slice(0, 191) : null;
    const homepage = normalizeHomepage(input.homepage);
    const content = input.content;
    const ipLocation = input.ipLocation ? input.ipLocation.slice(0, 191) : null;
    const userAgent = input.userAgent ? input.userAgent.slice(0, 512) : null;
    const browser = input.browser ? input.browser.slice(0, 96) : null;
    const os = input.os ? input.os.slice(0, 96) : null;

    try {
      await prisma.$executeRaw`
        INSERT INTO \`comment\` (articleId, collectionId, momentId, parentId, name, email, homepage, content, status, ipLocation, userAgent, browser, os, posttime)
        VALUES (${articleId}, ${collectionId}, ${momentId}, ${parentId}, ${name}, ${email}, ${homepage}, ${content}, 'approved', ${ipLocation}, ${userAgent}, ${browser}, ${os}, CURRENT_TIMESTAMP(3))
      `;

      const rows = await prisma.$queryRaw<PublicComment[]>`
        SELECT id, name, homepage, content, posttime, articleId, collectionId, momentId, parentId, status, ipLocation, browser, os
        FROM \`comment\`
        WHERE id = LAST_INSERT_ID()
        LIMIT 1
      `;

      return rows[0] ? normalizeComment(rows[0]) : null;
    } catch (error) {
      if (!isMissingCommentMetaColumn(error) || momentId) {
        throw error;
      }

      await prisma.$executeRaw`
        INSERT INTO \`comment\` (articleId, collectionId, parentId, name, email, homepage, content, status, posttime)
        VALUES (${articleId}, ${collectionId}, ${parentId}, ${name}, ${email}, ${homepage}, ${content}, 'approved', CURRENT_TIMESTAMP(3))
      `;

      const rows = await prisma.$queryRaw<PublicComment[]>`
        SELECT id, name, homepage, content, posttime, articleId, collectionId, NULL AS momentId, parentId, status, NULL AS ipLocation, NULL AS browser, NULL AS os
        FROM \`comment\`
        WHERE id = LAST_INSERT_ID()
        LIMIT 1
      `;

      return rows[0] ? normalizeComment(rows[0]) : null;
    }
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
