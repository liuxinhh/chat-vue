/**
 * 用户会话 Composable（共享状态）
 * 
 * 用户登录状态管理和 token 存储
 * 
 * 注意：
 * - 使用 createSharedComposable 确保全应用只有一个实例
 * - 不在顶部调用 Vue Router，避免 SSR 问题
 * 
 * @returns {Object} 包含登录状态和相关方法的对象
 */

import { createSharedComposable } from '@vueuse/core'
import { ref, computed } from 'vue'
import { apiClient } from '../api/client'
import type { UserSession } from '../utils/session'
import { useToken } from './useToken'

/**
 * 用户信息接口
 */
export interface UserInfo {
  userId: string
  email: string
  userName: string
}

export const useUserSession = createSharedComposable(() => {
  
  /** 用户会话数据 */
  const session = ref<UserSession | null>(null)
  
  // 获取 token 管理工具（在函数内部调用，确保响应式）
  const { setToken, setRefreshToken, clearAllTokens, getRefreshToken } = useToken()

  /**
   * 检查用户是否已登录
   * @returns {boolean} 有用户信息返回 true，否则返回 false
   */
  const loggedIn = computed(() => Boolean(session.value?.user))

  /**
   * 登录
   * 
   * 1. 调用后端登录接口
   * 2. 保存返回的 accessToken 和 refreshToken
   * 3. 返回登录是否成功
   * 
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<boolean>} 登录成功返回 true
   */
  const login = async (username: string, password: string) => {
    try {
      const response = await apiClient.login(username, password)
      
      // 保存 accessToken
      const token = response.access_token || response.token
      setToken(token)
      
      // 保存 refreshToken
      if (response.refresh_token) {
        setRefreshToken(response.refresh_token)
      }
      
      return true
    } catch (error) {
      console.error('登录失败:', error)
      return false
    }
  }

  /**
   * 登出
   * 
   * 清空所有保存的 token，返回到未登录状态
   * 
   * 注：不负责路由跳转，由调用者控制页面导航
   */
  const logout = async () => {
    clearAllTokens()
  }

  /**
   * 获取当前会话信息
   * 
   * 调用后端接口获取用户会话数据
   * 失败时静默处理，返回 null
   */
  const fetchSession = async () => {
    session.value = await apiClient.get('/api/auth/session').catch(() => null)
  }

  /**
   * 刷新 accessToken 并更新存储
   * 
   * 流程：
   * 1. 检查 refreshToken 是否存在
   * 2. 调用 OAuth 端点获取新 token
   * 3. 如果成功，保存新 token；如果失败，清除所有 token
   * 
   * @returns {Promise<boolean>} 刷新是否成功
   */
  const refreshSession = async (): Promise<boolean> => {
    const currentRefreshToken = getRefreshToken()

    if (!currentRefreshToken) {
      clearAllTokens()
      return false
    }

    const newToken = await  apiClient.refreshToken(currentRefreshToken).catch(() => null)

    if (newToken) {
      setToken(newToken)
      return true
    }

    clearAllTokens()
    return false
  }
  
  return {
    /** 当前登录用户信息（计算属性，响应式） */
    user: computed(() => session.value?.user || null),
    
    /** 用户登录状态（计算属性，响应式） */
    loggedIn,
    
    /** 登录方法 */
    login,
    
    /** 登出方法 */
    logout,
    
    /** 获取会话信息方法 */
    fetchSession,

    /** 刷新 token 方法 */
    refreshSession
  }
})