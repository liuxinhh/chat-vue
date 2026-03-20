import { $fetch } from 'ofetch'
import { useToken } from '../composables/useToken'
import { useUserSession } from '../composables/useUserSession'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8049'
const LOGIN_URL = 'https://liux.vip/micronaut'

const { getToken } = useToken()
const { refreshSession } = useUserSession()

// 刷新标志 & 等待队列
let isRefreshing = false

type FailedQueueItem = { resolve: (value?: unknown) => void; reject: (err?: any) => void }
let failedQueue: FailedQueueItem[] = []

const excludeEndpoints = [
  '/api/account/login',
  '/api/oauth/access_token'
]

function processQueue(error: any = null) {
  failedQueue.forEach(item => (error ? item.reject(error) : item.resolve()))
  failedQueue = []
}

async function handle401(originalResponse: any, originalRequest: any, originalOptions: any): Promise<any> {
  if (isRefreshing) {
    // 已经在刷新 → 加入等待队列 → 
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject })
    })
      .then(() => apiFetch(originalRequest, originalOptions))
      .catch(() => originalResponse)
  }

  isRefreshing = true

  try {
    const refreshed = await refreshSession()

    if (!refreshed) {
      // 刷新失败 → 清 token & 重定向
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
      // 清空队列并拒绝等待的请求
      processQueue(new Error('Token refresh failed'))
      // 返回原始的响应结果
      return originalResponse
    }

    // 刷新成功 → 清空队列，所有等待的请求继续
    processQueue()

    // 用最新 token 重试原始请求
    return apiFetch(originalRequest, originalOptions)
  } catch (err) {
    processQueue(err)
    throw err
  } finally {
    isRefreshing = false
  }
}

const apiFetch = $fetch.create({
  baseURL: API_BASE_URL,

  onRequest({ options }) {
    const accessToken = getToken()
    if (accessToken) {
      options.headers.delete('Authorization')
      options.headers.append('Authorization', `Bearer ${accessToken}`)
    }
  },

  async onResponse({ response, request, options }) {
    // 无论 HTTP 401 还是 200 + code:401，都视为需要刷新 token
    const needRefresh =
      response.status === 401 ||
      (response.status === 200 &&
        response._data &&
        typeof response._data === 'object' &&
        response._data?.code === 401)

    if (!needRefresh) return

    // 排除登录相关接口，避免刷新失败导致的循环重试
    const url = String(request)
    if (excludeEndpoints.some(e => url.includes(e))) {
      return;
    }

    // 防止无限重试(refresh 本身失败的情况)
    if ((options as any)._isRetried) {
      console.warn('Detected token refresh loop, aborting')
      
    }

    // 标记已重试过一次
    (options as any)._isRetried = true

    response = await handle401(response, request, options)
    // 执行刷新逻辑
    // const refreshed = await handle401(response ,request, options)

    // if (!refreshed) {
    //   throw new Error('Token refresh failed')
    // }

    // response._data = await apiFetch(request, options)
  }
})

export const apiClient = {
  baseURL: API_BASE_URL,
  loginURL: LOGIN_URL,

  async get<T = any>(path: string, options = {}): Promise<T> {
    return apiFetch<T>(path, { method: 'GET', ...options })
  },

  async post<T = any>(path: string, data?: any, options = {}): Promise<T> {
    return apiFetch<T>(path, { method: 'POST', body: data, ...options })
  },

  async put<T = any>(path: string, data?: any, options = {}): Promise<T> {
    return apiFetch<T>(path, { method: 'PUT', body: data, ...options })
  },

  async delete<T = any>(path: string, options = {}): Promise<T> {
    return apiFetch<T>(path, { method: 'DELETE', ...options })
  },

  async login(username: string, password: string): Promise<any> {
    return this.post(`${this.loginURL}/api/account/login`, { username, password })
  },

  async refreshToken(refreshToken: string): Promise<any> {
    const params = new URLSearchParams()
    params.append('grant_type', 'refresh_token')
    params.append('refresh_token', refreshToken)

    return this.post(`${this.loginURL}/api/oauth/access_token`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  }
}

export default apiClient