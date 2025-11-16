import { PrismaClient } from '@prisma/client';

// 单例模式的 Prisma 实例
// 在 Nuxt 3 中，使用 globalThis 确保在 HMR 和 SSR 环境下都能正确重用实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // 减少日志记录以提升性能，只在需要调试时启用 'query'
    // 如果需要调试 SQL，可以临时添加 'query'，但会影响性能
    log: ['error'],
  });

// 确保单例模式在所有环境下都生效（包括生产环境）
globalForPrisma.prisma = prisma;

