import { CollectionService } from '../services/collectionService.js';
import { readBody, getQuery } from 'h3';

export class CollectionController {
  /**
   * 提交合集
   */
  static async submitCollection(event: any) {
    try {
      const body = await readBody(event);
      const { title, content, tag, imageUrl } = body;

      if (!title || !content || !tag || !imageUrl) {
        return { status: 'error', message: 'Missing required fields: title, content, tag, imageUrl' };
      }

      const data = await CollectionService.createCollection(title, content, tag, imageUrl);
      return { status: 'success', data };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * 根据 ID 查找合集
   */
  static async findCollectionByID(event: any) {
    try {
      const query = getQuery(event);
      const id = Number(query.id);

      if (!id || isNaN(id)) {
        return { status: 'error', message: 'Invalid collection ID' };
      }

      const data = await CollectionService.findCollectionByID(id);
      return data;
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * 获取合集信息（所有合集）
   */
  static async getCollectionInfo(event: any) {
    try {
      const data = await CollectionService.getAllCollections();
      return data;
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * 编辑合集
   */
  static async editCollection(event: any) {
    try {
      const body = await readBody(event);
      const { id, title, content } = body;

      if (!id || !title || !content) {
        return { status: 'error', message: 'Missing required fields: id, title, content' };
      }

      const data = await CollectionService.updateCollection(Number(id), title, content);
      return { status: 'success', data };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * 删除合集
   */
  static async deleteCollection(event: any) {
    try {
      const body = await readBody(event);
      const { id } = body;

      if (!id) {
        return { status: 'error', message: 'Missing required field: id' };
      }

      const data = await CollectionService.deleteCollection(Number(id));
      return { status: 'success', data };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * 上传图片
   */
  static async uploadImage(event: any) {
    try {
      const body = await readBody(event);
      const { image, title } = body;

      const result = await CollectionService.uploadImage(image, title);
      return {
        status: 'success',
        filePath: result.filePath,
      };
    } catch (error: any) {
      console.error('❌ Error saving the image:', error);
      return {
        statusCode: 500,
        status: 'fail',
        message: error.message || 'Error saving the image',
      };
    }
  }
}

