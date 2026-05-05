import { ArticleService } from '../services/articleService.js';
import { readBody, getQuery } from 'h3';
import { Readable } from 'stream';

import busboy from 'busboy';

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
 * 查找所有 tag
 */
static async getAllTag(event: any) {
  try {
    const data = await ArticleService.getAllTag();
    return { status: 'success', data };
  } catch (error: any) {
    return { status: 'error', message: error.message };
  }
}

/**
 * 根据 tag 查找所有 subTag
 */
static async getSubTag(event: any) {
  try {
    const query = getQuery(event);
    console.log(query);
    const tag = String(query.tag);   

    if (!tag) {
      return { status: 'error', message: 'Missing required field: tag' };
    }

    const rows = await ArticleService.getSubTag(tag);
    console.log(rows);
    return { status: 'success', data: rows };
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

    const { id, ...updateFields } = body;

    if (!id) {
      return { status: 'error', message: 'Missing required field: id' };
    }

    // 可选字段全部交给 updateArticle 过滤
    const data = await ArticleService.updateArticle(Number(id), updateFields);

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
   * 上传图片（使用 busboy 处理 multipart/form-data）
   */
  static async uploadImage(event: any) {
    return new Promise((resolve, reject) => {
      try {
        const headers = event.node.req.headers;
        console.log('🔵 [Controller] 开始处理上传请求');
        const bb = busboy({ headers });

        let fileStream: NodeJS.ReadableStream | null = null;
        let title: string | null = null;
        let fileReceived = false;
        let titleReceived = false;
        let processing = false;

        // 处理文件的函数
        const processFile = async () => {
          if (processing || !fileStream || !title) {
            return;
          }
          processing = true;
          console.log('🚀 [Controller] 开始处理文件流，title:', title);
          try {
            const result = await ArticleService.uploadImage(fileStream as any, title);
            console.log('✅ [Controller] 文件处理完成，fileUrl:', result.fileUrl);
            resolve({
              status: 'success',
              fileUrl: result.fileUrl,
            });
          } catch (error: any) {
            console.error('❌ [Controller] Error saving the image:', error);
            resolve({
              statusCode: 500,
              status: 'fail',
              message: error.message || 'Error saving the image',
            });
          }
        };

        bb.on('file', (name, file, info) => {
          console.log('📁 [Controller] file 事件触发:', name, info.filename, info.mimeType);
          if (name === 'image') {
            fileReceived = true;
            console.log('✅ [Controller] 文件流已接收，可读状态:', file.readable);
            
            // 收集数据到缓冲区（无论 title 是否到达）
            const chunks: Buffer[] = [];
            let streamEnded = false;
            
            file.on('data', (chunk: Buffer) => {
              chunks.push(chunk);
              console.log('📦 [Controller] 接收到数据块，大小:', chunk.length, '累计:', chunks.reduce((sum, c) => sum + c.length, 0));
            });
            
            file.on('end', () => {
              console.log('📦 [Controller] 文件流结束，总大小:', chunks.reduce((sum, chunk) => sum + chunk.length, 0));
              streamEnded = true;
              
              // 将缓冲的数据转换为新的流
              const bufferedStream = Readable.from(Buffer.concat(chunks));
              fileStream = bufferedStream;
              
              console.log('✅ [Controller] 缓冲流已创建，可读状态:', bufferedStream.readable);
              
              // 如果 title 已经到达，立即处理
              if (titleReceived) {
                processFile();
              }
            });
            
            file.on('error', (err) => {
              console.error('❌ [Controller] 文件流错误:', err);
              reject({
                statusCode: 500,
                status: 'fail',
                message: err.message || 'Error reading file stream',
              });
            });
          } else {
            // 如果不是 image 字段，需要消费掉这个流，否则会阻塞
            file.resume();
          }
        });

        bb.on('field', (name, value) => {
          console.log('📝 [Controller] field 事件触发:', name, value);
          if (name === 'title') {
            title = value;
            titleReceived = true;
            console.log('✅ [Controller] title 已接收:', title);
            // 如果文件已经收到且流已经准备好，立即处理
            if (fileReceived && fileStream) {
              console.log('🚀 [Controller] 文件流和 title 都已就绪，开始处理');
              processFile();
            }
          }
        });

        bb.on('finish', () => {
          console.log('🏁 [Controller] busboy finish 事件触发');
          // 如果还没处理，说明缺少某些字段
          if (!processing) {
            if (!fileReceived || !titleReceived) {
              console.error('❌ [Controller] 缺少必要字段 - fileReceived:', fileReceived, 'titleReceived:', titleReceived);
              resolve({
                statusCode: 400,
                status: 'fail',
                message: 'Missing image file or title',
              });
            }
          }
        });

        bb.on('error', (err) => {
          console.error('❌ [Controller] Busboy error:', err);
          reject({
            statusCode: 500,
            status: 'fail',
            message: err.message || 'Error parsing form data',
          });
        });

        // 将请求流传递给 busboy
        console.log('📤 [Controller] 开始 pipe 请求流到 busboy');
        event.node.req.pipe(bb);
      } catch (error: any) {
        console.error('❌ [Controller] Error in uploadImage:', error);
        reject({
          statusCode: 500,
          status: 'fail',
          message: error.message || 'Error processing upload',
        });
      }
    });
  }
}

