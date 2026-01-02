import { createApp, eventHandler, toNodeListener } from 'h3'
import { createServer } from 'node:http'
import { readdirSync, statSync, existsSync } from 'node:fs'
import { join, resolve, extname, basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import 'dotenv/config'


console.log('🌸 服务启动中……')

const PORT = Number(process.env.PORT || 3002)

// 放在文件顶部已有的 imports 之后（或同文件中）
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
 * 注册规则：
 * 1) 如果模块导出 articleRoutes 或 routes（对象），把对象的 key 当作完整路由注册（key 必须以 / 开头）
 * 2) 兼容旧版：如果模块有 default 导出（函数），按 /dirname/filename 或 /filename 注册
 */
async function registerApiRoutes(app: any) {
  const apiRoot = getApiRoot()
  console.log('[DEBUG] Scanning API dir:', apiRoot)

  const entries = readdirSync(apiRoot)

  for (const entry of entries) {
    const entryPath = join(apiRoot, entry)
    const stat = statSync(entryPath)

    // --- 处理子目录 ---
    if (stat.isDirectory()) {
      const dirName = entry
      const files = readdirSync(entryPath)

      for (const file of files) {
        if (!/\.(ts|js|mjs|cjs)$/.test(file)) continue
        const filePath = join(entryPath, file)
        const mod = await import(pathToFileURL(filePath).href)

        // 自动识别所有 xxxRoutes
        registerModuleRoutes(app, mod)

        // 兼容 default 导出
        if (typeof mod.default === 'function') {
          const name = basename(file, extname(file))
          const routePath = `/${dirName}/${name}`
          console.log(`[DEBUG] [legacy] Route registered: ${routePath}`)
          app.use(routePath, mod.default)
        }
      }

      continue
    }

    // --- 根目录文件 ---
    if (stat.isFile() && /\.(ts|js|mjs|cjs)$/.test(entry)) {
      const mod = await import(pathToFileURL(entryPath).href)

      registerModuleRoutes(app, mod)

      if (typeof mod.default === 'function') {
        const name = basename(entry, extname(entry))
        const routePath = `/${name}`
        console.log(`[DEBUG] [legacy] Route registered: ${routePath}`)
        app.use(routePath, mod.default)
      }
    }
  }
}

/**
 * 自动扫描模块内所有以 xxxRoutes 结尾的导出，并注册路由
 */
function registerModuleRoutes(app: any, mod: any) {
  for (const key of Object.keys(mod)) {
    if (!key.endsWith('Routes')) continue // 只处理 articleRoutes/commentRoutes/...Routes

    const map = mod[key]
    if (!map || typeof map !== 'object') continue

    for (const routeKey of Object.keys(map)) {
      const handler = map[routeKey]
      if (typeof handler !== 'function') continue

      console.log(`[DEBUG] [map:${key}] Route registered: ${routeKey}`)

      // 使用严格匹配：只有当请求路径与 routeKey 完全相等时才交给对应 handler
      app.use(
        eventHandler((event) => {
          const url = event.req.url?.split('?')[0] || ''

          if (url === routeKey) {
            return handler(event)
          }
        }),
      )
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
