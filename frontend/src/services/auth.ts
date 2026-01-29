import { api } from './api'

export interface AuthUser {
  id: string
  email: string
  name?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password })
    return response.data.data ?? response.data
  },

  async register(name: string, email: string, password: string): Promise<AuthUser> {
    const response = await api.post('/auth/register', { name, email, password })
    return response.data.data ?? response.data
  },

  async verify(): Promise<{ valid: boolean; user?: AuthUser }> {
    const response = await api.get('/auth/verify')
    return response.data.data ?? response.data
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data.data ?? response.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },
}
