import type { CartItem, Coupon } from '@/types/backend'

export type CouponAvailability = {
  canUse: boolean
  label: '可使用' | '不可使用' | '已過期' | '已使用'
  reason?: string
}

export const getCouponAvailability = (coupon: Coupon, subtotal = 0, _items: CartItem[] = []): CouponAvailability => {
  if (coupon.isActive === false) return { canUse: false, label: '不可使用', reason: '不符合使用資格' }
  if (isExpired(coupon.expiresAt)) return { canUse: false, label: '已過期', reason: '已過期' }
  const minSpend = Number(coupon.minimumSpend ?? 0)
  if (minSpend > 0 && subtotal < minSpend) return { canUse: false, label: '不可使用', reason: '未達低消' }
  return { canUse: true, label: '可使用', reason: '可使用' }
}

const isExpired = (value?: string | null): boolean => {
  if (!value) return false
  const time = new Date(value).getTime()
  return Number.isFinite(time) && time < Date.now()
}
