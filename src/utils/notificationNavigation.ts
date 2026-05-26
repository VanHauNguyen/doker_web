import type { Component } from 'vue'
import {
  Bell,
  Car,
  Gift,
  MessageCircle,
  Newspaper,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Ticket,
  WalletCards,
} from 'lucide-vue-next'
import type { NotificationItem } from '@/types/backend'

export type NotificationRouteTarget = {
  path: string
  label: string
  reason: string
}

export type NotificationMeta = {
  icon: Component
  label: string
  tone: 'gold' | 'blue' | 'green' | 'rose' | 'slate'
}

const normalizeType = (type?: string | null): string => String(type ?? '').trim().toUpperCase()

const dataRecord = (item: NotificationItem): Record<string, unknown> =>
  item.data && typeof item.data === 'object' ? item.data : {}

const textValue = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

export const notificationRouteTarget = (item: NotificationItem, isAdmin = false): NotificationRouteTarget => {
  const type = normalizeType(item.type)
  const data = dataRecord(item)
  const screen = textValue(data.screen, data.route)?.toLowerCase() ?? ''
  const entityType = textValue(data.entityType)?.toLowerCase() ?? ''
  const orderId = textValue(item.order?.id, data.orderId, data.paymentId && item.order?.id)
  const warrantyId = textValue(item.warranty?.id, data.warrantyId)
  const rewardId = textValue(data.rewardId, data.rewardRedemptionId)
  const couponId = textValue(data.couponId)
  const roomId = textValue(data.roomId)
  const newsId = textValue(data.newsId, data.articleId, data.contentId)
  const vehicleId = textValue(data.vehicleId)

  if (orderId && (type.startsWith('ORDER') || type.startsWith('PAYMENT') || screen === 'orderdetail' || entityType === 'order' || entityType === 'payment')) {
    return { path: `/orders/${orderId}`, label: '查看訂單', reason: '訂單通知' }
  }
  if (warrantyId && (type.startsWith('WARRANTY') || screen === 'warrantydetail' || entityType === 'warranty')) {
    return { path: `/warranties/${warrantyId}`, label: '查看保固', reason: '保固通知' }
  }
  if (type === 'CHAT_MESSAGE' || screen === 'chat_room' || entityType === 'chat' || roomId) {
    return { path: '/chat', label: '開啟客服', reason: '客服訊息' }
  }
  if (type.startsWith('REWARD') || rewardId) {
    return { path: isAdmin ? '/admin/engagement' : '/membership', label: isAdmin ? '管理獎勵' : '查看獎勵', reason: '獎勵通知' }
  }
  if (type.startsWith('COUPON') || couponId) {
    return orderId
      ? { path: `/orders/${orderId}`, label: '查看訂單', reason: '優惠券已用於訂單' }
      : { path: isAdmin ? '/admin/engagement' : '/membership', label: isAdmin ? '管理優惠券' : '查看優惠券', reason: '優惠券通知' }
  }
  if (type.startsWith('MEMBERSHIP') || type.startsWith('POINTS')) {
    return { path: isAdmin ? '/admin/engagement' : '/membership', label: '查看會員中心', reason: '會員通知' }
  }
  if (type.startsWith('VEHICLE') || entityType === 'vehicle' || vehicleId) {
    return { path: '/vehicles', label: '查看愛車', reason: '車輛通知' }
  }
  if (type === 'NEWS' || newsId) {
    return { path: newsId ? `/news?id=${encodeURIComponent(newsId)}` : '/news', label: '查看消息', reason: '內容通知' }
  }
  if (type.includes('QR') || screen === 'qr') {
    return { path: warrantyId ? `/warranties/${warrantyId}` : '/qr', label: '查看 QR', reason: 'QR 通知' }
  }
  if (type === 'USER_REGISTERED' && isAdmin) {
    return { path: '/admin/customers', label: '查看會員', reason: '會員註冊' }
  }
  return { path: '/notifications', label: '留在通知中心', reason: '系統通知' }
}

export const notificationMeta = (item: NotificationItem): NotificationMeta => {
  const type = normalizeType(item.type)
  if (type.startsWith('ORDER')) return { icon: ReceiptText, label: '訂單', tone: 'gold' }
  if (type.startsWith('PAYMENT')) return { icon: WalletCards, label: '付款', tone: 'blue' }
  if (type.startsWith('WARRANTY')) return { icon: ShieldCheck, label: '保固', tone: 'green' }
  if (type.startsWith('REWARD')) return { icon: Gift, label: '獎勵', tone: 'gold' }
  if (type.startsWith('COUPON')) return { icon: Ticket, label: '優惠券', tone: 'rose' }
  if (type.startsWith('MEMBERSHIP') || type.startsWith('POINTS')) return { icon: Sparkles, label: '會員', tone: 'blue' }
  if (type.startsWith('VEHICLE')) return { icon: Car, label: '愛車', tone: 'slate' }
  if (type === 'CHAT_MESSAGE') return { icon: MessageCircle, label: '客服', tone: 'green' }
  if (type === 'NEWS') return { icon: Newspaper, label: '消息', tone: 'blue' }
  if (type.includes('QR')) return { icon: QrCode, label: 'QR', tone: 'gold' }
  return { icon: Bell, label: '系統', tone: 'slate' }
}

export const notificationGroupLabel = (item: NotificationItem): string => {
  const type = normalizeType(item.type)
  if (!item.isRead) return '未讀通知'
  if (type.startsWith('ORDER') || type.startsWith('PAYMENT')) return '訂單與付款'
  if (type.startsWith('WARRANTY')) return '保固'
  if (type.startsWith('REWARD') || type.startsWith('COUPON') || type.startsWith('MEMBERSHIP') || type.startsWith('POINTS')) return '會員經營'
  if (type === 'CHAT_MESSAGE') return '客服'
  return '其他通知'
}
