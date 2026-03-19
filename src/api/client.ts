// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8049'
const LOGIN_URL = 'https://liux.vip/micronaut'

export const apiClient = {
  baseURL: API_BASE_URL,
  loginURL: LOGIN_URL,

  /**
   * 获取完整 URL
   */
  getUrl(path: string) {
    if (path.startsWith('http')) return path
    return `${this.baseURL}${path}`
  },

  /**
   * 获取 Authorization header
   */
  getAuthHeaders() {
    const token = localStorage.getItem('accessToken')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  },

  /**
   * GET 请求
   */
  async get<T = any>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(this.getUrl(path), {
      method: 'GET',
      headers: this.getAuthHeaders(),
      ...options,
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token 过期，清除并重定向到登录
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = `${this.loginURL}?redirect=${window.location.href}`
      }
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * POST 请求
   */
  async post<T = any>(path: string, data?: any, options?: RequestInit): Promise<T> {
    const response = await fetch(this.getUrl(path), {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = `${this.loginURL}?redirect=${window.location.href}`
      }
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * PUT 请求
   */
  async put<T = any>(path: string, data?: any, options?: RequestInit): Promise<T> {
    const response = await fetch(this.getUrl(path), {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * DELETE 请求
   */
  async delete<T = any>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(this.getUrl(path), {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * 登录
   */
  async login(username: string, password: string) {
    return this.post(this.loginURL + '/api/account/login', { username , password })
  },
}

export default apiClient
