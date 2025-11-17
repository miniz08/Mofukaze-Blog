import { prisma } from '../../lib/prisma.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export class ArticleService {
  /**
   * 创建文章
   */
  static async createArticle(title: string, content: string, tag: string, subTag: string) {
    return await prisma.article.create({
      data: {
        title,
        content,
        tag,
        subTag,
        posttime: new Date()
      },
    });
  }

  /**
   * 根据 ID 查找文章
   */
  static async findArticleByID(id: number) {
    return await prisma.article.findMany({
      where: { id },
    });
  }

  /**
   * 获取所有文章
   */
  static async getAllArticles() {
    return await prisma.article.findMany();
  }

  /**
   * 获取最新文章（前10条）
   * 优化：只返回内容摘要（前200字符），减少数据传输量
   */
   static async getLatestArticles() {
    console.log('[Service] 正在查询数据库...');
    try {
      const articles = await prisma.article.findMany({
        orderBy: { posttime: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          posttime: true,
          content: true,
        },
      });
      console.log(`[Service] 查询成功，共 ${articles.length} 条`);
      return articles.map(article => ({
        ...article,
        content: article.content
          ? article.content.replace(/<[^>]*>/g, '').slice(0, 200)
          : '',
      }));
    } catch (err) {
      console.error('[Service] Prisma 查询出错：', err);
      throw err;
    }
  }

  /**
   * 根据标签获取文章
   */
  static async getArticlesByTag(tag: string) {
    return await prisma.article.findMany({
      where: { tag },
      orderBy: { posttime: 'desc' },
      select: {
        id: true,
        title: true,
        posttime: true,
        subTag: true,
        tag: true,
      },
    });
  }

  /**
   * 根据标签获取最新文章（前10条）
   */
  static async getLatestArticlesByTag(tag: string) {
    return await prisma.article.findMany({
      where: { tag },
      orderBy: { posttime: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        posttime: true,
        subTag: true,
        tag: true,
      },
    });
  }

  /**
   * 更新文章
   */
  static async updateArticle(id: number, title: string, content: string) {
    return await prisma.article.update({
      where: { id },
      data: {
        title: String(title),
        content: String(content),
      },
    });
  }

  /**
   * 删除文章
   */
  static async deleteArticle(id: number) {
    return await prisma.article.delete({
      where: { id },
    });
  }

  /**
   * 根据标签删除文章
   */
  static async deleteArticlesByTag(tag: string) {
    return await prisma.article.deleteMany({
      where: { tag },
    });
  }
/**
 * 上传图片（负责：文件写入 + 生成数据库路径）
 */
static async uploadImage(image: string, title: string) {
  console.log("🔵 [uploadImage] 调用开始啦~");

  if (!image || !title) {
    console.error("❌ [uploadImage] 缺少 image 或 title");
    throw new Error('Missing image or title');
  }

  // -----------------------------
  // ① 格式化文件名（安全处理层）
  // -----------------------------
  const safeTitle = title.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
  console.log(`🟣 [uploadImage] safeTitle = ${safeTitle}`);

  // -----------------------------
  // ② 确定上传目录（环境配置层）
  // -----------------------------
  const uploadDir = process.env.UPLOAD_IMG_TEXT_DIR;
  const headDir = process.env.UPLOAD_URL;

  console.log("🔵 [ENV] UPLOAD_IMG_TEXT_DIR =", uploadDir);
  console.log("🔵 [ENV] UPLOAD_URL =", headDir);

  if (!uploadDir) {
    console.error("❌ 环境变量 UPLOAD_IMG_TEXT_DIR 未设置");
    throw new Error('UPLOAD_IMG_TEXT_DIR environment variable is not set');
  }
  if (!headDir) {
    console.error("❌ 环境变量 UPLOAD_URL 未设置");
    throw new Error('UPLOAD_URL environment variable is not set');
  }

  await mkdir(uploadDir, { recursive: true });
  console.log(`🟢 [mkdir] 确保目录存在: ${uploadDir}`);

  // -----------------------------
  // ③ 写入文件（⭐ 物理存储层）
  // -----------------------------
  const filePath = join(uploadDir, `${safeTitle}.jpeg`);
  console.log(`🟡 [writeFile] 将写入文件: ${filePath}`);

  await writeFile(filePath, Buffer.from(base64Data, 'base64'));
  console.log("🟢 [writeFile] 文件写入完成!");

  // -----------------------------
  // ④ 生成前端 & 数据库使用的 URL（⭐ 路径保存层）
  // -----------------------------
  const fileUrl = `${headDir}/img/text/${safeTitle}.jpeg`;
  console.log(`💚 [fileUrl] 生成图片访问地址: ${fileUrl}`);

  console.log("🟦 [uploadImage] 全流程结束~");

  return {
    fileUrl,  // 给数据库保存 & 前端渲染
  };
}

}

