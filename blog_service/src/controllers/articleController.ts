import { ArticleService } from '../services/articleService.js';
import { readBody, getQuery } from 'h3';

export class ArticleController {
  /**
   * 提交文章
   */
  static async submitArticle(event: any) {
    try {
      const body = await readBody(event);
      const { title, content, tag, subTag } = body;

      if (!title || !content || !tag) {
        return { status: 'error', message: 'Missing required fields: title, content, tag' };
      }

      const data = await ArticleService.createArticle(title, content, tag, subTag || '');
      return { status: 'success', data };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * 根据 ID 查找文章
   */
  static async findArticleByID(event: any) {
    try {
      const query = getQuery(event);
      const id = Number(query.id);

      if (!id || isNaN(id)) {
        return { status: 'error', message: 'Invalid article ID' };
      }

      const data = await ArticleService.findArticleByID(id);
      return data;
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * 获取文章信息（所有文章）
   */
  static async getArticleInfo(event: any) {
    try {
      const data = await ArticleService.getAllArticles();
      return data;
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * 获取最新文章
   */
static async getLatestArticles(event: any) {
    console.log('[Controller] 调用 service.getLatestArticles');
    try {
      const data = await ArticleService.getLatestArticles();
      console.log('[Controller] Service 返回数据条数：', data?.length);
      return data;
    } catch (error: any) {
      console.error('[Controller] 出错啦：', error);
      return { status: 'error', message: error.message };
    }
  }
  /**
   * 根据标签获取文章
   */
  static async getArticlesByTag(event: any) {
    try {
      const query = getQuery(event);
      const tag = query.tag ? String(query.tag) : '';

      if (!tag) {
        return [];
      }

      const data = await ArticleService.getArticlesByTag(tag);
      return data;
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * 根据标签获取最新文章
   */
  static async getLatestArticlesByTag(event: any) {
    try {
      const query = getQuery(event);
      const tag = query.tag ? String(query.tag) : '';

      if (!tag) {
        return [];
      }

      const data = await ArticleService.getLatestArticlesByTag(tag);
      return data;
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * 编辑文章
   */
  static async editArticle(event: any) {
    try {
      const body = await readBody(event);
      const { id, title, content } = body;

      if (!id || !title || !content) {
        return { status: 'error', message: 'Missing required fields: id, title, content' };
      }

      const data = await ArticleService.updateArticle(Number(id), title, content);
      return { status: 'success', data };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * 删除文章
   */
  static async deleteArticle(event: any) {
    try {
      const body = await readBody(event);
      const { id } = body;

      if (!id) {
        return { status: 'error', message: 'Missing required field: id' };
      }

      const data = await ArticleService.deleteArticle(Number(id));
      return { status: 'success', data };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * 根据标签删除文章
   */
  static async deleteArticlesByTag(event: any) {
    try {
      const body = await readBody(event);
      const { tag } = body;

      if (!tag) {
        return { status: 'error', message: 'Missing required field: tag' };
      }

      const data = await ArticleService.deleteArticlesByTag(String(tag));
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

      const result = await ArticleService.uploadImage(image, title);
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

