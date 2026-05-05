import { defineConfig } from '@prisma/config'

export default defineConfig({
  databases: {
    db: {
      url: process.env.DATABASE_URL || ""
},
    },
  },
)
