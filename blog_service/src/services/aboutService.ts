import { prisma } from '../../lib/prisma.js';

export type SegmentKind = 'about' | 'moment';

export type AboutSegmentInput = {
  kind?: SegmentKind | string | null;
  title: string;
  content: string;
  mood?: string | null;
  sortOrder?: number | null;
  visible?: boolean | null;
};

export type AboutSegment = {
  id: number;
  kind?: string;
  title: string;
  content: string;
  mood: string | null;
  sortOrder: number;
  visible: boolean | number;
  posttime: Date;
  updatedAt: Date;
};

const normalizeSegment = (segment: AboutSegment) => ({
  ...segment,
  kind: normalizeKind(segment.kind),
  visible: Boolean(segment.visible),
});

export const normalizeKind = (value: unknown): SegmentKind => {
  return String(value || '').trim() === 'moment' ? 'moment' : 'about';
};

const isMissingKindColumn = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  return /Unknown column 'kind'|Unknown column `kind`|column .*kind.* does not exist/i.test(message);
};

const selectVisibleLegacyAboutSegments = async () => {
  const rows = await prisma.$queryRaw<AboutSegment[]>`
    SELECT id, title, content, mood, sortOrder, visible, posttime, updatedAt
    FROM about_segment
    WHERE visible = true
    ORDER BY sortOrder ASC, posttime ASC, id ASC
  `;

  return rows.map((row) => normalizeSegment({ ...row, kind: 'about' }));
};

export class AboutService {
  static async getSegments(kind: SegmentKind = 'about', includeHidden = false) {
    const segmentKind = normalizeKind(kind);

    try {
      const rows = includeHidden
        ? segmentKind === 'moment'
          ? await prisma.$queryRaw<AboutSegment[]>`
              SELECT id, kind, title, content, mood, sortOrder, visible, posttime, updatedAt
              FROM about_segment
              WHERE kind = ${segmentKind}
              ORDER BY posttime DESC, id DESC
            `
          : await prisma.$queryRaw<AboutSegment[]>`
              SELECT id, kind, title, content, mood, sortOrder, visible, posttime, updatedAt
              FROM about_segment
              WHERE kind = ${segmentKind}
              ORDER BY sortOrder ASC, posttime ASC, id ASC
            `
        : segmentKind === 'moment'
          ? await prisma.$queryRaw<AboutSegment[]>`
              SELECT id, kind, title, content, mood, sortOrder, visible, posttime, updatedAt
              FROM about_segment
              WHERE kind = ${segmentKind} AND visible = true
              ORDER BY posttime DESC, id DESC
            `
          : await prisma.$queryRaw<AboutSegment[]>`
              SELECT id, kind, title, content, mood, sortOrder, visible, posttime, updatedAt
              FROM about_segment
              WHERE kind = ${segmentKind} AND visible = true
              ORDER BY sortOrder ASC, posttime ASC, id ASC
            `;

      return rows.map(normalizeSegment);
    } catch (error) {
      if (isMissingKindColumn(error)) {
        if (segmentKind === 'about' && !includeHidden) {
          return selectVisibleLegacyAboutSegments();
        }
        if (segmentKind === 'moment') {
          return [];
        }
      }

      throw error;
    }
  }

  static async createSegment(input: AboutSegmentInput) {
    const kind = normalizeKind(input.kind);
    const title = input.title.trim().slice(0, 191);
    const content = input.content.trim();
    const mood = input.mood?.trim() ? input.mood.trim().slice(0, 191) : null;
    const sortOrder = typeof input.sortOrder === 'number' && Number.isFinite(input.sortOrder)
      ? input.sortOrder
      : 0;
    const visible = input.visible !== false;

    if (!title || !content) {
      throw new Error('Missing required fields: title, content');
    }

    await prisma.$executeRaw`
      INSERT INTO about_segment (kind, title, content, mood, sortOrder, visible, posttime, updatedAt)
      VALUES (${kind}, ${title}, ${content}, ${mood}, ${sortOrder}, ${visible}, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `;

    const rows = await prisma.$queryRaw<AboutSegment[]>`
      SELECT id, kind, title, content, mood, sortOrder, visible, posttime, updatedAt
      FROM about_segment
      WHERE id = LAST_INSERT_ID()
      LIMIT 1
    `;

    return rows[0] ? normalizeSegment(rows[0]) : null;
  }

  static async updateSegment(id: number, input: Partial<AboutSegmentInput>) {
    const currentRows = await prisma.$queryRaw<AboutSegment[]>`
      SELECT id, kind, title, content, mood, sortOrder, visible, posttime, updatedAt
      FROM about_segment
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!currentRows[0]) {
      throw new Error('About segment not found');
    }

    const current = normalizeSegment(currentRows[0]);
    const kind = input.kind !== undefined ? normalizeKind(input.kind) : normalizeKind(current.kind);
    const title = input.title !== undefined ? input.title.trim().slice(0, 191) : current.title;
    const content = input.content !== undefined ? input.content.trim() : current.content;
    const mood = input.mood !== undefined
      ? (input.mood?.trim() ? input.mood.trim().slice(0, 191) : null)
      : current.mood;
    const sortOrder = typeof input.sortOrder === 'number' && Number.isFinite(input.sortOrder)
      ? input.sortOrder
      : current.sortOrder;
    const visible = input.visible !== undefined ? input.visible !== false : current.visible;

    if (!title || !content) {
      throw new Error('Missing required fields: title, content');
    }

    await prisma.$executeRaw`
      UPDATE about_segment
      SET kind = ${kind},
          title = ${title},
          content = ${content},
          mood = ${mood},
          sortOrder = ${sortOrder},
          visible = ${visible},
          updatedAt = CURRENT_TIMESTAMP(3)
      WHERE id = ${id}
    `;

    const rows = await prisma.$queryRaw<AboutSegment[]>`
      SELECT id, kind, title, content, mood, sortOrder, visible, posttime, updatedAt
      FROM about_segment
      WHERE id = ${id}
      LIMIT 1
    `;

    return rows[0] ? normalizeSegment(rows[0]) : null;
  }

  static async deleteSegment(id: number) {
    await prisma.$executeRaw`
      DELETE FROM about_segment
      WHERE id = ${id}
    `;

    return { id };
  }
}
