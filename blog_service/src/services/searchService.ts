import { prisma } from '../../lib/prisma.js';

type SearchArticleRow = {
  id: number;
  title: string;
  content: string | null;
  tag: string | null;
  subTag: string | null;
  posttime: Date;
};

type SearchMomentRow = {
  id: number;
  title: string;
  content: string | null;
  mood: string | null;
  posttime: Date;
};

const stripHtml = (value: string) => {
  return String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const summarize = (value: string | null, length = 96) => {
  const text = stripHtml(value || '');
  return text.length > length ? `${text.slice(0, length)}...` : text;
};

const isMissingKindColumn = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  return /Unknown column .*(kind)|Unknown column `kind`/i.test(message);
};

export class SearchService {
  static async searchContent(keyword: string, limit = 6) {
    const query = keyword.trim().slice(0, 80);
    if (!query) {
      return { articles: [], moments: [] };
    }

    const like = `%${query}%`;
    const take = Math.min(Math.max(limit, 1), 12);

    const articles = await prisma.$queryRaw<SearchArticleRow[]>`
      SELECT id, title, content, tag, subTag, posttime
      FROM article
      WHERE visible = true
        AND (title LIKE ${like} OR content LIKE ${like} OR tag LIKE ${like} OR subTag LIKE ${like})
      ORDER BY posttime DESC, id DESC
      LIMIT ${take}
    `;

    let moments: SearchMomentRow[] = [];
    try {
      moments = await prisma.$queryRaw<SearchMomentRow[]>`
        SELECT id, title, content, mood, posttime
        FROM about_segment
        WHERE kind = 'moment'
          AND visible = true
          AND (title LIKE ${like} OR content LIKE ${like} OR mood LIKE ${like})
        ORDER BY posttime DESC, id DESC
        LIMIT ${take}
      `;
    } catch (error) {
      if (!isMissingKindColumn(error)) throw error;
    }

    return {
      articles: articles.map((item) => ({
        type: 'article',
        id: item.id,
        title: item.title,
        summary: summarize(item.content),
        meta: [item.tag, item.subTag].filter(Boolean).join(' / '),
        posttime: item.posttime,
      })),
      moments: moments.map((item) => ({
        type: 'moment',
        id: item.id,
        title: item.title,
        summary: summarize(item.content),
        meta: item.mood || '动态',
        posttime: item.posttime,
      })),
    };
  }
}
