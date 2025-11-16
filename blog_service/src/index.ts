import { createApp, eventHandler, toNodeListener } from 'h3'
import { createServer } from 'node:http'
import { readdirSync, statSync, existsSync } from 'node:fs'
import { join, resolve, extname, basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import 'dotenv/config'


console.log('🌸 服务启动中……')

const PORT = Number(process.env.PORT || 3002)

/**
 * 🧭 自动检测 API 目录
 */
function getApiRoot(): string {
  const distPath = resolve('dist/src/api')
  const srcPath = resolve('src/api')

  if (existsSync(distPath)) {
    console.log(`[DEBUG] Using production API dir: ${distPath}`)
    return distPath
  }
  if (existsSync(srcPath)) {
    console.log(`[DEBUG] Using development API dir: ${srcPath}`)
    return srcPath
  }

  throw new Error('❌ 无法找到 API 目录 (src/api 或 dist/src/api 都不存在)')
}

/**
 * 🔍 动态注册 API 路由
 */
async function registerApiRoutes(app: any) {
  const apiRoot = getApiRoot()
  console.log('[DEBUG] Scanning API dir:', apiRoot)

  const entries = readdirSync(apiRoot)
  for (const entry of entries) {
    const entryPath = join(apiRoot, entry)
    const stat = statSync(entryPath)

    if (stat.isDirectory()) {
      const dirName = entry
      const files = readdirSync(entryPath)
      for (const file of files) {
        if (!/\.(ts|js|mjs|cjs)$/.test(file)) continue
        const name = basename(file, extname(file))
        const routePath = `/${dirName}/${name}`
        const mod = await import(pathToFileURL(join(entryPath, file)).href)
        if (mod.default) {
          app.use(
            eventHandler((event) => {
              const url = event.req.url?.split('?')[0] || ''
              if (url === routePath) {
                return mod.default(event)
              }
            })
          )
          console.log(`[DEBUG] Route registered: ${routePath}`)
        }
      }
    } else if (stat.isFile() && /\.(ts|js|mjs|cjs)$/.test(entry)) {
      const name = basename(entry, extname(entry))
      const routePath = `/${name}`
      const mod = await import(pathToFileURL(entryPath).href)
      if (typeof mod.default === 'function') {
        app.use(
          eventHandler((event) => {
            const url = event.req.url?.split('?')[0] || ''
            if (url === routePath) {
              return mod.default(event)
            }
          })
        )
        console.log(`[DEBUG] Route registered: ${routePath}`)
      }
    }
  }
}


/**
 * 🌸 主入口
 */
async function main() {
  const app = createApp()
  ;(globalThis as any).defineEventHandler = (fn: any) => eventHandler(fn)
  console.log('[DEBUG] app created!')

  // 🐾 调试中间件
  app.use(
    eventHandler((event) => {
      console.log(`[DEBUG] ${event.req.method} ${event.req.url}`)
    })
  )

  // 🚀 注册 API 路由
  await registerApiRoutes(app)
  console.log('[DEBUG] routes registered!')


  // ✅ 根路由兜底
  app.use(
    '/',
    eventHandler(() => ({ status: 'ok' }))
  )

  // 🧩 启动 HTTP 服务器
  const server = createServer(toNodeListener(app))
  server.listen(PORT, () => {
    console.log(`[blog-service] listening on http://localhost:${PORT}`)
  })

}

void main()
