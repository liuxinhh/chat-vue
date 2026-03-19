import { ref, computed } from 'vue'
import { apiClient } from '../api/client'

export interface UserInfo {
  userId: string
  email: string
  userName: string
}

export interface UserSession {
  user: UserInfo | null
  accessToken: string | null
  isAuthenticated: boolean
}

const state = ref<UserSession>({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
})

export const useUserSession = () => {
  /**
   * 检查用户是否已登录
   */
  const loggedIn = computed(() => state.value.isAuthenticated && !!state.value.accessToken)

  /**
   * 登录
   */
  const login = async (username: string, password: string) => {
    try {
      const response = await apiClient.login(username, password)
      // 保存 token
      const token = response.access_token || response.token
      localStorage.setItem('accessToken', token)

      // 保存用户信息
      state.value.accessToken = token
      state.value.isAuthenticated = true
      return true
    } catch (error) {
      console.error('登录失败:', error)
      return false
    }
  }

  /**
   * 登出
   */
  const logout = async () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    state.value.accessToken = null
    state.value.user = null
    state.value.isAuthenticated = false
  }

  const fetchSession = async () => {
    state.value.user = await apiClient.get('/api/auth/session').then(response => response.user).catch(() => null)
  }

  return {
    user : computed(() => state.value?.user || null),
    loggedIn,
    login,
    logout,
    fetchSession,
  }
}
