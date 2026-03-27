import { $fetch } from 'ofetch'
import type { UserSession } from '../utils/session'
import { AUTHORIZATION_HEADER, createBearerHeaders, type TokenPayload } from './authHelpers'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8049'
const LOGIN_BASE_URL = 'https://liux.vip/micronaut'

export const authService = {
  async login(username: string, password: string): Promise<TokenPayload> {
    return $fetch<TokenPayload>(`${LOGIN_BASE_URL}/api/account/login`, {
      method: 'POST',
      body: { username, password }
    })
  },

  async refreshToken(refreshToken: string): Promise<TokenPayload> {
    const params = new URLSearchParams()
    params.append('grant_type', 'refresh_token')
    params.append('refresh_token', refreshToken)

    return $fetch<TokenPayload>(`${LOGIN_BASE_URL}/api/oauth/access_token`, {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  },

  async fetchSession(token?: string, headerName: string = AUTHORIZATION_HEADER): Promise<UserSession> {
    return $fetch<UserSession>(`${API_BASE_URL}/api/auth/session`, {
      method: 'GET',
      headers: createBearerHeaders(token, headerName)
    })
  }
}

export type AuthService = typeof authService
