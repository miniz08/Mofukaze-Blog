import { prisma } from '../../lib/prisma.js';

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

}
