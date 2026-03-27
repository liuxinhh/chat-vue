import { $fetch, FetchError, type FetchOptions } from 'ofetch'
import { useToken } from '../composables/useToken'
import { applyTokenPair, createBearerHeaders, type TokenPayload } from './authHelpers'
import { authService } from './authService'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8049'
const LOGIN_URL = 'https://liux.vip/micronaut'

const tokens = useToken()
const { getToken, headerName } = tokens

type AuthFetchOptions = FetchOptions<'json'> & {
  skipAuthRetry?: boolean
}

type QueueItem = {
  proceed: () => void
  reject: (error?: unknown) => void
}

const EXCLUDED_ENDPOINTS = ['/api/account/login', '/api/oauth/access_token']

let isRefreshing = false
let refreshQueue: QueueItem[] = []

function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path

  const base = API_BASE_URL.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

function buildAuthHeaders() {
  return createBearerHeaders(getToken(), headerName)
}

const apiFetch = $fetch.create({
  baseURL: API_BASE_URL,
  /**
   * 所有请求都在这里统一注入 access token。
   * 这样页面和 composable 不需要关心请求头拼装细节。
   */
  onRequest({ options }) {
    const accessToken = getToken()
    if (!options.headers) return

    if (accessToken) {
      options.headers.set(headerName, `Bearer ${accessToken}`)
    } else {
      options.headers.delete(headerName)
    }
  }
})

function isAuthExcluded(path: string) {
  return EXCLUDED_ENDPOINTS.some(endpoint => path.includes(endpoint))
}

function isCode401Payload(payload: unknown) {
  if (!payload || typeof payload !== 'object') return false
  const code = (payload as Record<string, any>).code
  return Number(code) === 401
}

function shouldHandleUnauthorized(path: string, options: AuthFetchOptions) {
  return !options.skipAuthRetry && !isAuthExcluded(path)
}

function isUnauthorizedError(error: unknown): error is FetchError {
  return error instanceof FetchError && error.response?.status === 401
}

/**
 * 将后端返回的 token 响应写入本地存储。
 * 这一步是 refresh / login 共用的，所以单独抽出来。
 */
function applyToken(payload?: TokenPayload | null) {
  applyTokenPair(tokens, payload)
}

/**
 * 刷新 access token。
 * 这里只负责 token 层面的状态恢复，不再处理路由跳转或 UI 提示。
 */
async function performTokenRefresh() {
  const refreshToken = tokens.refresh.get()

  if (!refreshToken) {
    tokens.clear()
    throw new Error('Refresh token not found')
  }

  try {
    const response = await authService.refreshToken(refreshToken)
    applyToken(response)
  } catch (error) {
    tokens.clear()
    throw error
  }
}

/**
 * 当请求遇到 401 时进入刷新队列。
 * 同一时间只允许一个刷新请求，其余请求等待刷新完成后重试。
 */
function enqueueRetry<T>(runner: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    refreshQueue.push({
      proceed: () => {
        runner().then(resolve).catch(reject)
      },
      reject
    })
  })
}

/**
 * 刷新完成后统一唤醒等待队列，或者在失败时统一拒绝。
 */
function flushQueue(error?: unknown) {
  const queue = [...refreshQueue]
  refreshQueue = []

  queue.forEach(item => {
    if (error) {
      item.reject(error)
    } else {
      item.proceed()
    }
  })
}

/**
 * 执行带 token 刷新的请求。
 * 第一次请求失败后会尝试刷新 token 并只重试一次。
 */
async function retryWithFreshToken<T>(runner: () => Promise<T>) {
  if (isRefreshing) {
    return enqueueRetry(runner)
  }

  isRefreshing = true
  try {
    await performTokenRefresh()
    flushQueue()
    return runner()
  } catch (error) {
    flushQueue(error)
    throw error
  } finally {
    isRefreshing = false
  }
}

/**
 * 统一的请求执行入口。
 * 同时兼容 HTTP 401 和业务 code: 401 两种失效信号。
 */
async function execute<T = any>(path: string, options: AuthFetchOptions = {}): Promise<T> {
  const requestOptions: AuthFetchOptions = { ...options }

  try {
    const data = await apiFetch<T>(path, requestOptions)
    if (shouldHandleUnauthorized(path, requestOptions) && isCode401Payload(data)) {
      return retryWithFreshToken(() =>
        execute<T>(path, { ...requestOptions, skipAuthRetry: true })
      )
    }
    return data
  } catch (error) {
    if (shouldHandleUnauthorized(path, requestOptions) && isUnauthorizedError(error)) {
      return retryWithFreshToken(() =>
        execute<T>(path, { ...requestOptions, skipAuthRetry: true })
      )
    }
    throw error
  }
}

export const apiClient = {
  baseURL: API_BASE_URL,
  loginURL: LOGIN_URL,
  resolveApiUrl,
  buildAuthHeaders,

  async get<T = any>(path: string, options: AuthFetchOptions = {}): Promise<T> {
    return execute<T>(path, { method: 'GET', ...options })
  },

  async post<T = any>(path: string, data?: any, options: AuthFetchOptions = {}): Promise<T> {
    return execute<T>(path, { method: 'POST', body: data, ...options })
  },

  async put<T = any>(path: string, data?: any, options: AuthFetchOptions = {}): Promise<T> {
    return execute<T>(path, { method: 'PUT', body: data, ...options })
  },

  async delete<T = any>(path: string, options: AuthFetchOptions = {}): Promise<T> {
    return execute<T>(path, { method: 'DELETE', ...options })
  },

  async login(username: string, password: string) {
    return authService.login(username, password)
  },

  async refreshToken(refreshToken: string) {
    return authService.refreshToken(refreshToken)
  }
}

export default apiClient
