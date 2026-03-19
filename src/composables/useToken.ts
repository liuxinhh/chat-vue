const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const AUTHORIZATION_HEADER = 'Authorization'

// ============================================
// Access Token 相关操作
// ============================================

/**
 * 从 localStorage 获取 accessToken
 * @returns {string} 返回存储的 token，不存在返回空字符串
 */
function getToken(): string {
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? ''
}

/**
 * 保存 accessToken 到 localStorage
 * @param {string} token - 待保存的 token
 */
function setToken(token: string): void {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  }
}

/**
 * 删除 localStorage 中的 accessToken
 */
function removeToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

// ============================================
// Refresh Token 相关操作
// ============================================

/**
 * 从 localStorage 获取 refreshToken
 * @returns {string} 返回存储的 refresh token，不存在返回空字符串
 */
function getRefreshToken(): string {
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? ''
}

/**
 * 保存 refreshToken 到 localStorage
 * @param {string} token - 待保存的 refresh token
 */
function setRefreshToken(token: string): void {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  }
}

/**
 * 删除 localStorage 中的 refreshToken
 */
function removeRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// ============================================
// 统一操作
// ============================================

/**
 * 清空所有 token（accessToken 和 refreshToken）
 * 用于登出操作
 */
function clearAllTokens(): void {
  removeToken()
  removeRefreshToken()
}

/**
 * 检查 accessToken 是否存在
 * @returns {boolean} token 存在返回 true，否则返回 false
 */
function hasToken(): boolean {
  return !!getToken()
}

// ============================================
// 导出 Composable
// ============================================

/**
 * Token 管理 Composable
 * @returns {Object} 返回所有 token 操作方法
 */
export function useToken() {
  return {
    // Access Token 操作
    getToken,
    setToken,
    removeToken,
    
    // Refresh Token 操作
    getRefreshToken,
    setRefreshToken,
    removeRefreshToken,
    
    // 统一操作
    clearAllTokens,
    hasToken,
    
    // 常量
    headerName: AUTHORIZATION_HEADER
  }
}
