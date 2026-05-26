<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { couponsApi, membershipApi, rewardsApi } from '@/api'
import PremiumHero from '@/components/PremiumHero.vue'
import AdminDetailDrawer from '@/components/admin/AdminDetailDrawer.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import { money } from '@/utils/format'
import { statusLabel } from '@/utils/status'
import { couponDiscountText, normalizeCoupon, normalizeReward, unwrapList } from '@/utils/membershipRewards'
import type { ApiRecord, Coupon, MembershipTier, Reward, RewardType } from '@/types/backend'

const rewards = ref<Reward[]>([])
const coupons = ref<Coupon[]>([])
const tiers = ref<MembershipTier[]>([])
const redemptions = ref<ApiRecord[]>([])
const usages = ref<ApiRecord[]>([])
const rewardName = ref('')
const rewardType = ref<RewardType>('INSPECTION')
const rewardPoints = ref(100)
const couponCode = ref('')
const couponValue = ref(100)
const tierName = ref('')
const tierThreshold = ref(0)
const selectedReward = ref<Reward | null>(null)
const selectedCoupon = ref<Coupon | null>(null)
const selectedTier = ref<MembershipTier | null>(null)
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

const createReward = async (): Promise<void> => {
  await rewardsApi.create({ name: rewardName.value, type: rewardType.value, pointsCost: rewardPoints.value, isActive: true })
  rewardName.value = ''
  await load()
}

const createCoupon = async (): Promise<void> => {
  await couponsApi.create({ code: couponCode.value, name: couponCode.value, type: 'FIXED_AMOUNT', value: couponValue.value, isActive: true })
  couponCode.value = ''
  await load()
}

const createTier = async (): Promise<void> => {
  await membershipApi.createTier({ name: tierName.value, thresholdAmount: tierThreshold.value, pointEarnRate: 1, sortOrder: tiers.value.length })
  tierName.value = ''
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
  await membershipApi.updateTier(selectedTier.value.id, selectedTier.value)
  selectedTier.value = null
  await load()
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
        <select v-model="rewardType" class="field">
          <option value="INSPECTION">檢查服務</option>
          <option value="DISCOUNT">折扣</option>
          <option value="FREE_SERVICE">免費服務</option>
          <option value="PRODUCT">商品</option>
        </select>
        <input v-model.number="rewardPoints" class="field" type="number" min="1" />
        <button class="btn-primary">建立</button>
      </form>
      <form class="surface space-y-3 rounded-lg p-4" @submit.prevent="createCoupon">
        <h2 class="font-bold text-white">建立優惠券</h2>
        <input v-model="couponCode" class="field" placeholder="代碼" required />
        <input v-model.number="couponValue" class="field" type="number" min="0" />
        <button class="btn-primary">建立</button>
      </form>
      <form class="surface space-y-3 rounded-lg p-4" @submit.prevent="createTier">
        <h2 class="font-bold text-white">建立會員等級</h2>
        <input v-model="tierName" class="field" placeholder="名稱" required />
        <input v-model.number="tierThreshold" class="field" type="number" min="0" />
        <button class="btn-primary">建立</button>
      </form>
    </div>
    <AdminTable :columns="['獎勵', '類型', '點數', '啟用', '操作']">
      <tr v-for="reward in rewards" :key="reward.id" class="table-row">
        <td class="px-4 py-3 font-semibold text-white">{{ reward.name }}</td>
        <td class="px-4 py-3">{{ statusLabel(reward.type) }}</td>
        <td class="px-4 py-3">{{ reward.pointsCost }}</td>
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
          <div v-for="coupon in coupons" :key="coupon.id" class="rounded-md border border-line p-3 text-sm text-slate-300">
            <strong class="text-white">{{ coupon.name }}</strong> · {{ couponDiscountText(coupon) }} · {{ coupon.code }}
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
          <p v-for="tier in tiers" :key="tier.id" class="rounded-md border border-line p-3 text-sm text-slate-300">
            <strong class="text-white">{{ tier.name }}</strong> · {{ money(tier.thresholdAmount) }}
            <button class="btn-secondary ml-3" @click="selectedTier = { ...tier }">編輯</button>
            <button class="btn-danger ml-2" @click="deleteTarget = { type: 'tier', id: tier.id }">刪除</button>
          </p>
        </div>
      </section>
    </div>
    <section class="surface rounded-lg p-5">
      <h2 class="font-bold text-white">獎勵核銷掃描備援</h2>
      <form class="mt-3 grid gap-3 md:grid-cols-[1fr_auto]" @submit.prevent="scanRedemption">
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
          <pre v-for="(item, index) in usages" :key="index" class="overflow-auto rounded-md border border-line p-3 text-xs text-slate-300">{{ item }}</pre>
        </div>
      </section>
    </div>

    <AdminDetailDrawer :open="Boolean(selectedReward)" :title="selectedReward?.name ?? '獎勵編輯'" subtitle="獎勵明細" @close="selectedReward = null">
      <form v-if="selectedReward" class="space-y-4" @submit.prevent="saveReward">
        <input v-model="selectedReward.name" class="field" required />
        <textarea v-model="selectedReward.description" class="field min-h-24" />
        <input v-model.number="selectedReward.pointsCost" class="field" type="number" min="1" />
        <label class="inline-flex items-center gap-2 text-sm text-slate-300"><input v-model="selectedReward.isActive" type="checkbox" />啟用</label>
        <button class="btn-primary">儲存獎勵</button>
      </form>
    </AdminDetailDrawer>

    <AdminDetailDrawer :open="Boolean(selectedCoupon)" :title="selectedCoupon?.name ?? '優惠券編輯'" subtitle="優惠券明細" @close="selectedCoupon = null">
      <form v-if="selectedCoupon" class="space-y-4" @submit.prevent="saveCoupon">
        <input v-model="selectedCoupon.name" class="field" required />
        <input v-model="selectedCoupon.code" class="field" />
        <input v-model="selectedCoupon.value" class="field" type="number" min="0" />
        <textarea v-model="selectedCoupon.description" class="field min-h-24" />
        <label class="inline-flex items-center gap-2 text-sm text-slate-300"><input v-model="selectedCoupon.isActive" type="checkbox" />啟用</label>
        <button class="btn-primary">儲存優惠券</button>
      </form>
    </AdminDetailDrawer>

    <AdminDetailDrawer :open="Boolean(selectedTier)" :title="selectedTier?.name ?? '會員等級編輯'" subtitle="等級明細" @close="selectedTier = null">
      <form v-if="selectedTier" class="space-y-4" @submit.prevent="saveTier">
        <input v-model="selectedTier.name" class="field" required />
        <input v-model="selectedTier.thresholdAmount" class="field" type="number" min="0" />
        <input v-model="selectedTier.pointEarnRate" class="field" type="number" min="0" step="0.1" />
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
