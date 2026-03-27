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
import type { UserSession } from '../utils/session'
import { applyTokenPair } from '../api/authHelpers'
import { authService } from '../api/authService'
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

  // 统一从 token composable 读取写入，避免在这里直接碰 localStorage 细节。
  const tokens = useToken()

  /**
   * 检查用户是否已登录
   * @returns {boolean} 有用户信息返回 true，否则返回 false
   */
  const loggedIn = computed(() => Boolean(session.value?.user))

  /**
   * 从当前 access token 重新拉取会话信息。
   * 这个方法既用于页面初始化，也用于登录后补全 user 数据。
   */
  const restoreSession = async () => {
    const currentToken = tokens.access.get()

    if (!currentToken) {
      session.value = null
      return null
    }

    try {
      session.value = await authService.fetchSession(currentToken, tokens.headerName)
    } catch {
      session.value = null
    }

    return session.value
  }

  /**
   * 登录成功后同时写入 token，并立刻刷新一次会话数据。
   * 这里不关心 UI 反馈，只返回 success / fail。
   */
  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login(username, password)
      applyTokenPair(tokens, response)
      await restoreSession()
      return true
    } catch (error) {
      console.error('登录失败:', error)
      tokens.clear()
      session.value = null
      return false
    }
  }

  /**
   * 登出时只负责清理本地认证状态。
   * 路由跳转、弹窗关闭等交给调用方处理。
   */
  const logout = async () => {
    tokens.clear()
    session.value = null
  }

  /**
   * 保持对外兼容的旧接口，内部直接复用 restoreSession。
   */
  const fetchSession = restoreSession

  /**
   * 刷新 access token。
   * 如果 refresh token 不存在或刷新失败，则清空本地认证状态。
   */
  const refreshSession = async (): Promise<boolean> => {
    const currentRefreshToken = tokens.refresh.get()

    if (!currentRefreshToken) {
      tokens.clear()
      session.value = null
      return false
    }

    try {
      const response = await authService.refreshToken(currentRefreshToken)
      applyTokenPair(tokens, response)
      return true
    } catch {
      tokens.clear()
      session.value = null
      return false
    }
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

    /** 恢复当前会话 */
    restoreSession,

    /** 刷新 token 方法 */
    refreshSession
  }
})
