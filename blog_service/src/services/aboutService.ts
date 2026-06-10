import { prisma } from '../../lib/prisma.js';

export type AboutSegmentInput = {
  title: string;
  content: string;
  mood?: string | null;
  sortOrder?: number | null;
  visible?: boolean | null;
};

export type AboutSegment = {
  id: number;
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
  visible: Boolean(segment.visible),
});

export class AboutService {
  static async getSegments(includeHidden = false) {
    const rows = includeHidden
      ? await prisma.$queryRaw<AboutSegment[]>`
          SELECT id, title, content, mood, sortOrder, visible, posttime, updatedAt
          FROM about_segment
          ORDER BY sortOrder ASC, posttime ASC, id ASC
        `
      : await prisma.$queryRaw<AboutSegment[]>`
          SELECT id, title, content, mood, sortOrder, visible, posttime, updatedAt
          FROM about_segment
          WHERE visible = true
          ORDER BY sortOrder ASC, posttime ASC, id ASC
        `;

    return rows.map(normalizeSegment);
  }

  static async createSegment(input: AboutSegmentInput) {
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
      INSERT INTO about_segment (title, content, mood, sortOrder, visible, posttime, updatedAt)
      VALUES (${title}, ${content}, ${mood}, ${sortOrder}, ${visible}, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `;

    const rows = await prisma.$queryRaw<AboutSegment[]>`
      SELECT id, title, content, mood, sortOrder, visible, posttime, updatedAt
      FROM about_segment
      WHERE id = LAST_INSERT_ID()
      LIMIT 1
    `;

    return rows[0] ? normalizeSegment(rows[0]) : null;
  }

  static async updateSegment(id: number, input: Partial<AboutSegmentInput>) {
    const currentRows = await prisma.$queryRaw<AboutSegment[]>`
      SELECT id, title, content, mood, sortOrder, visible, posttime, updatedAt
      FROM about_segment
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!currentRows[0]) {
      throw new Error('About segment not found');
    }

    const current = normalizeSegment(currentRows[0]);
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
      SET title = ${title},
          content = ${content},
          mood = ${mood},
          sortOrder = ${sortOrder},
          visible = ${visible},
          updatedAt = CURRENT_TIMESTAMP(3)
      WHERE id = ${id}
    `;

    const rows = await prisma.$queryRaw<AboutSegment[]>`
      SELECT id, title, content, mood, sortOrder, visible, posttime, updatedAt
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
