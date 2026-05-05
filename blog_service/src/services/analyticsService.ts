import { prisma } from '../../lib/prisma.js';
import { CommentService } from './commentService.js';

type TrackVisitInput = {
  path?: string;
  articleId?: number | null;
  articleTitle?: string | null;
  visitorId?: string | null;
  sessionId?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
};

type VisitRow = {
  createdAt: Date;
  articleId: number | null;
};

function clampText(value: string | null | undefined, maxLength: number) {
  if (!value) return null;
  return String(value).slice(0, maxLength);
}

function startOfLocalDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildRecentDays(days: number) {
  const today = startOfLocalDay(new Date());
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));
    return {
      date,
      key: formatDateKey(date),
      visits: 0,
      articleViews: 0,
    };
  });
}

function summarizeRecentVisits(visits: VisitRow[], days = 7) {
  const recentDays = buildRecentDays(days);
  const byKey = new Map(recentDays.map((item) => [item.key, item]));

  for (const visit of visits) {
    const key = formatDateKey(visit.createdAt);
    const bucket = byKey.get(key);
    if (!bucket) continue;

    bucket.visits += 1;
    if (visit.articleId) {
      bucket.articleViews += 1;
    }
  }

  return recentDays.map(({ key, visits, articleViews }) => ({
    day: key,
    visits,
    articleViews,
  }));
}

function summarizeTags(articles: Array<{ tag: string; visible: boolean }>) {
  const map = new Map<string, number>();

  for (const article of articles) {
    if (!article.visible) continue;
    const tag = article.tag || '未分类';
    map.set(tag, (map.get(tag) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

function summarizePopularArticles(
  visits: Array<{ articleId: number | null }>,
  articles: Array<{ id: number; title: string }>,
) {
  const articleTitleMap = new Map(articles.map((article) => [article.id, article.title]));
  const countMap = new Map<number, number>();

  for (const visit of visits) {
    if (!visit.articleId) continue;
    countMap.set(visit.articleId, (countMap.get(visit.articleId) || 0) + 1);
  }

  return Array.from(countMap.entries())
    .map(([articleId, views]) => ({
      articleId,
      title: articleTitleMap.get(articleId) || `文章 #${articleId}`,
      views,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);
}

export class AnalyticsService {
  static async trackVisit(input: TrackVisitInput) {
    const path = clampText(input.path || '/', 191) || '/';
    const requestedArticleId = input.articleId && Number.isFinite(input.articleId)
      ? Number(input.articleId)
      : null;
    const article = requestedArticleId
      ? await prisma.article.findUnique({
          where: { id: requestedArticleId },
          select: { id: true, title: true },
        })
      : null;

    return await prisma.visitEvent.create({
      data: {
        path,
        articleId: article?.id || null,
        articleTitle: clampText(input.articleTitle || article?.title, 191),
        visitorId: clampText(input.visitorId, 191),
        sessionId: clampText(input.sessionId, 191),
        referrer: clampText(input.referrer, 512),
        userAgent: clampText(input.userAgent, 512),
      },
    });
  }

  static async getAdminSummary() {
    const today = startOfLocalDay(new Date());
    const recentStart = buildRecentDays(7)[0].date;

    const [
      articles,
      collectionCount,
      commentCount,
      visits,
      latestComments,
    ] = await Promise.all([
      prisma.article.findMany({
        select: {
          id: true,
          title: true,
          tag: true,
          visible: true,
          posttime: true,
        },
        orderBy: { posttime: 'desc' },
      }),
      prisma.collection.count(),
      prisma.comment.count(),
      prisma.visitEvent.findMany({
        select: {
          createdAt: true,
          articleId: true,
        },
        where: {
          createdAt: {
            gte: recentStart,
          },
        },
      }),
      CommentService.getLatestComments(8),
    ]);

    const totalVisits = await prisma.visitEvent.count();
    const articleViews = await prisma.visitEvent.count({
      where: {
        articleId: {
          not: null,
        },
      },
    });
    const todayVisits = await prisma.visitEvent.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });
    const distinctVisitors = await prisma.visitEvent.findMany({
      where: {
        visitorId: {
          not: null,
        },
      },
      distinct: ['visitorId'],
      select: {
        visitorId: true,
      },
    });
    const allArticleVisits = await prisma.visitEvent.findMany({
      where: {
        articleId: {
          not: null,
        },
      },
      select: {
        articleId: true,
      },
    });

    const publicArticles = articles.filter((article) => article.visible);
    const hiddenArticles = articles.length - publicArticles.length;

    return {
      totals: {
        articles: articles.length,
        publicArticles: publicArticles.length,
        hiddenArticles,
        collections: collectionCount,
        comments: commentCount,
        visits: totalVisits,
        articleViews,
        todayVisits,
        uniqueVisitors: distinctVisitors.length,
      },
      recentVisits: summarizeRecentVisits(visits, 7),
      tagStats: summarizeTags(articles),
      popularArticles: summarizePopularArticles(allArticleVisits, articles),
      latestArticles: publicArticles.slice(0, 6).map((article) => ({
        id: article.id,
        title: article.title,
        tag: article.tag,
        posttime: article.posttime,
      })),
      latestComments: latestComments.map((comment) => ({
        id: comment.id,
        name: comment.name,
        content: comment.content,
        posttime: comment.posttime,
        article: comment.article,
        collection: comment.collection,
      })),
    };
  }
}
