import type { ApiRecord, CartItem, Coupon, MembershipTier, Reward, RewardTask, RewardRedemption } from '@/types/backend'
import { money } from './format'
import { statusLabel } from './status'

export const unwrapList = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[]
  if (!payload || typeof payload !== 'object') return []
  const record = payload as Record<string, unknown>
  const candidates = [record.data, record.items, record.result, record.results, record.records, record.coupons, record.rewards, record.redemptions]
  const found = candidates.find(Array.isArray)
  return found ? (found as T[]) : []
}

export const toNumber = (value: unknown, fallback = 0): number => {
  const number = Number(value ?? fallback)
  return Number.isFinite(number) ? number : fallback
}

export const normalizeReward = (value: unknown): Reward => {
  const source = (value ?? {}) as Partial<Reward> & ApiRecord
  return {
    ...source,
    id: String(source.id ?? ''),
    name: String(source.name ?? '會員獎勵'),
    description: typeof source.description === 'string' ? source.description : null,
    type: (source.type as Reward['type']) ?? 'DISCOUNT',
    pointsCost: toNumber(source.pointsCost ?? source.pointCost),
    discountAmount: source.discountAmount ?? null,
    discountPercent: source.discountPercent ?? null,
    productId: typeof source.productId === 'string' ? source.productId : null,
    stock: source.stock === null || source.stock === undefined ? null : toNumber(source.stock),
    imageUrl: typeof source.imageUrl === 'string' ? source.imageUrl : undefined,
    isActive: source.isActive !== false,
    startsAt: typeof source.startsAt === 'string' ? source.startsAt : typeof source.startDate === 'string' ? source.startDate : null,
    expiresAt: typeof source.expiresAt === 'string' ? source.expiresAt : typeof source.endDate === 'string' ? source.endDate : null,
  }
}

export const normalizeCoupon = (value: unknown): Coupon => {
  const source = (value ?? {}) as Partial<Coupon> & ApiRecord
  return {
    ...source,
    id: String(source.id ?? source.code ?? ''),
    code: String(source.code ?? ''),
    name: String(source.name ?? source.code ?? '優惠券'),
    description: typeof source.description === 'string' ? source.description : null,
    type: (source.type as Coupon['type']) ?? 'FIXED_AMOUNT',
    value: source.value ?? source.discountValue ?? 0,
    minimumSpend: source.minimumSpend ?? source.minSpend ?? null,
    maxDiscount: source.maxDiscount ?? null,
    usageLimit: source.usageLimit ?? null,
    perUserLimit: source.perUserLimit ?? null,
    usedCount: toNumber(source.usedCount),
    perUserUsedCount: toNumber(source.perUserUsedCount),
    membershipTierId: typeof source.membershipTierId === 'string' ? source.membershipTierId : null,
    membershipTier: source.membershipTier ?? null,
    assignments: source.assignments ?? [],
    usageCondition: source.usageCondition ?? null,
    applicability: source.applicability ?? null,
    applicabilityLabel: source.applicabilityLabel ?? source.applicability?.label ?? null,
    claimStatus: source.claimStatus,
    applyStatus: source.applyStatus,
    canUse: source.canUse,
    invalidReason: source.invalidReason ?? null,
    claimedAt: source.claimedAt ?? null,
    usedAt: source.usedAt ?? null,
    isActive: source.isActive !== false,
    startsAt: typeof source.startsAt === 'string' ? source.startsAt : typeof source.startDate === 'string' ? source.startDate : null,
    expiresAt: typeof source.expiresAt === 'string' ? source.expiresAt : typeof source.endDate === 'string' ? source.endDate : null,
  }
}

export const normalizeTasks = (payload: unknown): { points: number; tasks: RewardTask[] } => {
  const source = payload && typeof payload === 'object' ? payload as ApiRecord : {}
  const tasks = unwrapList<ApiRecord>(Array.isArray(payload) ? payload : source.tasks)
  return {
    points: toNumber(source.points),
    tasks: tasks.map((task) => ({
      key: String(task.key ?? ''),
      title: String(task.title ?? task.key ?? '會員任務'),
      group: String(task.group ?? 'ONE_TIME'),
      points: toNumber(task.points),
      frequency: typeof task.frequency === 'string' ? task.frequency : undefined,
      completed: Boolean(task.completed),
      progress: toNumber(task.progress, task.completed ? 1 : 0),
      target: toNumber(task.target, 1),
      earnedPoints: toNumber(task.earnedPoints),
    })),
  }
}

export const normalizeRedemption = (value: unknown): RewardRedemption => {
  const source = (value ?? {}) as Partial<RewardRedemption> & ApiRecord
  return {
    ...source,
    id: String(source.id ?? source.redemptionId ?? ''),
    redemptionId: typeof source.redemptionId === 'string' ? source.redemptionId : undefined,
    status: source.status ?? 'PENDING',
    pointsSpent: toNumber(source.pointsSpent ?? source.pointsDeducted),
    reward: source.reward ? normalizeReward(source.reward) : undefined,
  }
}

export const normalizeMembership = (payload: unknown, tiers: MembershipTier[] = []): ApiRecord => {
  const source = payload && typeof payload === 'object' ? payload as ApiRecord : {}
  const tier = (source.tier ?? source.membershipTier ?? source.currentTier ?? null) as MembershipTier | null
  const nextTier = (source.nextTier ?? null) as MembershipTier | null
  const lifetimeSpending = toNumber(source.lifetimeSpending)
  const progress = toNumber(source.progress)
  const computedProgress = nextTier ? Math.min(100, Math.round((lifetimeSpending / Math.max(toNumber(nextTier.thresholdAmount), 1)) * 100)) : progress

  return {
    ...source,
    currentPoints: toNumber(source.currentPoints ?? source.points ?? source.pointBalance),
    lifetimeSpending,
    tier,
    membershipTier: tier,
    nextTier,
    tiers: unwrapList<MembershipTier>(source.tiers).length ? unwrapList<MembershipTier>(source.tiers) : tiers,
    progress: progress || computedProgress,
    remainingSpending: toNumber(source.remainingSpending ?? source.remainingAmount ?? source.amountToNext),
  }
}

export const couponDiscountText = (coupon: Coupon): string => {
  if (coupon.type === 'PERCENTAGE') return `${toNumber(coupon.value)}% 折扣`
  return `折抵 ${money(coupon.value)}`
}

export const rewardBenefitText = (reward: Reward): string => {
  if (reward.type === 'DISCOUNT') {
    if (reward.discountPercent) return `${toNumber(reward.discountPercent)}% 折扣`
    if (reward.discountAmount) return `折抵 ${money(reward.discountAmount)}`
  }
  if (reward.type === 'PRODUCT') return reward.product?.name ? `兌換商品：${reward.product.name}` : '商品兌換'
  return statusLabel(reward.type)
}

export type CouponAvailability = {
  canUse: boolean
  label: string
  reason: string
  tone: 'available' | 'used' | 'expired' | 'disabled'
}

export const couponAvailability = (coupon: Coupon, subtotal = 0, _items: CartItem[] = []): CouponAvailability => {
  const now = Date.now()
  const expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt).getTime() : null
  const startsAt = coupon.startsAt ? new Date(coupon.startsAt).getTime() : null
  const minimumSpend = toNumber(coupon.minimumSpend)

  if (coupon.usedAt || coupon.applyStatus === 'USED' || coupon.invalidReason === '已使用') {
    return { canUse: false, label: '已使用', reason: '此優惠券已使用', tone: 'used' }
  }
  if (expiresAt && expiresAt < now) return { canUse: false, label: '已過期', reason: '已超過使用期限', tone: 'expired' }
  if (startsAt && startsAt > now) return { canUse: false, label: '尚未開始', reason: '尚未到可使用時間', tone: 'disabled' }
  if (coupon.isActive === false || coupon.canUse === false) {
    return { canUse: false, label: '不可使用', reason: coupon.invalidReason ?? '不符合使用資格', tone: 'disabled' }
  }
  if (minimumSpend > 0 && subtotal > 0 && subtotal < minimumSpend) {
    return { canUse: false, label: '未達低消', reason: `需滿 ${money(minimumSpend)} 才可使用`, tone: 'disabled' }
  }
  return { canUse: true, label: '可使用', reason: coupon.usageCondition ?? coupon.applicabilityLabel ?? '結帳時由後端再次驗證', tone: 'available' }
}
