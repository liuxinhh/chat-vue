export const AUTHORIZATION_HEADER = 'Authorization'

export interface TokenPayload {
  access_token?: string
  token?: string
  refresh_token?: string
  [key: string]: any
}

export interface TokenStore {
  access: {
    set(token: string): void
  }
  refresh: {
    set(token: string): void
  }
}

export interface ResolvedTokenPair {
  accessToken: string
  refreshToken?: string
}

/**
 * 从 token 响应中提取标准化的 access / refresh token。
 * 后端可能返回 `access_token` 或 `token`，这里统一成一个结构，避免各处重复判断。
 */
export function resolveTokenPair(payload?: TokenPayload | null): ResolvedTokenPair {
  if (!payload) {
    throw new Error('Empty token payload')
  }

  const accessToken = payload.access_token || payload.token
  if (!accessToken) {
    throw new Error('Missing access token in response')
  }

  return {
    accessToken,
    refreshToken: payload.refresh_token
  }
}

/**
 * 将 token 直接写入指定存储对象。
 * 这个函数不关心存储实现，只负责把解析后的 token 落地，方便 session/client 共享。
 */
export function applyTokenPair(storage: TokenStore, payload?: TokenPayload | null): ResolvedTokenPair {
  const pair = resolveTokenPair(payload)

  storage.access.set(pair.accessToken)
  if (pair.refreshToken) {
    storage.refresh.set(pair.refreshToken)
  }

  return pair
}

/**
 * 构造 Bearer 请求头。
 * 统一放在这里后，session 侧和 HTTP 客户端侧可以复用同一段逻辑。
 */
export function createBearerHeaders(token?: string, headerName = AUTHORIZATION_HEADER): Record<string, string> {
  if (!token) return {}

  return {
    [headerName]: `Bearer ${token}`
  }
}
