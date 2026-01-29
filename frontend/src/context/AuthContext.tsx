import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authService, type AuthUser } from '../services/auth'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AUTH_STORAGE_KEY = 'webide.auth'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const readStoredAuth = (): Pick<AuthState, 'user' | 'accessToken'> => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) {
      return { user: null, accessToken: null }
    }
    const parsed = JSON.parse(raw) as {
      user?: AuthUser
      accessToken?: string
    }
    return {
      user: parsed.user ?? null,
      accessToken: parsed.accessToken ?? null,
    }
  } catch {
    return { user: null, accessToken: null }
  }
}

const persistAuth = (state: Pick<AuthState, 'user' | 'accessToken'>) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const stored = useMemo(() => readStoredAuth(), [])
  const [user, setUser] = useState<AuthUser | null>(stored.user)
  const [accessToken, setAccessToken] = useState<string | null>(
    stored.accessToken,
  )
  const [isLoading, setIsLoading] = useState(false)

  const refreshSession = useCallback(async () => {
    if (!accessToken) return
    setIsLoading(true)
    try {
      const response = await authService.verify()
      if (response.valid && response.user) {
        setUser(response.user)
        persistAuth({ user: response.user, accessToken })
      }
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const data = await authService.login(email, password)
      setUser(data.user)
      setAccessToken(data.accessToken)
      persistAuth({ user: data.user, accessToken: data.accessToken })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setIsLoading(true)
      try {
        await authService.register(name, email, password)
        const data = await authService.login(email, password)
        setUser(data.user)
        setAccessToken(data.accessToken)
        persistAuth({ user: data.user, accessToken: data.accessToken })
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authService.logout()
    } finally {
      setUser(null)
      setAccessToken(null)
      localStorage.removeItem(AUTH_STORAGE_KEY)
      setIsLoading(false)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      login,
      register,
      logout,
      refreshSession,
    }),
    [accessToken, isLoading, login, logout, refreshSession, register, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
