import { getQuery, readBody } from 'h3';
import { AboutService, normalizeKind } from '../services/aboutService.js';

const toPositiveNumber = (value: unknown) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) && nextValue > 0 ? nextValue : null;
};

const cleanString = (value: unknown, maxLength: number) => {
  return String(value || '').trim().slice(0, maxLength);
};

export class AboutController {
  static async getSegments(event: any) {
    try {
      const query = getQuery(event);
      const data = await AboutService.getSegments(normalizeKind(query.kind), false);
      return { status: 'success', data };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  static async createSegment(event: any) {
    try {
      const body = await readBody(event);
      const title = cleanString(body.title, 191);
      const content = cleanString(body.content, 50000);
      const mood = cleanString(body.mood, 191);
      const sortOrder = Number(body.sortOrder);

      const data = await AboutService.createSegment({
        kind: normalizeKind(body.kind),
        title,
        content,
        mood: mood || null,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        visible: body.visible !== false,
      });

      return { status: 'success', data };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  static async updateSegment(event: any) {
    try {
      const body = await readBody(event);
      const id = toPositiveNumber(body.id);

      if (!id) {
        return { status: 'error', message: 'Invalid segment ID' };
      }

      const sortOrder = body.sortOrder !== undefined ? Number(body.sortOrder) : undefined;
      const data = await AboutService.updateSegment(id, {
        kind: body.kind !== undefined ? normalizeKind(body.kind) : undefined,
        title: body.title !== undefined ? cleanString(body.title, 191) : undefined,
        content: body.content !== undefined ? cleanString(body.content, 50000) : undefined,
        mood: body.mood !== undefined ? cleanString(body.mood, 191) : undefined,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : undefined,
        visible: body.visible,
      });

      return { status: 'success', data };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  static async deleteSegment(event: any) {
    try {
      const body = await readBody(event);
      const id = toPositiveNumber(body.id);

      if (!id) {
        return { status: 'error', message: 'Invalid segment ID' };
      }

      const data = await AboutService.deleteSegment(id);
      return { status: 'success', data };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
}
