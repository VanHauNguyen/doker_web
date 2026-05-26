import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authApi, usersApi } from '@/api'
import { clearSession, setTokens, USER_KEY } from '@/api/client'
import type { ApiRecord, AuthResponse, User } from '@/types/backend'

export const useAuthStore = defineStore('auth', () => {
  const stored = localStorage.getItem(USER_KEY)
  const user = ref<User | null>(stored ? (JSON.parse(stored) as User) : null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => Boolean(user.value))
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  const persist = (payload: AuthResponse): void => {
    setTokens(payload.access_token, payload.refresh_token)
    user.value = payload.user
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
  }

  const refreshMe = async (): Promise<void> => {
    user.value = await usersApi.me()
    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  }

  const login = async (body: ApiRecord): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      persist(await authApi.login(body))
      await refreshMe()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登入失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  const register = async (body: ApiRecord): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      persist(await authApi.register(body))
      await refreshMe()
    } finally {
      loading.value = false
    }
  }

  const hydrate = async (): Promise<void> => {
    if (!localStorage.getItem('doker_access_token')) return
    try {
      await refreshMe()
    } catch {
      clearSession()
      user.value = null
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout()
    } finally {
      clearSession()
      user.value = null
    }
  }

  return { user, loading, error, isAuthenticated, isAdmin, login, register, hydrate, refreshMe, logout }
})
