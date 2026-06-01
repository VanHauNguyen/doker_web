<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { couponsApi, membershipApi, rewardsApi } from '@/api'
import PremiumHero from '@/components/PremiumHero.vue'
import AdminDetailDrawer from '@/components/admin/AdminDetailDrawer.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import { dateTime, money } from '@/utils/format'
import { statusLabel } from '@/utils/status'
import {
  couponAudienceText,
  couponDiscountText,
  couponPeriodText,
  couponScopeText,
  normalizeCoupon,
  normalizeReward,
  tierBenefitRows,
  unwrapList,
} from '@/utils/membershipRewards'
import type { ApiRecord, Coupon, CouponType, MembershipTier, Reward, RewardType } from '@/types/backend'

const rewards = ref<Reward[]>([])
const coupons = ref<Coupon[]>([])
const tiers = ref<MembershipTier[]>([])
const redemptions = ref<ApiRecord[]>([])
const usages = ref<ApiRecord[]>([])
const rewardName = ref('')
const rewardType = ref<RewardType>('INSPECTION')
const rewardPoints = ref(100)
const rewardDescription = ref('')
const rewardDiscountAmount = ref<number | null>(null)
const rewardDiscountPercent = ref<number | null>(null)
const rewardStock = ref<number | null>(null)
const rewardStartsAt = ref('')
const rewardExpiresAt = ref('')
const couponCode = ref('')
const couponName = ref('')
const couponType = ref<CouponType>('FIXED_AMOUNT')
const couponValue = ref(100)
const couponMinimumSpend = ref<number | null>(null)
const couponUsageLimit = ref<number | null>(null)
const couponPerUserLimit = ref<number | null>(null)
const couponMembershipTierId = ref('')
const couponAssignedUserIds = ref('')
const couponStartsAt = ref('')
const couponExpiresAt = ref('')
const couponAssignmentExpiresAt = ref('')
const tierName = ref('')
const tierThreshold = ref(0)
const tierDescription = ref('')
const tierPointEarnRate = ref(1)
const tierSortOrder = ref(0)
const tierBenefitsJson = ref('{\n  "pointMultiplier": 1,\n  "birthdayCoupon": false,\n  "freeShippingCoupons": 0,\n  "priorityInstallation": false\n}')
const selectedReward = ref<Reward | null>(null)
const selectedCoupon = ref<Coupon | null>(null)
const selectedTier = ref<MembershipTier | null>(null)
const selectedTierBenefitsJson = ref('')
const scanToken = ref('')
const scanResult = ref<ApiRecord | null>(null)
const deleteTarget = ref<{ type: 'reward' | 'coupon' | 'tier'; id: string } | null>(null)

const load = async (): Promise<void> => {
  const [rewardPayload, couponPayload, tierPayload] = await Promise.all([
    rewardsApi.adminList({ limit: 100 }),
    couponsApi.adminList({ limit: 100 }),
    membershipApi.tiers(),
  ])
  rewards.value = unwrapList<Reward>(rewardPayload).map(normalizeReward)
  coupons.value = unwrapList<Coupon>(couponPayload).map(normalizeCoupon)
  tiers.value = tierPayload
  const [redemptionPayload, usagePayload] = await Promise.all([
    rewardsApi.adminRedemptions({ limit: 20 }),
    couponsApi.usages({ limit: 20 }),
  ])
  redemptions.value = unwrapList<ApiRecord>(redemptionPayload)
  usages.value = unwrapList<ApiRecord>(usagePayload)
}

const toIsoOrUndefined = (value: string): string | undefined => value ? new Date(value).toISOString() : undefined
const optionalNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}
const parseAssignedUserIds = (value: string): string[] | undefined => {
  const ids = value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean)
  return ids.length ? ids : undefined
}
const parseBenefits = (value: string): Record<string, unknown> | undefined => {
  try {
    const parsed = JSON.parse(value) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : undefined
  } catch {
    return undefined
  }
}

const createReward = async (): Promise<void> => {
  await rewardsApi.create({
    name: rewardName.value,
    description: rewardDescription.value || undefined,
    type: rewardType.value,
    pointsCost: rewardPoints.value,
    discountAmount: optionalNumber(rewardDiscountAmount.value),
    discountPercent: optionalNumber(rewardDiscountPercent.value),
    stock: optionalNumber(rewardStock.value),
    startsAt: toIsoOrUndefined(rewardStartsAt.value),
    expiresAt: toIsoOrUndefined(rewardExpiresAt.value),
    isActive: true,
  })
  rewardName.value = ''
  rewardDescription.value = ''
  await load()
}

const createCoupon = async (): Promise<void> => {
  await couponsApi.create({
    code: couponCode.value,
    name: couponName.value || couponCode.value,
    type: couponType.value,
    value: couponValue.value,
    minimumSpend: optionalNumber(couponMinimumSpend.value),
    usageLimit: optionalNumber(couponUsageLimit.value),
    perUserLimit: optionalNumber(couponPerUserLimit.value),
    membershipTierId: couponMembershipTierId.value || undefined,
    assignedUserIds: parseAssignedUserIds(couponAssignedUserIds.value),
    assignmentExpiresAt: toIsoOrUndefined(couponAssignmentExpiresAt.value),
    startsAt: toIsoOrUndefined(couponStartsAt.value),
    expiresAt: toIsoOrUndefined(couponExpiresAt.value),
    isActive: true,
  })
  couponCode.value = ''
  couponName.value = ''
  await load()
}

const createTier = async (): Promise<void> => {
  await membershipApi.createTier({
    name: tierName.value,
    description: tierDescription.value || undefined,
    thresholdAmount: tierThreshold.value,
    pointEarnRate: tierPointEarnRate.value,
    sortOrder: tierSortOrder.value || tiers.value.length,
    benefits: parseBenefits(tierBenefitsJson.value),
    isActive: true,
  })
  tierName.value = ''
  tierDescription.value = ''
  await load()
}

const saveReward = async (): Promise<void> => {
  if (!selectedReward.value) return
  await rewardsApi.update(selectedReward.value.id, selectedReward.value)
  selectedReward.value = null
  await load()
}

const saveCoupon = async (): Promise<void> => {
  if (!selectedCoupon.value) return
  await couponsApi.update(selectedCoupon.value.id, selectedCoupon.value)
  selectedCoupon.value = null
  await load()
}

const saveTier = async (): Promise<void> => {
  if (!selectedTier.value) return
  await membershipApi.updateTier(selectedTier.value.id, {
    ...selectedTier.value,
    benefits: parseBenefits(selectedTierBenefitsJson.value) ?? selectedTier.value.benefits,
  })
  selectedTier.value = null
  await load()
}

const openTierEditor = (tier: MembershipTier): void => {
  selectedTier.value = { ...tier }
  selectedTierBenefitsJson.value = JSON.stringify(tier.benefits ?? {}, null, 2)
}

const scanRedemption = async (): Promise<void> => {
  let token = scanToken.value.trim()
  try {
    const parsed = JSON.parse(token) as { type?: string; token?: string }
    if (parsed.type === 'REWARD_REDEMPTION' && parsed.token) token = parsed.token
  } catch {
    token = scanToken.value.trim()
  }
  scanResult.value = await rewardsApi.scanRedemption(token)
}

const confirmRedemption = async (id: string): Promise<void> => {
  await rewardsApi.confirmRedemption(id)
  await load()
}

const cancelRedemption = async (id: string): Promise<void> => {
  await rewardsApi.cancelRedemption(id)
  await load()
}

const nestedName = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') return null
  const name = (value as { name?: unknown }).name
  return typeof name === 'string' ? name : null
}

const displayValue = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return '-'
}

const removeTarget = async (): Promise<void> => {
  if (!deleteTarget.value) return
  if (deleteTarget.value.type === 'reward') await rewardsApi.remove(deleteTarget.value.id)
  if (deleteTarget.value.type === 'coupon') await couponsApi.remove(deleteTarget.value.id)
  if (deleteTarget.value.type === 'tier') await membershipApi.removeTier(deleteTarget.value.id)
  deleteTarget.value = null
  await load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <PremiumHero eyebrow="會員經營" title="管理獎勵、優惠券、會員等級、核銷與點數系統。" description="透過後端管理端點維護會員機制，並檢視兌換與優惠券使用紀錄。" />
    <div class="grid gap-6 xl:grid-cols-3">
      <form class="surface space-y-3 rounded-lg p-4" @submit.prevent="createReward">
        <h2 class="font-bold text-white">建立獎勵</h2>
        <input v-model="rewardName" class="field" placeholder="名稱" required />
        <textarea v-model="rewardDescription" class="field min-h-20" placeholder="獎勵說明" />
        <select v-model="rewardType" class="field">
          <option value="INSPECTION">檢查服務</option>
          <option value="DISCOUNT">折扣</option>
          <option value="FREE_SERVICE">免費服務</option>
          <option value="PRODUCT">商品</option>
        </select>
        <input v-model.number="rewardPoints" class="field" type="number" min="1" />
        <div class="grid gap-3 sm:grid-cols-2">
          <input v-model.number="rewardDiscountAmount" class="field" type="number" min="0" placeholder="折抵金額" />
          <input v-model.number="rewardDiscountPercent" class="field" type="number" min="0" placeholder="折扣百分比" />
          <input v-model.number="rewardStock" class="field" type="number" min="0" placeholder="庫存，不填為不限" />
          <input v-model="rewardStartsAt" class="field" type="datetime-local" />
          <input v-model="rewardExpiresAt" class="field sm:col-span-2" type="datetime-local" />
        </div>
        <button class="btn-primary">建立</button>
      </form>
      <form class="surface space-y-3 rounded-lg p-4" @submit.prevent="createCoupon">
        <h2 class="font-bold text-white">建立優惠券</h2>
        <input v-model="couponCode" class="field" placeholder="代碼" required />
        <input v-model="couponName" class="field" placeholder="名稱，不填同代碼" />
        <select v-model="couponType" class="field">
          <option value="FIXED_AMOUNT">固定金額</option>
          <option value="PERCENTAGE">百分比折扣</option>
        </select>
        <input v-model.number="couponValue" class="field" type="number" min="0" />
        <div class="grid gap-3 sm:grid-cols-2">
          <input v-model.number="couponMinimumSpend" class="field" type="number" min="0" placeholder="最低消費" />
          <input v-model.number="couponUsageLimit" class="field" type="number" min="1" placeholder="總使用上限" />
          <input v-model.number="couponPerUserLimit" class="field" type="number" min="1" placeholder="每人上限" />
          <select v-model="couponMembershipTierId" class="field">
            <option value="">不限會員等級</option>
            <option v-for="tier in tiers" :key="tier.id" :value="tier.id">{{ tier.name }}</option>
          </select>
          <input v-model="couponStartsAt" class="field" type="datetime-local" />
          <input v-model="couponExpiresAt" class="field" type="datetime-local" />
        </div>
        <textarea v-model="couponAssignedUserIds" class="field min-h-20" placeholder="指定會員 ID，可用逗號或換行分隔；空白代表公開優惠券" />
        <input v-model="couponAssignmentExpiresAt" class="field" type="datetime-local" />
        <button class="btn-primary">建立</button>
      </form>
      <form class="surface space-y-3 rounded-lg p-4" @submit.prevent="createTier">
        <h2 class="font-bold text-white">建立會員等級</h2>
        <input v-model="tierName" class="field" placeholder="名稱" required />
        <textarea v-model="tierDescription" class="field min-h-20" placeholder="等級說明" />
        <input v-model.number="tierThreshold" class="field" type="number" min="0" />
        <input v-model.number="tierPointEarnRate" class="field" type="number" min="0" step="0.1" placeholder="點數倍率" />
        <input v-model.number="tierSortOrder" class="field" type="number" min="0" placeholder="排序" />
        <textarea v-model="tierBenefitsJson" class="field min-h-32 font-mono text-xs" placeholder="會員權益 JSON" />
        <button class="btn-primary">建立</button>
      </form>
    </div>
    <AdminTable :columns="['獎勵', '類型', '點數', '庫存/期限', '啟用', '操作']">
      <tr v-for="reward in rewards" :key="reward.id" class="table-row">
        <td class="px-4 py-3">
          <p class="font-semibold text-white">{{ reward.name }}</p>
          <p class="mt-1 text-xs text-slate-400">{{ reward.description ?? '未設定說明' }}</p>
        </td>
        <td class="px-4 py-3">{{ statusLabel(reward.type) }}</td>
        <td class="px-4 py-3">{{ reward.pointsCost }}</td>
        <td class="px-4 py-3 text-xs text-slate-400">
          <p>庫存 {{ reward.stock === null || reward.stock === undefined ? '不限' : reward.stock }}</p>
          <p>{{ reward.expiresAt ? dateTime(reward.expiresAt) : '無期限' }}</p>
        </td>
        <td class="px-4 py-3">{{ reward.isActive ? '啟用' : '停用' }}</td>
        <td class="flex gap-2 px-4 py-3">
          <button class="btn-secondary" @click="selectedReward = { ...reward }">編輯</button>
          <button class="btn-secondary" @click="rewardsApi.update(reward.id, { isActive: !reward.isActive }).then(load)">{{ reward.isActive ? '停用' : '啟用' }}</button>
          <button class="btn-danger" @click="deleteTarget = { type: 'reward', id: reward.id }">刪除</button>
        </td>
      </tr>
    </AdminTable>
    <div class="grid gap-6 lg:grid-cols-2">
      <section class="surface rounded-lg p-5">
        <h2 class="font-bold text-white">優惠券</h2>
        <div class="mt-3 space-y-2">
          <div v-for="coupon in coupons" :key="coupon.id" class="rounded-2xl border border-line bg-white/[0.035] p-4 text-sm text-slate-300">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <strong class="text-white">{{ coupon.name }}</strong>
                <p class="mt-1 text-xs text-slate-400">{{ coupon.code }} · {{ couponDiscountText(coupon) }} · {{ couponScopeText(coupon) }}</p>
              </div>
              <span class="rounded-full border px-2.5 py-1 text-xs font-bold" :class="coupon.isActive ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100' : 'border-slate-300/15 bg-slate-300/10 text-slate-300'">
                {{ coupon.isActive ? '啟用' : '停用' }}
              </span>
            </div>
            <div class="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
              <span>對象 {{ couponAudienceText(coupon) }}</span>
              <span>期間 {{ couponPeriodText(coupon) }}</span>
              <span>低消 {{ coupon.minimumSpend ? money(coupon.minimumSpend) : '無' }}</span>
              <span>使用 {{ coupon.usedCount ?? 0 }} / {{ coupon.usageLimit ?? '不限' }}</span>
            </div>
            <div class="mt-3 flex gap-2">
              <button class="btn-secondary" @click="selectedCoupon = { ...coupon }">編輯</button>
              <button class="btn-secondary" @click="couponsApi.update(coupon.id, { isActive: !coupon.isActive }).then(load)">{{ coupon.isActive ? '停用' : '啟用' }}</button>
              <button class="btn-danger" @click="deleteTarget = { type: 'coupon', id: coupon.id }">刪除</button>
            </div>
          </div>
        </div>
      </section>
      <section class="surface rounded-lg p-5">
        <h2 class="font-bold text-white">會員等級</h2>
        <div class="mt-3 space-y-2">
          <div v-for="tier in tiers" :key="tier.id" class="rounded-2xl border border-line bg-white/[0.035] p-4 text-sm text-slate-300">
            <strong class="text-white">{{ tier.name }}</strong> · {{ money(tier.thresholdAmount) }} · {{ tier.pointEarnRate }}x
            <p class="mt-1 text-xs text-slate-400">{{ tier.description ?? '未設定等級說明' }}</p>
            <div v-if="tierBenefitRows(tier).length" class="mt-3 flex flex-wrap gap-2">
              <span v-for="benefit in tierBenefitRows(tier)" :key="benefit.key" class="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-300">{{ benefit.label }} {{ benefit.value }}</span>
            </div>
            <button class="btn-secondary ml-3" @click="openTierEditor(tier)">編輯</button>
            <button class="btn-danger ml-2" @click="deleteTarget = { type: 'tier', id: tier.id }">刪除</button>
          </div>
        </div>
      </section>
    </div>
    <section class="surface rounded-lg p-5">
      <h2 class="font-bold text-white">獎勵核銷掃描備援</h2>
      <form class="mt-3 grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_auto]" @submit.prevent="scanRedemption">
        <input v-model="scanToken" class="field" placeholder="貼上 REWARD_REDEMPTION JSON 或 token" />
        <button class="btn-primary">查詢核銷</button>
      </form>
      <pre v-if="scanResult" class="mt-3 overflow-auto rounded-md border border-line p-3 text-xs text-slate-300">{{ scanResult }}</pre>
    </section>
    <div class="grid gap-6 lg:grid-cols-2">
      <section class="surface rounded-lg p-5">
        <h2 class="font-bold text-white">近期獎勵兌換</h2>
        <div class="mt-3 space-y-2">
          <div v-for="(item, index) in redemptions" :key="String(item.id ?? index)" class="rounded-md border border-line p-3 text-xs text-slate-300">
            <p class="font-semibold text-white">{{ nestedName(item.reward) ?? displayValue(item.rewardId) ?? '兌換紀錄' }} · {{ displayValue(item.status) }}</p>
            <p class="mt-1">{{ nestedName(item.user) ?? displayValue(item.userId) }} · {{ displayValue(item.pointsSpent ?? item.pointsDeducted ?? 0) }} 點</p>
            <div class="mt-3 flex gap-2">
              <button v-if="item.id && item.status !== 'REDEEMED'" class="btn-secondary" @click="confirmRedemption(String(item.id))">確認核銷</button>
              <button v-if="item.id && item.status === 'PENDING'" class="btn-danger" @click="cancelRedemption(String(item.id))">取消</button>
            </div>
          </div>
        </div>
      </section>
      <section class="surface rounded-lg p-5">
        <h2 class="font-bold text-white">近期優惠券使用</h2>
        <div class="mt-3 space-y-2">
          <div v-for="(item, index) in usages" :key="index" class="rounded-2xl border border-line bg-white/[0.035] p-4 text-xs text-slate-300">
            <p class="font-semibold text-white">{{ nestedName(item.coupon) ?? displayValue(item.couponCode ?? item.couponId) }}</p>
            <p class="mt-1">{{ nestedName(item.user) ?? displayValue(item.userId) }} · 訂單 {{ displayValue(item.orderId) }}</p>
            <p class="mt-1">折抵 {{ money(item.discountAmount ?? 0) }} · {{ item.createdAt ? dateTime(String(item.createdAt)) : '時間未回傳' }}</p>
          </div>
          <p v-if="!usages.length" class="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">尚無優惠券使用紀錄。</p>
        </div>
      </section>
    </div>

    <AdminDetailDrawer :open="Boolean(selectedReward)" :title="selectedReward?.name ?? '獎勵編輯'" subtitle="獎勵明細" @close="selectedReward = null">
      <form v-if="selectedReward" class="space-y-4" @submit.prevent="saveReward">
        <input v-model="selectedReward.name" class="field" required />
        <textarea v-model="selectedReward.description" class="field min-h-24" />
        <select v-model="selectedReward.type" class="field">
          <option value="INSPECTION">檢查服務</option>
          <option value="DISCOUNT">折扣</option>
          <option value="FREE_SERVICE">免費服務</option>
          <option value="PRODUCT">商品</option>
        </select>
        <input v-model.number="selectedReward.pointsCost" class="field" type="number" min="1" />
        <div class="grid gap-3 sm:grid-cols-2">
          <input v-model="selectedReward.discountAmount" class="field" type="number" min="0" placeholder="折抵金額" />
          <input v-model="selectedReward.discountPercent" class="field" type="number" min="0" placeholder="折扣百分比" />
          <input v-model="selectedReward.productId" class="field" placeholder="商品 ID" />
          <input v-model.number="selectedReward.stock" class="field" type="number" min="0" placeholder="庫存" />
          <input v-model="selectedReward.startsAt" class="field" type="datetime-local" />
          <input v-model="selectedReward.expiresAt" class="field" type="datetime-local" />
        </div>
        <label class="inline-flex items-center gap-2 text-sm text-slate-300"><input v-model="selectedReward.isActive" type="checkbox" />啟用</label>
        <button class="btn-primary">儲存獎勵</button>
      </form>
    </AdminDetailDrawer>

    <AdminDetailDrawer :open="Boolean(selectedCoupon)" :title="selectedCoupon?.name ?? '優惠券編輯'" subtitle="優惠券明細" @close="selectedCoupon = null">
      <form v-if="selectedCoupon" class="space-y-4" @submit.prevent="saveCoupon">
        <input v-model="selectedCoupon.name" class="field" required />
        <input v-model="selectedCoupon.code" class="field" />
        <select v-model="selectedCoupon.type" class="field">
          <option value="FIXED_AMOUNT">固定金額</option>
          <option value="PERCENTAGE">百分比折扣</option>
        </select>
        <input v-model="selectedCoupon.value" class="field" type="number" min="0" />
        <input v-model="selectedCoupon.minimumSpend" class="field" type="number" min="0" placeholder="最低消費" />
        <div class="grid gap-3 sm:grid-cols-2">
          <input v-model="selectedCoupon.usageLimit" class="field" type="number" min="1" placeholder="總使用上限" />
          <input v-model="selectedCoupon.perUserLimit" class="field" type="number" min="1" placeholder="每人上限" />
        </div>
        <select v-model="selectedCoupon.membershipTierId" class="field">
          <option value="">不限會員等級</option>
          <option v-for="tier in tiers" :key="tier.id" :value="tier.id">{{ tier.name }}</option>
        </select>
        <div class="grid gap-3 sm:grid-cols-2">
          <input v-model="selectedCoupon.startsAt" class="field" type="datetime-local" />
          <input v-model="selectedCoupon.expiresAt" class="field" type="datetime-local" />
        </div>
        <textarea v-model="selectedCoupon.description" class="field min-h-24" />
        <label class="inline-flex items-center gap-2 text-sm text-slate-300"><input v-model="selectedCoupon.isActive" type="checkbox" />啟用</label>
        <button class="btn-primary">儲存優惠券</button>
      </form>
    </AdminDetailDrawer>

    <AdminDetailDrawer :open="Boolean(selectedTier)" :title="selectedTier?.name ?? '會員等級編輯'" subtitle="等級明細" @close="selectedTier = null">
      <form v-if="selectedTier" class="space-y-4" @submit.prevent="saveTier">
        <input v-model="selectedTier.name" class="field" required />
        <textarea v-model="selectedTier.description" class="field min-h-24" />
        <input v-model="selectedTier.thresholdAmount" class="field" type="number" min="0" />
        <input v-model="selectedTier.pointEarnRate" class="field" type="number" min="0" step="0.1" />
        <input v-model="selectedTier.sortOrder" class="field" type="number" min="0" />
        <textarea v-model="selectedTierBenefitsJson" class="field min-h-40 font-mono text-xs" />
        <label class="inline-flex items-center gap-2 text-sm text-slate-300"><input v-model="selectedTier.isActive" type="checkbox" />啟用</label>
        <button class="btn-primary">儲存等級</button>
      </form>
    </AdminDetailDrawer>

    <ConfirmDialog
      :open="Boolean(deleteTarget)"
      title="確認刪除"
      message="確認刪除此項目？"
      confirm-label="刪除"
      tone="danger"
      @cancel="deleteTarget = null"
      @confirm="removeTarget"
    />
  </div>
</template>
