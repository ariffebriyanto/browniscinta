import { PrismaClient } from '../../node_modules/.prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

// Invalidate cached global PrismaClient if it does not contain the newest models
const getPrismaClient = () => {
  if (globalThis.prismaGlobal) {
    const hasSetting = 'setting' in globalThis.prismaGlobal;
    const hasAnnouncement = 'announcement' in globalThis.prismaGlobal;
    if (hasSetting && hasAnnouncement) {
      return globalThis.prismaGlobal;
    }
  }
  const client = prismaClientSingleton();
  if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = client;
  }
  return client;
};

export const prisma = getPrismaClient();


