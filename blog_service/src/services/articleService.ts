import { prisma } from '../../lib/prisma.js';
import { writeFile, mkdir } from 'fs/promises';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';
import { createHash } from 'crypto';

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
   * 获取当前所有的tag
   */
  static async getAllTag(){
    return await prisma.article.findMany({
      distinct:['tag'],
      select:{
        tag:true,
      },
    }
    );
  }
  /**
   * 获取当前tag下所有的subTag
   */
static async getSubTag(tag: string) {
  const rows = await prisma.article.findMany({
    where: { tag },
    distinct: ['subTag'],
    select: {
      subTag: true
    }
  });

  // 返回纯数组
  return rows.map(r => r.subTag);
}


  /**
   * 根据 ID 查找文章
   */
  static async findArticleByID(id: number) {
    return await prisma.article.findMany({
      where: { id,visible:true },
    });
  }

  /**
   * 获取所有文章
   */
static async getAllArticles() {
  return await prisma.article.findMany({
    where: { visible: true }
  });
}


  /**
   * 获取最新文章（前10条）
   * 优化：只返回内容摘要（前200字符），减少数据传输量
   */
   static async getLatestArticles() {
  console.log('[Service] 正在查询数据库...');
  try {
    const articles = await prisma.article.findMany({
      where: { visible: true },
      orderBy: { posttime: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        posttime: true,
        content: true,
      },
    });


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
    where: { tag, visible: true },
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
    where: { tag, visible: true },
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


static async updateArticle(
  id: number,
  data: Partial<{
    title: string
    content: string
    tag: string
    subTag: string
    visible: boolean
  }>
) {

  if (typeof data !== "object" || Array.isArray(data)) {
    throw new Error("更新数据格式错误！必须是对象 (JSON) 而不是字符串或数组！");
  }

  const allowedFields = ["title", "content", "tag", "subTag", "visible"];

  const cleanData = Object.fromEntries(
    Object.entries(data).filter(
      ([key, value]) => allowedFields.includes(key) && value !== undefined
    )
  );

  if (Object.keys(cleanData).length === 0) {
    throw new Error("没有任何需要更新的字段");
  }

  return prisma.article.update({
    where: { id },
    data: cleanData,
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
   * 上传图片（负责：计算SHA256 + 生成目录结构 + 文件写入 + 生成数据库路径）
   * @param fileStream - 文件流（Readable stream）
   * @param title - 文件名标题（不再用于文件名）
   */
  static async uploadImage(fileStream: Readable, title: string): Promise<{ fileUrl: string }> {
    console.log("🔵 [Service] uploadImage 调用开始啦~");
    console.log("🔵 [Service] fileStream 类型:", fileStream.constructor.name);
    console.log("🔵 [Service] fileStream readable:", fileStream.readable);
    console.log("🔵 [Service] title:", title);

    if (!fileStream || !title) {
      console.error("❌ [Service] 缺少 fileStream 或 title");
      throw new Error('Missing fileStream or title');
    }

    // -----------------------------
    // ① 读取文件流并计算SHA256哈希值
    // -----------------------------
    const hash = createHash('sha256');
    const chunks: Buffer[] = [];
    let totalSize = 0;

    console.log("🔵 [Service] 开始读取文件流并计算SHA256...");

    await new Promise<void>((resolve, reject) => {
      fileStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        hash.update(chunk);
        totalSize += chunk.length;
        console.log(`📦 [Service] 读取数据块，大小: ${chunk.length}, 累计: ${totalSize}`);
      });

      fileStream.on('end', () => {
        console.log(`🟢 [Service] 文件读取完成，总大小: ${totalSize}`);
        resolve();
      });

      fileStream.on('error', (err) => {
        console.error("❌ [Service] 读取文件流错误:", err);
        reject(err);
      });
    });

    // 生成SHA256哈希值
    const hashValue = hash.digest('hex');
    console.log(`🟣 [Service] 生成的SHA256哈希值: ${hashValue}`);

    // -----------------------------
    // ② 根据哈希值生成目录结构和文件名
    // -----------------------------
    const dir1 = hashValue.substring(0, 2); // 前两个字符
    const dir2 = hashValue.substring(2, 4); // 第三四个字符
    const fileName = `${hashValue}`; // 使用哈希值作为文件名

    console.log(`🟣 [Service] 生成的目录结构: ${dir1}/${dir2}/${fileName}`);

    // -----------------------------
    // ③ 确定上传目录（环境配置层）
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

    // 创建完整的目录路径
    const fullDirPath = join(uploadDir, dir1, dir2);
    await mkdir(fullDirPath, { recursive: true });
    console.log(`🟢 [mkdir] 确保目录存在: ${fullDirPath}`);

    // -----------------------------
    // ④ 写入文件（⭐ 物理存储层）
    // -----------------------------
    const filePath = join(fullDirPath, fileName);
    console.log(`🟡 [writeFile] 将写入文件: ${filePath}`);

    // 将之前读取的数据写入文件
    const fileBuffer = Buffer.concat(chunks);
    await writeFile(filePath, fileBuffer);
    console.log("🟢 [Service] 文件写入完成!");

    // -----------------------------
    // ⑤ 生成前端 & 数据库使用的 URL（⭐ 路径保存层）
    // -----------------------------
    const fileUrl = `${headDir}/img/text/${dir1}/${dir2}/${fileName}`;
    console.log(`💚 [fileUrl] 生成图片访问地址: ${fileUrl}`);

    console.log("🟦 [uploadImage] 全流程结束~");

    return {
      fileUrl,  // 给数据库保存 & 前端渲染
    };
  }

}
