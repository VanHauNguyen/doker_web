<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BadgeCheck, Clock, Crown, Gift, QrCode, Sparkles, Ticket, Trophy, WalletCards } from 'lucide-vue-next'
import { couponsApi, membershipApi, rewardsApi } from '@/api'
import PremiumHero from '@/components/PremiumHero.vue'
import KpiCard from '@/components/KpiCard.vue'
import PageState from '@/components/PageState.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { dateTime, money } from '@/utils/format'
import {
  couponAvailability,
  couponAudienceText,
  couponDiscountText,
  couponPeriodText,
  couponScopeText,
  normalizeCoupon,
  normalizeMembership,
  normalizeRedemption,
  normalizeReward,
  normalizeTasks,
  rewardCategoryLabel,
  rewardBenefitText,
  rewardUnavailableReason,
  tierBenefitRows,
  tierLevelText,
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
const selectedReward = ref<Reward | null>(null)
const activeRewardCategory = ref('全部')
const activeRedemptionQr = ref<{ title: string; token: string; image: string | null } | null>(null)
const loadingQrId = ref<string | null>(null)

const currentTier = computed(() => (membership.value?.tier ?? membership.value?.membershipTier ?? null) as MembershipTier | null)
const nextTier = computed(() => (membership.value?.nextTier ?? null) as MembershipTier | null)
const points = computed(() => toNumber(membership.value?.currentPoints))
const lifetimeSpending = computed(() => toNumber(membership.value?.lifetimeSpending))
const progress = computed(() => Math.min(100, Math.max(0, toNumber(membership.value?.progress))))
const remainingSpending = computed(() => toNumber(membership.value?.remainingSpending))
const availableCoupons = computed(() => coupons.value.filter((coupon) => couponAvailability(coupon).canUse))
const unavailableCoupons = computed(() => coupons.value.filter((coupon) => !couponAvailability(coupon).canUse))
const redeemableRewards = computed(() => rewards.value.filter((reward) => reward.isActive !== false))
const rewardCategories = computed(() => ['全部', ...Array.from(new Set(redeemableRewards.value.map(rewardCategoryLabel)))])
const filteredRewards = computed(() =>
  activeRewardCategory.value === '全部'
    ? redeemableRewards.value
    : redeemableRewards.value.filter((reward) => rewardCategoryLabel(reward) === activeRewardCategory.value),
)
const currentBenefits = computed(() => tierBenefitRows(currentTier.value))
const nextBenefits = computed(() => tierBenefitRows(nextTier.value))

const manualTaskKeys = new Set(['DAILY_CHECK_IN', 'SHOP_INFO_CLICK', 'PROFILE_COMPLETED'])
const canCompleteManually = (task: RewardTask): boolean => manualTaskKeys.has(task.key)
const taskGroupLabel = (task: RewardTask): string => {
  if (task.group === 'DAILY') return '每日任務'
  if (task.group === 'COMMERCE_EVENT') return '訂單事件'
  if (task.group === 'ENGAGEMENT') return '互動任務'
  return '一次性任務'
}

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
  const blockedReason = rewardUnavailableReason(reward, points.value)
  if (blockedReason) {
    error.value = blockedReason
    return
  }
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

const showRedemptionQr = async (item: RewardRedemption): Promise<void> => {
  loadingQrId.value = item.id
  error.value = null
  try {
    const payload = await rewardsApi.redemptionQr(item.id)
    const record = payload as ApiRecord
    const qrPayload = (record.qrPayload ?? item.qrPayload ?? null) as { token?: string } | null
    const image = typeof record.qrImage === 'string'
      ? record.qrImage
      : typeof record.qrImageUrl === 'string'
        ? record.qrImageUrl
        : item.qrImage ?? item.qrImageUrl ?? null
    activeRedemptionQr.value = {
      title: item.reward?.name ?? '獎勵核銷 QR',
      token: String(qrPayload?.token ?? record.token ?? item.qrPayload?.token ?? ''),
      image,
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '核銷 QR 載入失敗'
  } finally {
    loadingQrId.value = null
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

      <section class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
        <div v-reveal class="relative overflow-hidden rounded-[1.5rem] border border-amber-200/20 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,.32),transparent_35%),linear-gradient(135deg,rgba(15,23,42,.95),rgba(12,30,52,.9))] p-4 shadow-2xl shadow-black/30 sm:p-6">
          <div class="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div class="min-w-0">
              <p class="text-xs font-black text-amber-100">目前等級</p>
              <div class="mt-2 flex flex-wrap items-center gap-3">
                <h2 class="break-words text-2xl font-black text-white sm:text-3xl">{{ currentTier?.name ?? '會員資料同步中' }}</h2>
                <span v-if="currentTier" class="inline-flex items-center gap-1 rounded-full border border-amber-200/25 bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-100">
                  <Crown class="h-3.5 w-3.5" /> {{ tierLevelText(currentTier) }}
                </span>
              </div>
              <p class="mt-2 max-w-xl text-sm leading-6 text-slate-300">{{ currentTier?.description ?? '完成消費、任務與評價可累積點數，提升會員等級。' }}</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-left sm:text-right">
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
              <div class="progress-animate h-full rounded-full bg-gradient-to-r from-amber-300 via-sky-300 to-emerald-300 transition-all" :style="{ width: `${nextTier ? progress : 100}%` }" />
            </div>
            <p class="mt-2 text-xs text-slate-400">
              {{ nextTier ? `尚需 ${money(remainingSpending)} 可升級至 ${nextTier.name}` : '已達目前最高會員等級或尚未設定下一級。' }}
            </p>
          </div>
          <div v-if="currentBenefits.length" class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div v-for="benefit in currentBenefits.slice(0, 6)" :key="benefit.key" class="rounded-2xl border border-white/10 bg-white/[0.055] p-3">
              <p class="text-xs text-slate-400">{{ benefit.label }}</p>
              <p class="mt-1 font-black" :class="benefit.active ? 'text-amber-100' : 'text-slate-500'">{{ benefit.value }}</p>
            </div>
          </div>
        </div>

        <section v-reveal class="surface min-w-0 rounded-2xl p-4 sm:p-5">
          <div class="mb-4 flex min-w-0 items-center justify-between gap-3">
            <h2 class="text-lg font-black text-white">會員等級</h2>
            <RouterLink class="text-sm font-semibold text-accent" to="/profile">查看個人資料</RouterLink>
          </div>
          <div v-if="tiers.length" class="space-y-3">
            <div v-for="(tier, index) in tiers" :key="tier.id" class="rounded-2xl border border-white/10 bg-white/[0.035] p-4" :class="currentTier?.id === tier.id ? 'ring-1 ring-amber-200/30' : ''">
              <div class="flex min-w-0 items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="break-words font-bold text-white">{{ tier.name }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ tierLevelText(tier, index) }}</p>
                </div>
                <span class="rounded-full border border-amber-200/20 bg-amber-300/10 px-2.5 py-1 text-xs font-bold text-amber-100">{{ toNumber(tier.pointEarnRate, 1) }}x</span>
              </div>
              <p class="mt-1 text-sm text-slate-400">門檻 {{ money(tier.thresholdAmount) }}</p>
              <div v-if="tierBenefitRows(tier).length" class="mt-3 flex flex-wrap gap-2">
                <span v-for="benefit in tierBenefitRows(tier).slice(0, 3)" :key="benefit.key" class="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300">
                  {{ benefit.label }} {{ benefit.value }}
                </span>
              </div>
            </div>
          </div>
          <div v-if="nextTier" class="mt-4 rounded-2xl border border-sky-300/15 bg-sky-300/10 p-4">
            <p class="text-xs font-black text-sky-100">下一等級預覽</p>
            <div class="mt-2 flex items-center justify-between gap-3">
              <p class="text-lg font-black text-white">{{ nextTier.name }}</p>
              <span class="text-sm font-bold text-sky-100">{{ toNumber(nextTier.pointEarnRate, 1) }}x</span>
            </div>
            <p class="mt-1 text-sm text-slate-400">升級門檻 {{ money(nextTier.thresholdAmount) }}</p>
            <div v-if="nextBenefits.length" class="mt-3 flex flex-wrap gap-2">
              <span v-for="benefit in nextBenefits.slice(0, 4)" :key="benefit.key" class="rounded-full border border-sky-200/15 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300">
                {{ benefit.label }} {{ benefit.value }}
              </span>
            </div>
          </div>
          <p v-else-if="!tiers.length" class="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">目前沒有會員等級設定。</p>
        </section>
      </section>

      <section class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
        <div v-reveal class="surface min-w-0 rounded-2xl p-4 sm:p-5">
          <div class="mb-4 flex min-w-0 items-center justify-between gap-3">
            <div class="min-w-0">
              <h2 class="text-lg font-black text-white">可兌換獎勵</h2>
              <p class="mt-1 text-sm text-slate-400">兌換後會即時扣點；商品型獎勵可產生 QR 供門市核銷。</p>
            </div>
            <Sparkles class="h-5 w-5 text-accent" />
          </div>
          <div v-if="redeemableRewards.length" class="mb-4 flex flex-wrap gap-2">
            <button
              v-for="category in rewardCategories"
              :key="category"
              class="rounded-full border px-3 py-1.5 text-xs font-black transition"
              :class="activeRewardCategory === category ? 'border-amber-200/30 bg-amber-300/15 text-amber-100' : 'border-white/10 bg-white/[0.035] text-slate-300 hover:border-white/20'"
              type="button"
              @click="activeRewardCategory = category"
            >
              {{ category }}
            </button>
          </div>
          <div v-if="filteredRewards.length" class="stagger-children grid gap-4 lg:grid-cols-2">
            <article v-for="reward in filteredRewards" :key="reward.id" class="hover-lift group overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.075] to-white/[0.025] p-4 transition hover:border-amber-200/25">
              <div class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <p class="text-xs font-bold text-accent">{{ rewardCategoryLabel(reward) }}</p>
                  <h3 class="mt-1 break-words text-lg font-black text-white">{{ reward.name }}</h3>
                </div>
                <div class="w-fit rounded-2xl bg-amber-300/10 px-3 py-2 text-left sm:text-right">
                  <p class="text-xs text-amber-100">需要</p>
                  <p class="font-black text-amber-100">{{ reward.pointsCost }} 點</p>
                </div>
              </div>
              <p class="mt-3 min-h-10 text-sm leading-6 text-slate-400">{{ reward.description ?? rewardBenefitText(reward) }}</p>
              <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                <span class="rounded-full border border-white/10 bg-white/[0.035] px-2 py-1">{{ rewardBenefitText(reward) }}</span>
                <span v-if="reward.stock !== null && reward.stock !== undefined" class="rounded-full border border-white/10 bg-white/[0.035] px-2 py-1">庫存 {{ reward.stock }}</span>
                <span v-if="reward.expiresAt" class="rounded-full border border-white/10 bg-white/[0.035] px-2 py-1">期限 {{ dateTime(reward.expiresAt) }}</span>
              </div>
              <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button class="text-sm font-semibold text-sky-100 transition hover:text-accent" type="button" @click="selectedReward = reward">查看詳情</button>
                <button class="btn-primary w-full sm:w-auto" :disabled="redeemingId === reward.id || Boolean(rewardUnavailableReason(reward, points))" @click="redeem(reward)">
                  {{ redeemingId === reward.id ? '兌換中' : rewardUnavailableReason(reward, points) ?? '兌換' }}
                </button>
              </div>
            </article>
          </div>
          <p v-else class="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">目前沒有符合條件的獎勵。</p>
        </div>

        <div v-reveal class="surface min-w-0 rounded-2xl p-4 sm:p-5">
          <h2 class="text-lg font-black text-white">我的兌換紀錄</h2>
          <div v-if="redemptions.length" class="mt-4 space-y-3">
            <article v-for="item in redemptions" :key="item.id" class="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="min-w-0">
                  <p class="break-words font-bold text-white">{{ item.reward?.name ?? '獎勵兌換' }}</p>
                  <p class="mt-1 text-sm text-slate-400">{{ item.pointsSpent }} 點 · {{ dateTime(item.createdAt) }}</p>
                </div>
                <StatusBadge :value="item.status" />
              </div>
              <div v-if="item.qrPayload" class="mt-3 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-bold text-sky-100">
                <QrCode class="h-3.5 w-3.5" /> 可供門市核銷
              </div>
              <button v-if="item.qrPayload && item.status === 'PENDING'" class="btn-secondary mt-3 w-full" :disabled="loadingQrId === item.id" @click="showRedemptionQr(item)">
                {{ loadingQrId === item.id ? '載入 QR 中' : '顯示核銷 QR' }}
              </button>
            </article>
          </div>
          <p v-else class="mt-4 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">尚無兌換紀錄。</p>
        </div>
      </section>

      <section v-reveal class="surface min-w-0 rounded-2xl p-4 sm:p-5">
        <div class="mb-4 flex min-w-0 items-center justify-between gap-3">
          <div class="min-w-0">
            <h2 class="text-lg font-black text-white">優惠券錢包</h2>
            <p class="mt-1 text-sm text-slate-400">優惠券會在結帳預覽與建立訂單時由後端再次驗證。</p>
          </div>
          <Ticket class="h-5 w-5 text-accent" />
        </div>
        <div v-if="coupons.length" class="stagger-children grid gap-4 lg:grid-cols-3">
          <article v-for="coupon in coupons" :key="coupon.id" class="hover-lift relative overflow-hidden rounded-2xl border p-4" :class="couponAvailability(coupon).canUse ? 'border-amber-200/25 bg-amber-300/10' : 'border-white/10 bg-white/[0.035] opacity-75'">
            <div class="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div class="relative">
              <div class="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <p class="text-xs font-bold text-slate-300">{{ couponScopeText(coupon) }}</p>
                  <h3 class="mt-1 break-words text-lg font-black text-white">{{ coupon.name }}</h3>
                </div>
                <span class="w-fit rounded-full border px-2.5 py-1 text-xs font-bold" :class="couponAvailability(coupon).canUse ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100' : 'border-slate-300/15 bg-slate-300/10 text-slate-300'">
                  {{ couponAvailability(coupon).label }}
                </span>
              </div>
              <p class="break-words text-2xl font-black text-accent">{{ couponDiscountText(coupon) }}</p>
              <p class="mt-2 text-sm leading-6 text-slate-300">{{ coupon.usageCondition ?? couponAvailability(coupon).reason }}</p>
              <div class="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                <span>低消 {{ toNumber(coupon.minimumSpend) > 0 ? money(coupon.minimumSpend) : '無' }}</span>
                <span>每人 {{ coupon.perUserLimit ? `${coupon.perUserLimit} 次` : '不限' }}</span>
                <span>已用 {{ coupon.perUserUsedCount ?? 0 }} 次</span>
                <span>對象 {{ couponAudienceText(coupon) }}</span>
                <span class="col-span-2 inline-flex items-center gap-1"><Clock class="h-3.5 w-3.5" /> {{ couponPeriodText(coupon) }}</span>
              </div>
            </div>
          </article>
        </div>
        <p v-else class="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">目前沒有可用優惠券。</p>
        <p v-if="unavailableCoupons.length" class="mt-3 text-xs text-slate-500">包含 {{ unavailableCoupons.length }} 張已使用、過期或暫不可用優惠券。</p>
      </section>

      <section class="surface min-w-0 rounded-2xl p-4 sm:p-5">
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
            <p class="mt-1 text-sm text-slate-400">{{ taskGroupLabel(task) }} · {{ task.frequency ?? '任務' }}</p>
            <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-black/30">
              <div class="h-full rounded-full bg-accent" :style="{ width: `${Math.min(100, (toNumber(task.progress) / Math.max(toNumber(task.target, 1), 1)) * 100)}%` }" />
            </div>
            <button class="btn-secondary mt-4 w-full" :disabled="task.completed || completingTaskKey === task.key || !canCompleteManually(task)" @click="completeTask(task)">
              {{ task.completed ? '已完成' : completingTaskKey === task.key ? '處理中' : canCompleteManually(task) ? '完成任務' : '由系統判定' }}
            </button>
          </article>
        </div>
        <p v-else class="mt-4 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">目前沒有會員任務。</p>
      </section>

      <Teleport to="body">
        <div v-if="selectedReward" class="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" @click.self="selectedReward = null">
          <section class="animate-scale-in max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-[1.5rem] border border-amber-200/20 bg-slate-950/95 p-4 shadow-2xl shadow-black/40 sm:p-6">
            <div class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <p class="text-xs font-black text-accent">{{ rewardCategoryLabel(selectedReward) }}</p>
                <h3 class="mt-2 break-words text-2xl font-black text-white">{{ selectedReward.name }}</h3>
              </div>
              <button class="btn-secondary w-full sm:w-auto" type="button" @click="selectedReward = null">關閉</button>
            </div>
            <p class="mt-4 text-sm leading-6 text-slate-300">{{ selectedReward.description ?? rewardBenefitText(selectedReward) }}</p>
            <div class="mt-5 grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p class="text-xs text-slate-400">所需點數</p>
                <p class="mt-1 text-xl font-black text-amber-100">{{ selectedReward.pointsCost }} 點</p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p class="text-xs text-slate-400">兌換內容</p>
                <p class="mt-1 font-black text-white">{{ rewardBenefitText(selectedReward) }}</p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p class="text-xs text-slate-400">庫存狀態</p>
                <p class="mt-1 font-black text-white">{{ selectedReward.stock === null || selectedReward.stock === undefined ? '不限量' : `${selectedReward.stock} 份` }}</p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p class="text-xs text-slate-400">兌換期限</p>
                <p class="mt-1 font-black text-white">{{ selectedReward.expiresAt ? dateTime(selectedReward.expiresAt) : '無期限' }}</p>
              </div>
            </div>
            <button class="btn-primary mt-5 w-full" :disabled="Boolean(rewardUnavailableReason(selectedReward, points)) || redeemingId === selectedReward.id" @click="redeem(selectedReward)">
              {{ redeemingId === selectedReward.id ? '兌換中' : rewardUnavailableReason(selectedReward, points) ?? '確認兌換' }}
            </button>
          </section>
        </div>

        <div v-if="activeRedemptionQr" class="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" @click.self="activeRedemptionQr = null">
          <section class="animate-scale-in max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[1.5rem] border border-sky-200/20 bg-slate-950/95 p-4 text-center shadow-2xl shadow-black/40 sm:p-6">
            <p class="text-xs font-black text-sky-100">門市核銷 QR</p>
            <h3 class="mt-2 text-xl font-black text-white">{{ activeRedemptionQr.title }}</h3>
            <div class="mx-auto mt-5 grid aspect-square w-full max-w-64 place-items-center rounded-3xl border border-white/10 bg-white p-4">
              <img v-if="activeRedemptionQr.image" :src="activeRedemptionQr.image" alt="獎勵核銷 QR Code" class="h-full w-full object-contain" />
              <QrCode v-else class="h-24 w-24 text-slate-400" />
            </div>
            <p class="mt-4 break-all rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-300">{{ activeRedemptionQr.token || '後端未回傳核銷 token' }}</p>
            <button class="btn-secondary mt-5 w-full" type="button" @click="activeRedemptionQr = null">關閉</button>
          </section>
        </div>
      </Teleport>
    </PageState>
  </div>
</template>
