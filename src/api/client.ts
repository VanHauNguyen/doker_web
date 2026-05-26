import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'

const DEPLOYED_BACKEND_URL = 'https://motorcycle-backend-21r0.onrender.com'
const REQUEST_TIMEOUT_MS = 45000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEPLOYED_BACKEND_URL

export const ACCESS_TOKEN_KEY = 'doker_access_token'
export const REFRESH_TOKEN_KEY = 'doker_refresh_token'
export const USER_KEY = 'doker_auth_user'

interface RetriableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean
}

export class ApiError extends Error {
  status?: number
  details?: unknown

  constructor(message: string, status?: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
})

export const rawClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
})

export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY)
export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY)

export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export const clearSession = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

const messageFromError = (data: unknown, fallback: string): string => {
  if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>
    if (typeof record.message === 'string') return record.message
    if (Array.isArray(record.message)) return record.message.join(', ')
    if (typeof record.error === 'string') return record.error
  }
  return fallback
}

const friendlyErrorMessage = (error: AxiosError): string => {
  if (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout')) {
    return '伺服器正在啟動中，請稍候再試'
  }
  if (!error.response) {
    return '伺服器喚醒中，請稍候...'
  }
  return messageFromError(error.response.data, error.message || '資料載入失敗')
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshPromise: Promise<string | null> | null = null

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  const response = await rawClient.post<{ access_token: string; refresh_token: string }>('/auth/refresh', {
    refresh_token: refreshToken,
  })
  setTokens(response.data.access_token, response.data.refresh_token)
  return response.data.access_token
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequest | undefined
    const status = error.response?.status

    if (status === 401 && original && !original._retry) {
      original._retry = true
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null
        })
        const token = await refreshPromise
        if (token) {
          original.headers.Authorization = `Bearer ${token}`
          return apiClient(original)
        }
      } catch {
        clearSession()
      }
    }

    throw new ApiError(friendlyErrorMessage(error), status, error.response?.data)
  },
)

rawClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    throw new ApiError(friendlyErrorMessage(error), error.response?.status, error.response?.data)
  },
)

export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  (await apiClient.get<T>(url, config)).data

export const post = async <T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig): Promise<T> =>
  (await apiClient.post<T>(url, body, config)).data

export const patch = async <T, B = unknown>(url: string, body?: B): Promise<T> =>
  (await apiClient.patch<T>(url, body)).data

export const put = async <T, B = unknown>(url: string, body?: B): Promise<T> =>
  (await apiClient.put<T>(url, body)).data

export const del = async <T>(url: string): Promise<T> => (await apiClient.delete<T>(url)).data

export const apiBaseUrl = API_BASE_URL
