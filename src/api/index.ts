import { io, type Socket } from 'socket.io-client'
import { apiBaseUrl, del, get, getAccessToken, patch, post, put, rawClient } from './client'
import type {
  ApiList,
  ApiRecord,
  AuthResponse,
  Cart,
  Category,
  ChatMessage,
  ChatRoom,
  Coupon,
  MembershipTier,
  NewsItem,
  NotificationItem,
  Order,
  Payment,
  Product,
  Reward,
  ServiceItem,
  User,
  Vehicle,
  Warranty,
  WarrantyLog,
} from '@/types/backend'

export const authApi = {
  captchaUrl: (key: string) => `${apiBaseUrl}/auth/captcha?key=${encodeURIComponent(key)}`,
  register: (body: ApiRecord) => post<AuthResponse>('/auth/register', body),
  login: (body: ApiRecord) => post<AuthResponse>('/auth/login', body),
  logout: () => post<{ message: string }>('/auth/logout'),
  sendOtp: (target: string, type: string) => post<{ message: string }>('/auth/send-otp', { target, type }),
  verifyOtp: (body: ApiRecord) => post<boolean>('/auth/verify-otp', body),
  resetPassword: (body: ApiRecord) => post<{ message: string }>('/auth/reset-password', body),
  changeEmail: (body: ApiRecord) => post<{ message: string }>('/auth/change-email', body),
}

export const usersApi = {
  me: () => get<User>('/users/me'),
  customers: (params?: ApiRecord) => get<ApiList<User>>('/users/admin/customers', { params }),
  updateProfile: (body: Partial<User>) => patch<User>('/users/profile', body),
  updateAvatar: (url: string) => post<User>('/users/avatar', { url }),
  changePassword: (body: ApiRecord) => post<{ message: string }>('/users/change-password', body),
  deleteAccount: (body: ApiRecord) => post<User>('/users/delete-account', body),
  saveFcmToken: (fcmToken: string) => post<ApiRecord>('/users/fcm-token', { fcmToken }),
  removeFcmToken: () => del<ApiRecord>('/users/fcm-token'),
}

export const uploadApi = {
  single: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return post<{ success: boolean; url: string }>('/upload/single', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  multiple: async (files: File[]) => {
    const form = new FormData()
    files.forEach((file) => form.append('files', file))
    return post<{ success: boolean; urls: string[] }>('/upload/multiple', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const vehiclesApi = {
  list: () => get<Vehicle[]>('/vehicles'),
  create: (body: Partial<Vehicle>) => post<Vehicle>('/vehicles', body),
  update: (id: string, body: Partial<Vehicle>) => put<Vehicle>(`/vehicles/${id}`, body),
  updateImage: (id: string, url: string) => put<Vehicle>(`/vehicles/${id}/image`, { url }),
  remove: (id: string) => del<Vehicle>(`/vehicles/${id}`),
}

export const servicesApi = {
  list: () => get<ServiceItem[]>('/services'),
  detail: (id: string) => get<ServiceItem>(`/services/${id}`),
  create: (body: Partial<ServiceItem>) => post<ServiceItem>('/services', body),
  update: (id: string, body: Partial<ServiceItem>) => put<ServiceItem>(`/services/${id}`, body),
  remove: (id: string) => del<ServiceItem>(`/services/${id}`),
}

export const productsApi = {
  list: (params?: ApiRecord) => get<ApiList<Product>>('/products', { params }),
  adminList: (params?: ApiRecord) => get<ApiList<Product>>('/products/admin/list', { params }),
  detail: (id: string) => get<Product>(`/products/${id}`),
  create: (body: ApiRecord) => post<Product>('/products', body),
  update: (id: string, body: ApiRecord) => patch<Product>(`/products/${id}`, body),
  remove: (id: string) => del<Product>(`/products/${id}`),
  reviews: (id: string, params?: ApiRecord) => get<ApiRecord>(`/products/${id}/reviews`, { params }),
  createReview: (id: string, body: ApiRecord) => post<ApiRecord>(`/products/${id}/reviews`, body),
  updateReview: (id: string, body: ApiRecord) => patch<ApiRecord>(`/reviews/${id}`, body),
  deleteReview: (id: string) => del<ApiRecord>(`/reviews/${id}`),
  adjustInventory: (id: string, body: ApiRecord) => post<ApiRecord>(`/products/${id}/inventory/adjust`, body),
  inventoryLogs: (id: string, params?: ApiRecord) => get<ApiRecord>(`/products/${id}/inventory/logs`, { params }),
  updateImages: (id: string, images: ApiRecord[]) => patch<Product>(`/products/${id}/images`, { images }),
  addImage: (id: string, body: ApiRecord) => post<ApiRecord>(`/products/${id}/images`, body),
  removeImage: (id: string, imageId: string) => del<ApiRecord>(`/products/${id}/images/${imageId}`),
}

export const categoriesApi = {
  list: () => get<Category[]>('/product-categories'),
  adminList: (params?: ApiRecord) => get<Category[]>('/product-categories/admin/list', { params }),
  create: (body: Partial<Category>) => post<Category>('/product-categories', body),
  update: (id: string, body: Partial<Category>) => patch<Category>(`/product-categories/${id}`, body),
  remove: (id: string) => del<Category>(`/product-categories/${id}`),
}

export const cartApi = {
  get: () => get<Cart>('/cart'),
  add: (body: { productId: string; productVariantId?: string; quantity: number }) => post<Cart>('/cart/items', body),
  update: (id: string, quantity: number) => patch<Cart>(`/cart/items/${id}`, { quantity }),
  remove: (id: string) => del<Cart>(`/cart/items/${id}`),
  clear: () => del<Cart>('/cart/clear'),
}

export const checkoutApi = {
  preview: (body: ApiRecord) => post<ApiRecord>('/checkout/preview', body),
  createOrder: (body: ApiRecord) => post<ApiRecord>('/checkout/create-order', body),
}

export const ordersApi = {
  list: (params?: ApiRecord) => get<ApiList<Order> | Order[]>('/orders', { params }),
  detail: (id: string) => get<Order>(`/orders/${id}`),
  create: (body: ApiRecord) => post<Order>('/orders', body),
  quickCreate: (body: ApiRecord) => post<Order>('/orders/quick-create', body),
  confirm: (id: string) => post<Order>(`/orders/${id}/confirm`),
  activeWarranty: () => get<Order[]>('/orders/active-warranty'),
  pendingWarranty: () => get<Order[]>('/orders/pending-warranty'),
  updateFulfillment: (id: string, body: ApiRecord) => patch<Order>(`/orders/${id}/fulfillment`, body),
}

export const warrantiesApi = {
  list: (status?: string) => get<Warranty[]>('/warranties', { params: { status } }),
  adminList: () => get<Warranty[]>('/warranties/admin'),
  dashboard: () => get<ApiRecord>('/warranties/admin/dashboard'),
  detail: (id: string) => get<Warranty>(`/warranties/${id}`),
  create: (body: ApiRecord) => post<Warranty>('/warranties', body),
  logs: (id: string) => get<WarrantyLog[]>(`/warranties/${id}/logs`),
  addLog: (body: ApiRecord) => post<WarrantyLog>('/warranties/log', body),
  updateLog: (id: string, body: ApiRecord) => patch<WarrantyLog>(`/warranties/log/${id}`, body),
  removeLog: (id: string) => del<WarrantyLog>(`/warranties/log/${id}`),
}

export const paymentsApi = {
  createSession: (body: ApiRecord) => post<Payment>('/payments/create-session', body),
  fakeWebhook: (body: ApiRecord) => post<ApiRecord>('/payments/webhook/fake', body),
  adminList: (params?: ApiRecord) => get<ApiList<Payment>>('/payments/admin/list', { params }),
  adminDetail: (id: string) => get<Payment>(`/payments/admin/${id}`),
  forOrder: (orderId: string) => get<Payment[]>(`/payments/order/${orderId}`),
  detail: (id: string) => get<Payment>(`/payments/${id}`),
}

export const notificationsApi = {
  list: () => get<NotificationItem[]>('/notifications'),
  unreadCount: () => get<number | { count: number }>('/notifications/unread-count'),
  markRead: (id: string) => patch<NotificationItem>(`/notifications/${id}/read`),
  testPush: (body: ApiRecord) => post<ApiRecord>('/notifications/admin/test-push', body),
}

export const chatApi = {
  myRoom: () => get<ChatRoom>('/chat/room'),
  users: (page = 1) => get<ApiRecord>('/chat/users', { params: { page } }),
  roomByUser: (userId: string) => get<ChatRoom>(`/chat/room/${userId}`),
  messages: (roomId: string) => get<ChatMessage[]>(`/chat/messages/${roomId}`),
  send: (body: { roomId: string; content: string }) => post<ChatMessage>('/chat/message', body),
}

export const qrApi = {
  user: () => post<ApiRecord>('/qr/user'),
  scan: (token: string) => get<ApiRecord>(`/qr/scan/${encodeURIComponent(token)}`),
  warranty: (id: string) => get<ApiRecord>(`/qr/warranty/${id}`),
}

export const newsApi = {
  publicList: () => get<NewsItem[]>('/news'),
  adminList: () => get<NewsItem[]>('/news/admin'),
  detail: (id: string) => get<NewsItem>(`/news/${id}`),
  create: (body: Partial<NewsItem>) => post<NewsItem>('/news', body),
  update: (id: string, body: Partial<NewsItem>) => put<NewsItem>(`/news/${id}`, body),
  publish: (id: string, isPublished: boolean) => patch<NewsItem>(`/news/${id}/publish`, { isPublished }),
  remove: (id: string) => del<NewsItem>(`/news/${id}`),
}

export const membershipApi = {
  me: () => get<ApiRecord>('/membership/me'),
  tiers: () => get<MembershipTier[]>('/membership/tiers'),
  createTier: (body: Partial<MembershipTier>) => post<MembershipTier>('/membership/tiers', body),
  updateTier: (id: string, body: Partial<MembershipTier>) => patch<MembershipTier>(`/membership/tiers/${id}`, body),
  removeTier: (id: string) => del<MembershipTier>(`/membership/tiers/${id}`),
}

export const rewardsApi = {
  list: () => get<Reward[] | ApiList<Reward> | { items?: Reward[]; result?: Reward[] }>('/rewards'),
  tasks: () => get<ApiRecord[] | { points?: number; tasks?: ApiRecord[]; data?: ApiRecord[]; items?: ApiRecord[] }>('/rewards/tasks'),
  completeTask: (taskKey: string) => post<ApiRecord>(`/rewards/tasks/${taskKey}/complete`),
  history: (params?: ApiRecord) => get<ApiRecord>('/rewards/history', { params }),
  redeem: (id: string) => post<ApiRecord>(`/rewards/${id}/redeem`),
  myRedemptions: () => get<ApiRecord[] | ApiList<ApiRecord> | { items?: ApiRecord[]; result?: ApiRecord[] }>('/rewards/redemptions/me'),
  redemptionQr: (id: string) => get<ApiRecord>(`/rewards/redemptions/${id}/qr`),
  adminList: (params?: ApiRecord) => get<ApiList<Reward>>('/rewards/admin/list', { params }),
  create: (body: Partial<Reward>) => post<Reward>('/rewards', body),
  update: (id: string, body: Partial<Reward>) => patch<Reward>(`/rewards/${id}`, body),
  remove: (id: string) => del<Reward>(`/rewards/${id}`),
  scanRedemption: (token: string) => post<ApiRecord>('/rewards/admin/redemptions/scan', { token }),
  confirmRedemption: (id: string) => post<ApiRecord>(`/rewards/admin/redemptions/${id}/confirm`),
  cancelRedemption: (id: string) => post<ApiRecord>(`/rewards/admin/redemptions/${id}/cancel`),
  adminRedemptions: (params?: ApiRecord) => get<ApiRecord>('/rewards/admin/redemptions', { params }),
}

export const couponsApi = {
  mine: () => get<Coupon[] | ApiList<Coupon> | { items?: Coupon[]; result?: Coupon[] }>('/coupons/me'),
  validate: (body: ApiRecord) => post<ApiRecord>('/coupons/validate', body),
  apply: (body: ApiRecord) => post<ApiRecord>('/coupons/apply', body),
  adminList: (params?: ApiRecord) => get<ApiList<Coupon>>('/coupons/admin/list', { params }),
  create: (body: Partial<Coupon>) => post<Coupon>('/coupons', body),
  update: (id: string, body: Partial<Coupon>) => patch<Coupon>(`/coupons/${id}`, body),
  remove: (id: string) => del<Coupon>(`/coupons/${id}`),
  usages: (params?: ApiRecord) => get<ApiRecord>('/coupons/admin/usages', { params }),
}

export const pointsApi = {
  history: (params?: ApiRecord) => get<ApiRecord>('/points/history', { params }),
  adminSummary: () => get<ApiRecord>('/points/admin/summary'),
  adminUserHistory: (userId: string, params?: ApiRecord) =>
    get<ApiRecord>(`/points/admin/users/${userId}/history`, { params }),
}

export const youtubeApi = {
  latest: () => rawClient.get('/youtube/latest').then((response) => response.data as unknown),
  popular: () => rawClient.get('/youtube/popular').then((response) => response.data as unknown),
  playlists: () => rawClient.get('/youtube/playlists').then((response) => response.data as unknown),
}

export const createRealtimeSocket = (): Socket => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL ?? apiBaseUrl
  return io(socketUrl, {
    autoConnect: false,
    auth: {
      token: getAccessToken(),
    },
  })
}
