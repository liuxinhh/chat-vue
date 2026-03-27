import { AUTHORIZATION_HEADER } from '../api/authHelpers'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

/**
 * localStorage 的最薄封装。
 * 这里不做任何业务判断，只把读写删除行为统一起来，避免散落在各处。
 */
const storage = {
  get(key: string) {
    return localStorage.getItem(key) ?? ''
  },
  set(key: string, value: string) {
    if (value) {
      localStorage.setItem(key, value)
    }
  },
  remove(key: string) {
    localStorage.removeItem(key)
  }
}

const accessToken = {
  get: () => storage.get(ACCESS_TOKEN_KEY),
  set: (token: string) => storage.set(ACCESS_TOKEN_KEY, token),
  remove: () => storage.remove(ACCESS_TOKEN_KEY)
}

const refreshToken = {
  get: () => storage.get(REFRESH_TOKEN_KEY),
  set: (token: string) => storage.set(REFRESH_TOKEN_KEY, token),
  remove: () => storage.remove(REFRESH_TOKEN_KEY)
}

const tokenUtils = {
  clearAll: () => {
    accessToken.remove()
    refreshToken.remove()
  },
  hasAccess: () => !!accessToken.get()
}

export function useToken() {
  return {
    /** 更语义化的新接口：显式区分 access / refresh token。 */
    access: accessToken,
    refresh: refreshToken,
    /** 清空全部 token，通常用于退出登录或刷新失败。 */
    clear: tokenUtils.clearAll,
    /** 当前是否存在 access token。 */
    hasAccess: tokenUtils.hasAccess,
    /** 统一的鉴权请求头名称，供 HTTP 层复用。 */
    headerName: AUTHORIZATION_HEADER,
    // Backward compatible aliases
    getToken: accessToken.get,
    setToken: accessToken.set,
    removeToken: accessToken.remove,
    getRefreshToken: refreshToken.get,
    setRefreshToken: refreshToken.set,
    removeRefreshToken: refreshToken.remove,
    clearAllTokens: tokenUtils.clearAll,
    hasToken: tokenUtils.hasAccess
  }
}
