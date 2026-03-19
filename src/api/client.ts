
import { $fetch } from 'ofetch'
import { useToken } from '../composables/useToken'
import { useUserSession } from '../composables/useUserSession'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8049'
const LOGIN_URL = 'https://liux.vip/micronaut'

// Token 管理工具
const { getToken } = useToken()

// 防止多次刷新 token 的标志
let isRefreshing = false
// 等待 token 刷新完成的 Promise
let refreshPromise: Promise<boolean> | null = null

/**
 * 处理 401 响应
 * 
 * 步骤：
 * 1. 防止多次并发刷新：如果已在刷新中，等待结果
 * 2. 如果刷新成功，返回 true（调用者会重试请求）
 * 3. 如果刷新失败，清除所有 token 并重定向到登录页
 * 
 * @returns {Promise<boolean>} 是否刷新成功
 */
async function handle401(): Promise<boolean> {
  // 如果已经在刷新中，等待刷新结果
  if (isRefreshing) {
    return refreshPromise!.catch(() => false)
  }

  // 标记开始刷新
  isRefreshing = true
  const { refreshSession } = useUserSession()
  refreshPromise = refreshSession()

  try {
    const refreshed = await refreshPromise
    
    if (!refreshed) {
      // 刷新失败，重定向到登录页
      window.location.href = `/`
    }
    
    return refreshed
  } finally {
    // 刷新完成，重置标志
    isRefreshing = false
    refreshPromise = null
  }
}

/**
 * 创建自定义 ofetch 实例，配置全局拦截器
 * - 统一处理 Authorization header
 * - 自动处理 401，调用 token 刷新
 */
const apiFetch = $fetch.create({
  baseURL: API_BASE_URL,

  /**
   * 请求拦截器：自动添加 Authorization header
   */
  onRequest({ options }) {
    const token = getToken()
    if (token) {
      const headers = (options.headers || {}) as unknown as Record<string, string>
      headers['Authorization'] = `Bearer ${token}`
    }
  },

  /**
   * 响应错误拦截器：处理 401，自动刷新 token
   */
  async onResponseError({ response }) {
    debugger
    if (response.status === 401) {
      const refreshed = await handle401()
      if (!refreshed) {
        throw new Error('Token refresh failed')
      }
    }
  }
})

export const apiClient = {
  baseURL: API_BASE_URL,
  loginURL: LOGIN_URL,

  /**
   * GET 请求
   */
  async get<T = any>(path: string, options?: any): Promise<T> {
    return apiFetch<T>(path, { method: 'GET', ...options })
  },

  /**
   * POST 请求
   */
  async post<T = any>(path: string, data?: any, options?: any): Promise<T> {
    return apiFetch<T>(path, { method: 'POST', body: data, ...options })
  },

  /**
   * PUT 请求
   */
  async put<T = any>(path: string, data?: any, options?: any): Promise<T> {
    return apiFetch<T>(path, { method: 'PUT', body: data, ...options })
  },

  /**
   * DELETE 请求
   */
  async delete<T = any>(path: string, options?: any): Promise<T> {
    return apiFetch<T>(path, { method: 'DELETE', ...options })
  },

  /**
   * 登录
   * 
   * 调用后端登录接口，获取 accessToken 和 refreshToken
   * 
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<any>} 登录响应数据
   */
  async login(username: string, password: string): Promise<any> {
    return this.post(`${this.loginURL}/api/account/login`, { username, password })
  },

  async refreshToken(refreshToken: string): Promise<any> {
      const params = new URLSearchParams()
      params.append('grant_type', 'refresh_token')
      params.append('refresh_token', refreshToken)
    return this.post(`${this.loginURL}/api/oauth/access_token`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    })
  }
}

export default apiClient
