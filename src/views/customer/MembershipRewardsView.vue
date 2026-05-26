<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BadgeCheck, Gift, QrCode, Sparkles, Ticket, Trophy, WalletCards } from 'lucide-vue-next'
import { couponsApi, membershipApi, rewardsApi } from '@/api'
import PremiumHero from '@/components/PremiumHero.vue'
import KpiCard from '@/components/KpiCard.vue'
import PageState from '@/components/PageState.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { dateTime, money } from '@/utils/format'
import { statusLabel } from '@/utils/status'
import {
  couponAvailability,
  couponDiscountText,
  normalizeCoupon,
  normalizeMembership,
  normalizeRedemption,
  normalizeReward,
  normalizeTasks,
  rewardBenefitText,
  toNumber,
  unwrapList,
} from '@/utils/membershipRewards'
import type { ApiRecord, Coupon, MembershipTier, Reward, RewardRedemption, RewardTask } from '@/types/backend'

const membership = ref<ApiRecord | null>(null)
const tiers = ref<MembershipTier[]>([])
const rewards = ref<Reward[]>([])
const coupons = ref<Coupon[]>([])
const redemptions = ref<RewardRedemption[]>([])
const tasks = ref<RewardTask[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const message = ref<string | null>(null)
const redeemingId = ref<string | null>(null)
const completingTaskKey = ref<string | null>(null)

const currentTier = computed(() => (membership.value?.tier ?? membership.value?.membershipTier ?? null) as MembershipTier | null)
const nextTier = computed(() => (membership.value?.nextTier ?? null) as MembershipTier | null)
const points = computed(() => toNumber(membership.value?.currentPoints))
const lifetimeSpending = computed(() => toNumber(membership.value?.lifetimeSpending))
const progress = computed(() => Math.min(100, Math.max(0, toNumber(membership.value?.progress))))
const availableCoupons = computed(() => coupons.value.filter((coupon) => couponAvailability(coupon).canUse))
const unavailableCoupons = computed(() => coupons.value.filter((coupon) => !couponAvailability(coupon).canUse))
const redeemableRewards = computed(() => rewards.value.filter((reward) => reward.isActive !== false))

const load = async (): Promise<void> => {
  loading.value = true
  error.value = null
  try {
    const [tierPayload, memberPayload, rewardPayload, couponPayload, redemptionPayload, taskPayload] = await Promise.all([
      membershipApi.tiers(),
      membershipApi.me(),
      rewardsApi.list(),
      couponsApi.mine(),
      rewardsApi.myRedemptions(),
      rewardsApi.tasks(),
    ])

    tiers.value = unwrapList<MembershipTier>(tierPayload).length ? unwrapList<MembershipTier>(tierPayload) : tierPayload
    membership.value = normalizeMembership(memberPayload, tiers.value)
    rewards.value = unwrapList<Reward>(rewardPayload).map(normalizeReward).filter((reward) => reward.id)
    coupons.value = unwrapList<Coupon>(couponPayload).map(normalizeCoupon).filter((coupon) => coupon.id)
    redemptions.value = unwrapList<ApiRecord>(redemptionPayload).map(normalizeRedemption).filter((item) => item.id)
    const taskResult = normalizeTasks(taskPayload)
    tasks.value = taskResult.tasks
    if (!points.value && taskResult.points) {
      membership.value = { ...(membership.value ?? {}), currentPoints: taskResult.points }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '會員資料載入失敗'
  } finally {
    loading.value = false
  }
}

const redeem = async (reward: Reward): Promise<void> => {
  redeemingId.value = reward.id
  message.value = null
  error.value = null
  try {
    const result = await rewardsApi.redeem(reward.id)
    const coupon = normalizeCoupon((result as ApiRecord).coupon)
    message.value = coupon.id ? `${reward.name} 已兌換，優惠券已加入帳戶` : `${reward.name} 已兌換`
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '兌換失敗，請確認點數或庫存後再試'
  } finally {
    redeemingId.value = null
  }
}

const completeTask = async (task: RewardTask): Promise<void> => {
  if (!task.key) return
  completingTaskKey.value = task.key
  message.value = null
  error.value = null
  try {
    await rewardsApi.completeTask(task.key)
    message.value = '會員任務已完成，點數已更新'
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '任務目前無法完成'
  } finally {
    completingTaskKey.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-7">
    <PremiumHero eyebrow="會員中心" title="會員點數、優惠券、任務與等級進度。">
      <div class="grid gap-4 md:grid-cols-4">
        <KpiCard label="可用點數" :value="points" :icon="Gift" tone="gold" />
        <KpiCard label="累積消費" :value="money(lifetimeSpending)" :icon="WalletCards" tone="blue" />
        <KpiCard label="可兌換獎勵" :value="redeemableRewards.length" :icon="Trophy" tone="green" />
        <KpiCard label="可用優惠券" :value="availableCoupons.length" :icon="Ticket" tone="rose" />
      </div>
    </PremiumHero>

    <PageState :loading="loading" :error="error" :empty="false" @retry="load">
      <p v-if="message" class="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100">{{ message }}</p>

      <section class="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <div class="relative overflow-hidden rounded-[1.5rem] border border-amber-200/20 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,.32),transparent_35%),linear-gradient(135deg,rgba(15,23,42,.95),rgba(12,30,52,.9))] p-6 shadow-2xl shadow-black/30">
          <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p class="text-xs font-black text-amber-100">目前等級</p>
              <h2 class="mt-2 text-3xl font-black text-white">{{ currentTier?.name ?? '會員資料同步中' }}</h2>
              <p class="mt-2 max-w-xl text-sm leading-6 text-slate-300">{{ currentTier?.description ?? '完成消費、任務與評價可累積點數，提升會員等級。' }}</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-right">
              <p class="text-xs text-slate-400">點數倍率</p>
              <p class="text-3xl font-black text-accent">{{ toNumber(currentTier?.pointEarnRate, 1) }}x</p>
            </div>
          </div>
          <div class="mt-6">
            <div class="mb-2 flex items-center justify-between text-xs font-bold text-slate-300">
              <span>{{ nextTier ? `距離 ${nextTier.name}` : '等級進度' }}</span>
              <span>{{ nextTier ? `${Math.round(progress)}%` : 'MAX' }}</span>
            </div>
            <div class="h-3 overflow-hidden rounded-full bg-black/30">
              <div class="h-full rounded-full bg-gradient-to-r from-amber-300 via-sky-300 to-emerald-300 transition-all" :style="{ width: `${nextTier ? progress : 100}%` }" />
            </div>
            <p class="mt-2 text-xs text-slate-400">
              {{ nextTier ? `尚需 ${money(membership?.remainingSpending)} 可升級` : '已達目前最高會員等級或尚未設定下一級。' }}
            </p>
          </div>
        </div>

        <section class="surface rounded-2xl p-5">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-black text-white">會員等級</h2>
            <RouterLink class="text-sm font-semibold text-accent" to="/profile">查看個人資料</RouterLink>
          </div>
          <div v-if="tiers.length" class="space-y-3">
            <div v-for="tier in tiers" :key="tier.id" class="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="font-bold text-white">{{ tier.name }}</p>
                <span class="rounded-full border border-amber-200/20 bg-amber-300/10 px-2.5 py-1 text-xs font-bold text-amber-100">{{ toNumber(tier.pointEarnRate, 1) }}x</span>
              </div>
              <p class="mt-1 text-sm text-slate-400">門檻 {{ money(tier.thresholdAmount) }}</p>
            </div>
          </div>
          <p v-else class="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">目前沒有會員等級設定。</p>
        </section>
      </section>

      <section class="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div class="surface rounded-2xl p-5">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-black text-white">可兌換獎勵</h2>
              <p class="mt-1 text-sm text-slate-400">兌換後會即時扣點；商品型獎勵可產生 QR 供門市核銷。</p>
            </div>
            <Sparkles class="h-5 w-5 text-accent" />
          </div>
          <div v-if="redeemableRewards.length" class="grid gap-4 lg:grid-cols-2">
            <article v-for="reward in redeemableRewards" :key="reward.id" class="group overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.075] to-white/[0.025] p-4 transition hover:-translate-y-1 hover:border-amber-200/25">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-bold text-accent">{{ statusLabel(reward.type) }}</p>
                  <h3 class="mt-1 text-lg font-black text-white">{{ reward.name }}</h3>
                </div>
                <div class="rounded-2xl bg-amber-300/10 px-3 py-2 text-right">
                  <p class="text-xs text-amber-100">需要</p>
                  <p class="font-black text-amber-100">{{ reward.pointsCost }} 點</p>
                </div>
              </div>
              <p class="mt-3 min-h-10 text-sm leading-6 text-slate-400">{{ reward.description ?? rewardBenefitText(reward) }}</p>
              <div class="mt-4 flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-slate-300">{{ rewardBenefitText(reward) }}</p>
                <button class="btn-primary" :disabled="redeemingId === reward.id || points < reward.pointsCost || toNumber(reward.stock, 1) <= 0" @click="redeem(reward)">
                  {{ redeemingId === reward.id ? '兌換中' : points < reward.pointsCost ? '點數不足' : '兌換' }}
                </button>
              </div>
            </article>
          </div>
          <p v-else class="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">目前沒有可兌換獎勵。</p>
        </div>

        <div class="surface rounded-2xl p-5">
          <h2 class="text-lg font-black text-white">我的兌換紀錄</h2>
          <div v-if="redemptions.length" class="mt-4 space-y-3">
            <article v-for="item in redemptions" :key="item.id" class="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="font-bold text-white">{{ item.reward?.name ?? '獎勵兌換' }}</p>
                  <p class="mt-1 text-sm text-slate-400">{{ item.pointsSpent }} 點 · {{ dateTime(item.createdAt) }}</p>
                </div>
                <StatusBadge :value="item.status" />
              </div>
              <div v-if="item.qrPayload" class="mt-3 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-bold text-sky-100">
                <QrCode class="h-3.5 w-3.5" /> 可供門市核銷
              </div>
            </article>
          </div>
          <p v-else class="mt-4 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">尚無兌換紀錄。</p>
        </div>
      </section>

      <section class="surface rounded-2xl p-5">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-black text-white">優惠券錢包</h2>
            <p class="mt-1 text-sm text-slate-400">優惠券會在結帳預覽與建立訂單時由後端再次驗證。</p>
          </div>
          <Ticket class="h-5 w-5 text-accent" />
        </div>
        <div v-if="coupons.length" class="grid gap-4 lg:grid-cols-3">
          <article v-for="coupon in coupons" :key="coupon.id" class="relative overflow-hidden rounded-2xl border p-4" :class="couponAvailability(coupon).canUse ? 'border-amber-200/25 bg-amber-300/10' : 'border-white/10 bg-white/[0.035] opacity-75'">
            <div class="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div class="relative">
              <div class="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-bold text-slate-300">{{ coupon.applicabilityLabel ?? coupon.applicability?.label ?? '結帳適用' }}</p>
                  <h3 class="mt-1 text-lg font-black text-white">{{ coupon.name }}</h3>
                </div>
                <span class="rounded-full border px-2.5 py-1 text-xs font-bold" :class="couponAvailability(coupon).canUse ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100' : 'border-slate-300/15 bg-slate-300/10 text-slate-300'">
                  {{ couponAvailability(coupon).label }}
                </span>
              </div>
              <p class="text-2xl font-black text-accent">{{ couponDiscountText(coupon) }}</p>
              <p class="mt-2 text-sm leading-6 text-slate-300">{{ coupon.usageCondition ?? couponAvailability(coupon).reason }}</p>
              <div class="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                <span>低消 {{ toNumber(coupon.minimumSpend) > 0 ? money(coupon.minimumSpend) : '無' }}</span>
                <span>每人 {{ coupon.perUserLimit ? `${coupon.perUserLimit} 次` : '不限' }}</span>
                <span>已用 {{ coupon.perUserUsedCount ?? 0 }} 次</span>
                <span>到期 {{ coupon.expiresAt ? dateTime(coupon.expiresAt) : '無期限' }}</span>
              </div>
            </div>
          </article>
        </div>
        <p v-else class="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">目前沒有可用優惠券。</p>
        <p v-if="unavailableCoupons.length" class="mt-3 text-xs text-slate-500">包含 {{ unavailableCoupons.length }} 張已使用、過期或暫不可用優惠券。</p>
      </section>

      <section class="surface rounded-2xl p-5">
        <h2 class="text-lg font-black text-white">會員任務</h2>
        <div v-if="tasks.length" class="mt-4 grid gap-3 lg:grid-cols-4">
          <article v-for="task in tasks" :key="task.key" class="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div class="mb-3 flex items-center justify-between gap-3">
              <span class="grid h-10 w-10 place-items-center rounded-xl" :class="task.completed ? 'bg-emerald-300/10 text-emerald-100' : 'bg-sky-300/10 text-sky-100'">
                <BadgeCheck class="h-5 w-5" />
              </span>
              <span class="text-xs font-bold text-accent">+{{ task.points }} 點</span>
            </div>
            <p class="font-bold text-white">{{ task.title }}</p>
            <p class="mt-1 text-sm text-slate-400">{{ task.group }} · {{ task.frequency ?? '任務' }}</p>
            <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-black/30">
              <div class="h-full rounded-full bg-accent" :style="{ width: `${Math.min(100, (toNumber(task.progress) / Math.max(toNumber(task.target, 1), 1)) * 100)}%` }" />
            </div>
            <button class="btn-secondary mt-4 w-full" :disabled="task.completed || completingTaskKey === task.key" @click="completeTask(task)">
              {{ task.completed ? '已完成' : completingTaskKey === task.key ? '處理中' : '完成任務' }}
            </button>
          </article>
        </div>
        <p v-else class="mt-4 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">目前沒有會員任務。</p>
      </section>
    </PageState>
  </div>
</template>
