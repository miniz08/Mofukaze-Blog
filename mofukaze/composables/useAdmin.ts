/**
 * 管理员鉴权 Composable
 * 
 * 配合 api_gateway 的简单鉴权方案：
 * - 使用 Cookie 存储 token（Nuxt3 SSR 安全）
 * - 提供 isAdmin 状态和 getAuthHeader 工具
 * - 自动检测管理员状态
 */

export const useAdmin = () => {
  // 使用 Nuxt3 的 useCookie 存储 token（SSR 安全，自动同步到客户端）
  const adminToken = useCookie<string>('admin_token', {
    default: () => '',
    maxAge: 60 * 60 * 24 * 30, // 30 天
    sameSite: 'lax',
    secure: false, // 开发环境用 false，生产环境建议 true（需要 HTTPS）
  })

  // 管理员状态（响应式）
  const isAdmin = useState<boolean>('admin.isAdmin', () => false)
  const isLoading = useState<boolean>('admin.isLoading', () => false)

  /**
   * 设置管理员 token
   * @param token - 管理员令牌
   */
  const setToken = (token: string) => {
    adminToken.value = token
    // 设置后自动检测状态
    if (process.client) {
      checkAdminStatus()
    }
  }

  /**
   * 清除 token（退出登录）
   */
  const clearToken = () => {
    adminToken.value = ''
    isAdmin.value = false
  }

  /**
   * 检测当前是否为管理员
   * 调用 /api/auth/status 接口，带上 Authorization 头
   */
  const checkAdminStatus = async () => {
    if (!adminToken.value) {
      isAdmin.value = false
      return
    }

    isLoading.value = true
    try {
      const res: any = await $fetch('/api/auth/status', {
        headers: {
          Authorization: `AdminToken ${adminToken.value}`
        }
      })
      isAdmin.value = !!res?.isAdmin
    } catch (err) {
      console.warn('[useAdmin] 管理员状态检测失败', err)
      isAdmin.value = false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 获取 Authorization 头（用于写操作请求）
   * @returns 如果存在 token，返回 { Authorization: 'AdminToken xxx' }，否则返回 undefined
   */
  const getAuthHeader = (): Record<string, string> | undefined => {
    if (!adminToken.value) {
      return undefined
    }
    return {
      Authorization: `AdminToken ${adminToken.value}`
    }
  }

  /**
   * 初始化：如果客户端有 token，自动检测状态
   */
  if (process.client && adminToken.value) {
    checkAdminStatus()
  }

  return {
    // 状态
    isAdmin: readonly(isAdmin),
    isLoading: readonly(isLoading),
    token: readonly(adminToken),
    
    // 方法
    setToken,
    clearToken,
    checkAdminStatus,
    getAuthHeader,
  }
}

