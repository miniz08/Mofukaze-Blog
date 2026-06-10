import { prisma } from '../../lib/prisma.js';

export class CollectionService {
  /**
   * 创建合集
   */
  static async createCollection(title: string, content: string, tag: string, imageUrl: string) {
    return await prisma.collection.create({
      data: {
        title,
        content,
        tag,
        imageUrl,
        posttime: new Date()
      },
    });
  }

  /**
   * 根据 ID 查找合集
   */
  static async findCollectionByID(id: number) {
    return await prisma.collection.findMany({
      where: { id },
    });
  }

  /**
   * 获取所有合集
   */
  static async getAllCollections() {
    return await prisma.collection.findMany();
  }

  /**
   * 更新合集
   */
  static async updateCollection(id: number, title: string, content: string) {
    return await prisma.collection.update({
      where: { id },
      data: {
        title: String(title),
        content: String(content),
      },
    });
  }

  /**
   * 删除合集
   */
  static async deleteCollection(id: number) {
    return await prisma.collection.delete({
      where: { id },
    });
  }
}
