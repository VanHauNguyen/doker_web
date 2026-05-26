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
  const assignments = Array.isArray(source.assignments) ? source.assignments : []
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
    assignments,
    assignedUserIds: Array.isArray(source.assignedUserIds)
      ? source.assignedUserIds.filter((id): id is string => typeof id === 'string')
      : assignments.map((item) => item.userId).filter(Boolean),
    assignmentExpiresAt: typeof source.assignmentExpiresAt === 'string' ? source.assignmentExpiresAt : null,
    usageCondition: source.usageCondition ?? null,
    applicability: source.applicability ?? null,
    applicabilityLabel: source.applicabilityLabel ?? source.applicability?.label ?? null,
    claimStatus: source.claimStatus,
    applyStatus: source.applyStatus,
    canUse: source.canUse,
    invalidReason: source.invalidReason ?? null,
    metadata: source.metadata ?? null,
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
  const normalizedTiers = (unwrapList<MembershipTier>(source.tiers).length ? unwrapList<MembershipTier>(source.tiers) : tiers)
    .slice()
    .sort((a, b) => toNumber(a.sortOrder) - toNumber(b.sortOrder))
  const lifetimeSpending = toNumber(source.lifetimeSpending)
  const rawProgress = toNumber(source.progress)
  const progressFromBackend = rawProgress > 0 && rawProgress <= 1 ? rawProgress * 100 : rawProgress
  const currentThreshold = toNumber(tier?.thresholdAmount)
  const nextThreshold = toNumber(nextTier?.thresholdAmount)
  const computedProgress = nextTier && nextThreshold > currentThreshold
    ? ((lifetimeSpending - currentThreshold) / Math.max(nextThreshold - currentThreshold, 1)) * 100
    : progressFromBackend

  return {
    ...source,
    currentPoints: toNumber(source.currentPoints ?? source.points ?? source.pointBalance),
    lifetimeSpending,
    tier,
    membershipTier: tier,
    nextTier,
    tiers: normalizedTiers,
    progress: Math.min(100, Math.max(0, Math.round(progressFromBackend || computedProgress || 0))),
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

export type BenefitRow = {
  key: string
  label: string
  value: string
  active: boolean
}

const benefitLabelMap: Record<string, string> = {
  pointMultiplier: '點數倍率',
  birthdayCoupon: '生日禮券',
  freeShippingCoupons: '免運券',
  exclusiveDiscountPercent: '專屬折扣',
  priorityInstallation: '優先安裝',
  earlyAccessCampaign: '新品優先體驗',
  riderBadge: '騎士徽章',
}

const benefitValue = (key: string, value: unknown): string => {
  if (typeof value === 'boolean') return value ? '已啟用' : '未啟用'
  if (typeof value === 'number') {
    if (key === 'exclusiveDiscountPercent') return `${value}%`
    if (key === 'pointMultiplier') return `${value}x`
    return String(value)
  }
  if (typeof value === 'string') return value
  return value === null || value === undefined ? '未設定' : '已設定'
}

export const tierBenefitRows = (tier?: MembershipTier | null): BenefitRow[] => {
  const benefits = tier?.benefits
  if (!benefits || typeof benefits !== 'object') return []
  return Object.entries(benefits).map(([key, value]) => ({
    key,
    label: benefitLabelMap[key] ?? key,
    value: benefitValue(key, value),
    active: Boolean(value),
  }))
}

export const tierLevelText = (tier: MembershipTier, fallbackIndex = 0): string => {
  const level = toNumber(tier.sortOrder, fallbackIndex) + 1
  return `Level ${level}`
}

export const rewardCategoryLabel = (reward: Reward): string => {
  if (reward.type === 'DISCOUNT') return '折扣券'
  if (reward.type === 'PRODUCT') return '商品兌換'
  if (reward.type === 'FREE_SERVICE') return '免費服務'
  return '檢查服務'
}

export const rewardUnavailableReason = (reward: Reward, currentPoints = 0): string | null => {
  const now = Date.now()
  const startsAt = reward.startsAt ? new Date(reward.startsAt).getTime() : null
  const expiresAt = reward.expiresAt ? new Date(reward.expiresAt).getTime() : null
  if (reward.isActive === false) return '獎勵已停用'
  if (startsAt && startsAt > now) return '尚未開放兌換'
  if (expiresAt && expiresAt < now) return '兌換期限已過'
  if (reward.stock !== null && reward.stock !== undefined && toNumber(reward.stock) <= 0) return '庫存已兌換完畢'
  if (currentPoints < toNumber(reward.pointsCost)) return '點數不足'
  return null
}

export const couponScopeText = (coupon: Coupon): string => {
  if (coupon.applicabilityLabel) return coupon.applicabilityLabel
  const scope = coupon.applicability?.scope
  if (scope === 'PRODUCT') return '指定商品'
  if (scope === 'CATEGORY') return '指定分類'
  if (scope === 'KEYWORD') return '指定關鍵字商品'
  return '全館適用'
}

export const couponPeriodText = (coupon: Coupon): string => {
  if (coupon.startsAt && coupon.expiresAt) return `${new Date(coupon.startsAt).toLocaleDateString('zh-TW')} - ${new Date(coupon.expiresAt).toLocaleDateString('zh-TW')}`
  if (coupon.expiresAt) return `到期 ${new Date(coupon.expiresAt).toLocaleDateString('zh-TW')}`
  if (coupon.startsAt) return `開始 ${new Date(coupon.startsAt).toLocaleDateString('zh-TW')}`
  return '無期限'
}

export const couponAudienceText = (coupon: Coupon): string => {
  if (coupon.assignments?.length || coupon.assignedUserIds?.length) return '指定會員'
  if (coupon.membershipTier?.name) return `${coupon.membershipTier.name} 以上`
  if (coupon.membershipTierId) return '指定等級會員'
  return '所有會員'
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
  if (coupon.claimStatus === 'UNCLAIMED') {
    return { canUse: false, label: '未領取', reason: '請先領取後再使用', tone: 'disabled' }
  }
  if (expiresAt && expiresAt < now) return { canUse: false, label: '已過期', reason: '已超過使用期限', tone: 'expired' }
  if (startsAt && startsAt > now) return { canUse: false, label: '尚未開始', reason: '尚未到可使用時間', tone: 'disabled' }
  if (coupon.usageLimit && toNumber(coupon.usedCount) >= coupon.usageLimit) {
    return { canUse: false, label: '已額滿', reason: '總使用次數已達上限', tone: 'disabled' }
  }
  if (coupon.perUserLimit && toNumber(coupon.perUserUsedCount) >= coupon.perUserLimit) {
    return { canUse: false, label: '達上限', reason: `每人限用 ${coupon.perUserLimit} 次`, tone: 'used' }
  }
  if (coupon.isActive === false || coupon.canUse === false) {
    return { canUse: false, label: '不可使用', reason: coupon.invalidReason ?? '不符合使用資格', tone: 'disabled' }
  }
  if (minimumSpend > 0 && subtotal > 0 && subtotal < minimumSpend) {
    return { canUse: false, label: '未達低消', reason: `需滿 ${money(minimumSpend)} 才可使用`, tone: 'disabled' }
  }
  return { canUse: true, label: '可使用', reason: coupon.usageCondition ?? couponScopeText(coupon), tone: 'available' }
}
