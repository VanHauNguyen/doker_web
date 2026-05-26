<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  Bell,
  Car,
  ChevronLeft,
  ChevronRight,
  Gift,
  MapPinned,
  MessageCircle,
  Package,
  PlayCircle,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Ticket,
  Wrench,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useRealtimeStore } from '@/stores/realtime'
import { couponsApi, membershipApi, newsApi, ordersApi, productsApi, rewardsApi, servicesApi, vehiclesApi, warrantiesApi, youtubeApi } from '@/api'
import KpiCard from '@/components/KpiCard.vue'
import SectionCard from '@/components/SectionCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import TimelineRail from '@/components/TimelineRail.vue'
import PageState from '@/components/PageState.vue'
import { dateTime, money, normalizeList } from '@/utils/format'
import { getOrderTimelineCurrentLabel } from '@/utils/orderFulfillment'
import { statusLabel } from '@/utils/status'
import { normalizeCoupon, normalizeMembership, normalizeReward, unwrapList } from '@/utils/membershipRewards'
import { externalLinks } from '@/config/externalLinks'
import type { ApiRecord, Coupon, NewsItem, Order, Product, Reward, ServiceItem, Vehicle, Warranty } from '@/types/backend'

import banner1 from '@/assets/banners/banner-1.jpg'
import banner2 from '@/assets/banners/banner-2.jpg'
import banner3 from '@/assets/banners/banner-3.jpg'
import banner4 from '@/assets/banners/banner-4.jpg'

interface VideoItem {
  id: string
  title: string
  thumbnail?: string
  publishedAt?: string
  viewCount?: string
}

interface HomeBanner {
  id: string
  tag: string
  title: string
  subtitle: string
  assetImage: string
  to: string
  cta: string
  tone: string
}

const auth = useAuthStore()
const realtime = useRealtimeStore()

const loading = ref(true)
const error = ref<string | null>(null)

const orders = ref<Order[]>([])
const warranties = ref<Warranty[]>([])
const vehicles = ref<Vehicle[]>([])
const products = ref<Product[]>([])
const services = ref<ServiceItem[]>([])
const news = ref<NewsItem[]>([])
const coupons = ref<Coupon[]>([])
const rewards = ref<Reward[]>([])
const membership = ref<ApiRecord | null>(null)
const videos = ref<VideoItem[]>([])

const activeBanner = ref(0)
let bannerTimer: number | undefined

const activeWarranties = computed(() => warranties.value.filter((item) => item.status === 'ACTIVE'))
const pendingOrders = computed(() => orders.value.filter((item) => ['PENDING', 'CONFIRMED', 'PAID', 'PROCESSING', 'PREPARING'].includes(item.status)))
const completedOrders = computed(() => orders.value.filter((item) => item.status === 'COMPLETED'))

const points = computed(() => Number(membership.value?.currentPoints ?? membership.value?.points ?? auth.user?.currentPoints ?? 0))
const currentTier = computed(() => (membership.value?.tier ?? membership.value?.membershipTier ?? null) as { name?: string } | null)

const banners = computed<HomeBanner[]>(() => [
  {
    id: 'premium-membership',
    tag: 'DOKER PREMIUM',
    title: '頂級機車保固會員平台',
    subtitle:
      '整合保固、會員、商城、點數與 QR 會員系統，打造真正高階車主體驗。',
    assetImage: banner1,
    to: '/membership',
    cta: '查看會員權益',
    tone: 'from-amber-300/20 via-sky-300/8 to-transparent',
  },

  {
    id: 'premium-service',
    tag: '專業安裝服務',
    title: '高階 TPU 防護與專業施工',
    subtitle:
      'Premium coating、TPU 犀牛皮、防刮保護與專業安裝流程，一站式完成。',
    assetImage: banner2,
    to: '/catalog',
    cta: '探索服務',
    tone: 'from-sky-300/18 via-amber-300/8 to-transparent',
  },

  {
    id: 'premium-rewards',
    tag: '會員點數系統',
    title: '點數回饋與會員獎勵',
    subtitle:
      '消費累積點數、解鎖會員任務與高階兌換福利，建立完整會員生態。',
    assetImage: banner3,
    to: '/membership',
    cta: '立即查看',
    tone: 'from-amber-300/18 via-rose-300/8 to-transparent',
  },

  {
    id: 'premium-coupons',
    tag: '限時優惠活動',
    title: '專屬優惠券與保固方案',
    subtitle:
      '會員限定折扣、安裝優惠與高階保固活動，提供更完整的車主服務。',
    assetImage: banner4,
    to: '/membership',
    cta: '領取優惠',
    tone: 'from-amber-300/20 via-orange-300/8 to-transparent',
  },
])

const currentBanner = computed(() => banners.value[activeBanner.value] ?? banners.value[0])

const nextBanner = (): void => {
  activeBanner.value = (activeBanner.value + 1) % Math.max(banners.value.length, 1)
}

const previousBanner = (): void => {
  activeBanner.value = (activeBanner.value - 1 + banners.value.length) % Math.max(banners.value.length, 1)
}

const quickActions = computed(() => [
  { label: '商品商城', desc: '選購保固與安裝商品', to: '/catalog', icon: ShoppingBag, tone: 'from-sky-400/25 to-blue-500/10' },
  { label: '我的訂單', desc: `${pendingOrders.value.length} 筆進行中`, to: '/orders', icon: Package, tone: 'from-amber-400/25 to-orange-500/10' },
  { label: '保固中心', desc: `${activeWarranties.value.length} 張生效中`, to: '/warranties', icon: ShieldCheck, tone: 'from-emerald-400/25 to-teal-500/10' },
  { label: '愛車資料', desc: `${vehicles.value.length} 台車輛`, to: '/vehicles', icon: Car, tone: 'from-slate-300/20 to-slate-500/10' },
  { label: 'QR 會員碼', desc: '出示會員或掃描核銷', to: '/qr', icon: QrCode, tone: 'from-fuchsia-400/20 to-violet-500/10' },
  { label: '通知中心', desc: `${realtime.unread} 則未讀`, to: '/notifications', icon: Bell, tone: 'from-rose-400/20 to-red-500/10' },
  { label: '會員點數', desc: `${points.value} 點可用`, to: '/membership', icon: Gift, tone: 'from-yellow-300/25 to-amber-500/10' },
  { label: '客服聊天室', desc: '訂單、保固與安裝諮詢', to: '/chat', icon: MessageCircle, tone: 'from-cyan-300/20 to-sky-500/10' },
])

const contacts = [
  { label: '地圖導航', href: externalLinks.map.href, icon: MapPinned },
  { label: '客服電話', href: externalLinks.supportPhone.href, icon: Wrench },
  { label: 'LINE 客服', href: externalLinks.line.href, icon: MessageCircle },
  { label: 'YouTube', href: externalLinks.youtube.href, icon: PlayCircle },
]

const extractVideos = (payload: unknown): VideoItem[] => {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown[] })?.data)
      ? (payload as { data: unknown[] }).data
      : Array.isArray((payload as { videos?: unknown[] })?.videos)
        ? (payload as { videos: unknown[] }).videos
        : []

  return source.slice(0, 3).map((item, index) => {
    const record = item as ApiRecord
    return {
      id: String(record.id ?? record.videoId ?? index),
      title: String(record.title ?? 'DOKER 最新影片'),
      thumbnail: typeof record.thumbnail === 'string' ? record.thumbnail : typeof record.thumbnailUrl === 'string' ? record.thumbnailUrl : undefined,
      publishedAt: typeof record.publishedAt === 'string' ? record.publishedAt : undefined,
      viewCount: typeof record.viewCount === 'string' ? record.viewCount : undefined,
    }
  })
}

const load = async (): Promise<void> => {
  loading.value = true
  error.value = null

  try {
    const [
      orderPayload,
      warrantyPayload,
      memberPayload,
      newsPayload,
      productPayload,
      servicePayload,
      vehiclePayload,
      videoPayload,
      couponPayload,
      rewardPayload,
    ] = await Promise.allSettled([
      ordersApi.list({ limit: 6 }),
      warrantiesApi.list(),
      membershipApi.me(),
      newsApi.publicList(),
      productsApi.list({ limit: 6 }),
      servicesApi.list(),
      vehiclesApi.list(),
      youtubeApi.latest(),
      couponsApi.mine(),
      rewardsApi.list(),
    ])

    if (orderPayload.status === 'fulfilled') orders.value = normalizeList(orderPayload.value)
    if (warrantyPayload.status === 'fulfilled') warranties.value = warrantyPayload.value
    if (memberPayload.status === 'fulfilled') membership.value = normalizeMembership(memberPayload.value)
    if (newsPayload.status === 'fulfilled') news.value = newsPayload.value.slice(0, 4)
    if (productPayload.status === 'fulfilled') products.value = productPayload.value.data.slice(0, 6)
    if (servicePayload.status === 'fulfilled') services.value = servicePayload.value.slice(0, 4)
    if (vehiclePayload.status === 'fulfilled') vehicles.value = vehiclePayload.value
    if (videoPayload.status === 'fulfilled') videos.value = extractVideos(videoPayload.value)
    if (couponPayload.status === 'fulfilled') coupons.value = unwrapList<Coupon>(couponPayload.value).map(normalizeCoupon)
    if (rewardPayload.status === 'fulfilled') rewards.value = unwrapList<Reward>(rewardPayload.value).map(normalizeReward).filter((reward) => reward.isActive !== false)

    await realtime.refreshNotifications()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '首頁資料載入失敗'
  } finally {
    loading.value = false
  }
}

watch(
  () => banners.value.length,
  () => {
    activeBanner.value = 0
  },
)

onMounted(() => {
  void load()
  bannerTimer = window.setInterval(nextBanner, 5600)
})

onBeforeUnmount(() => {
  if (bannerTimer) window.clearInterval(bannerTimer)
})
</script>

<template>
  <div class="space-y-8">
    <Transition name="banner-fade" mode="out-in">
    <section
      v-if="currentBanner"
      :key="currentBanner.id"
      class="relative overflow-hidden rounded-[2rem] border border-white/10 bg-panel shadow-premium"
    >
      <div class="absolute inset-0 bg-gradient-to-br" :class="currentBanner.tone" />
      <img
        :src="currentBanner.assetImage"
        :alt="currentBanner.title"
        class="hero-image-motion absolute inset-0 h-full w-full scale-[1.01] object-cover opacity-95"
      />
      <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,15,28,.76),rgba(8,15,28,.34)_38%,rgba(8,15,28,.06)_70%,rgba(8,15,28,.02))]" />
      <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/70 to-transparent" />

      <div class="relative grid min-h-[420px] gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_360px] lg:items-end">
        <div class="max-w-4xl rounded-[1.5rem] border border-white/10 bg-ink/36 p-5 pb-6 shadow-[0_18px_55px_rgba(0,0,0,.28)] backdrop-blur-md sm:p-7">
          <p class="inline-flex rounded-full border border-amber-200/25 bg-amber-300/12 px-4 py-1.5 text-xs font-black tracking-[0.22em] text-amber-100 backdrop-blur-xl">
            {{ currentBanner.tag }}
          </p>

          <h1 class="mt-6 max-w-4xl text-4xl font-black leading-tight text-[#f6efe2] [text-shadow:0_4px_24px_rgba(0,0,0,.55)] sm:text-6xl">
            {{ currentBanner.title }}
          </h1>

          <p class="mt-5 line-clamp-3 max-w-2xl text-base leading-8 text-slate-200 [text-shadow:0_2px_14px_rgba(0,0,0,.5)] sm:text-lg">
            {{ currentBanner.subtitle }}
          </p>

          <div class="mt-7 flex flex-wrap items-center gap-3">
            <RouterLink class="btn-primary shadow-lg shadow-amber-400/20" :to="currentBanner.to">
              {{ currentBanner.cta }}
            </RouterLink>
            <RouterLink class="btn-secondary backdrop-blur-xl" to="/qr">
              開啟 QR 會員碼
            </RouterLink>
          </div>
        </div>

        <div class="mb-10 rounded-[1.5rem] border border-white/10 bg-ink/44 p-4 shadow-[0_16px_50px_rgba(0,0,0,.28)] backdrop-blur-2xl">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <p class="text-xs font-bold tracking-[0.18em] text-amber-100">MEMBER STATUS</p>
              <p class="mt-1 text-lg font-black text-slate-100">會員即時狀態</p>
            </div>
            <Sparkles class="h-5 w-5 text-amber-200" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <KpiCard label="會員點數" :value="points" :icon="Gift" tone="gold" />
            <KpiCard label="會員等級" :value="currentTier?.name ?? '一般會員'" :icon="Sparkles" tone="blue" />
            <KpiCard label="可用優惠券" :value="coupons.length" :icon="Ticket" tone="rose" />
            <KpiCard label="進行中訂單" :value="pendingOrders.length" :icon="Package" tone="green" />
          </div>
        </div>
      </div>

      <div class="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-4">
        <div class="flex gap-2">
          <button
            v-for="(_, index) in banners"
            :key="index"
            class="h-2.5 rounded-full transition-all"
            :class="index === activeBanner ? 'w-10 scale-105 bg-gradient-to-r from-amber-400 to-yellow-500 shadow-lg shadow-amber-400/30' : 'w-2.5 bg-white/70 hover:bg-white'"
            type="button"
            @click="activeBanner = index"
          />
        </div>

        <div class="flex gap-2">
          <button class="btn-secondary h-10 w-10 px-0 backdrop-blur-xl" type="button" @click="previousBanner">
            <ChevronLeft class="h-4 w-4" />
          </button>
          <button class="btn-secondary h-10 w-10 px-0 backdrop-blur-xl" type="button" @click="nextBanner">
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
    </Transition>

    <section v-reveal class="relative overflow-hidden rounded-[2rem] border border-line bg-[radial-gradient(circle_at_20%_10%,rgba(210,164,90,.18),transparent_32%),linear-gradient(135deg,rgba(19,32,51,.94),rgba(18,37,59,.88)_52%,rgba(16,27,44,.94))] p-5 shadow-premium sm:p-8">
      <div class="absolute right-8 top-8 hidden h-56 w-56 rounded-full bg-sky-400/10 blur-3xl lg:block" />

      <div class="relative grid gap-8 xl:grid-cols-[1.2fr_.8fr] xl:items-end">
        <div>
          <p class="inline-flex rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-100">
            DOKER 會員服務中心
          </p>

          <h1 class="mt-5 max-w-4xl text-3xl font-black leading-tight text-slate-100 sm:text-5xl">
            {{ auth.user?.name ?? '會員' }}，歡迎回到你的機車保固與服務入口。
          </h1>

          <p class="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            從商品選購、安裝訂單、保固狀態到會員點數，所有重要進度都同步後端資料，讓你像行動 App 一樣快速完成下一步。
          </p>

          <div class="mt-6 flex flex-wrap gap-3">
            <RouterLink class="btn-primary" to="/catalog">前往商城</RouterLink>
            <RouterLink class="btn-secondary" to="/qr">開啟 QR 會員碼</RouterLink>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <KpiCard label="會員點數" :value="points" :icon="Gift" tone="gold" />
          <KpiCard label="生效保固" :value="activeWarranties.length" :icon="ShieldCheck" tone="green" />
          <KpiCard label="進行中訂單" :value="pendingOrders.length" :icon="Package" tone="blue" />
          <KpiCard label="未讀通知" :value="realtime.unread" :icon="Bell" tone="rose" />
        </div>
      </div>
    </section>

    <PageState :loading="loading" :error="error" :empty="false">
      <div class="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <SectionCard v-reveal title="快速入口" subtitle="依照行動 App 首頁邏輯整理最常用的會員動作。">
          <div class="stagger-children grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <RouterLink
              v-for="item in quickActions"
              :key="item.to"
              :to="item.to"
              class="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
            >
              <div class="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br" :class="item.tone">
                <component :is="item.icon" class="h-5 w-5 text-white" />
              </div>
              <p class="font-bold text-white">{{ item.label }}</p>
              <p class="mt-1 text-sm text-slate-400">{{ item.desc }}</p>
            </RouterLink>
          </div>
        </SectionCard>

        <SectionCard v-reveal title="保固生命週期" subtitle="依據訂單完成與保固啟用狀態呈現。">
          <TimelineRail
            :steps="[
              { key: 'order', label: '建立安裝或商品訂單', state: orders.length ? 'completed' : 'pending' },
              { key: 'fulfill', label: '門市處理與配送完成', state: completedOrders.length ? 'completed' : pendingOrders.length ? 'current' : 'pending' },
              { key: 'warranty', label: '保固正式生效', state: activeWarranties.length ? 'current' : 'pending' },
            ]"
          />
        </SectionCard>
      </div>

      <div class="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <SectionCard v-reveal title="最新訂單" subtitle="同步訂單狀態、履約流程與付款總額。">
          <div v-if="orders.length" class="space-y-3">
            <RouterLink v-for="order in orders.slice(0, 4)" :key="order.id" :to="`/orders/${order.id}`" class="glass-card block">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="font-bold text-white">{{ order.requestId ?? order.id }}</p>
                  <p class="mt-1 text-sm text-slate-400">{{ getOrderTimelineCurrentLabel(order) }} · {{ dateTime(order.createdAt) }}</p>
                </div>

                <div class="text-right">
                  <StatusBadge :value="order.status" />
                  <p class="mt-2 font-black text-accent">{{ money(order.totalAmount) }}</p>
                </div>
              </div>
            </RouterLink>
          </div>

          <p v-else class="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-slate-400">
            尚未有訂單，前往商城選購可保固商品或安裝服務。
          </p>
        </SectionCard>

        <SectionCard v-reveal title="推薦商品與服務" subtitle="使用後端商品、分類、庫存與保固欄位呈現。">
          <div v-if="products.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <RouterLink
              v-for="product in products"
              :key="product.id"
              :to="`/products/${product.id}`"
              class="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:border-amber-200/25"
            >
              <img :src="product.images?.[0]?.url ?? '/placeholder-product.svg'" :alt="product.name" class="h-36 w-full bg-slate-950 object-cover" />
              <div class="p-4">
                <p class="text-xs text-slate-500">{{ product.category?.name ?? product.sku ?? '精選商品' }}</p>
                <p class="mt-1 line-clamp-2 font-bold text-white">{{ product.name }}</p>
                <p class="mt-3 font-black text-accent">{{ money(product.price) }}</p>
              </div>
            </RouterLink>
          </div>

          <p v-else class="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-slate-400">
            目前沒有可顯示的商品。
          </p>
        </SectionCard>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <SectionCard title="最新公告" subtitle="對應行動 App 首頁的最新公告區塊。">
          <div v-if="news.length" class="grid gap-4 lg:grid-cols-2">
            <RouterLink
              v-for="item in news"
              :key="item.id"
              :to="`/news?id=${item.id}`"
              class="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-amber-200/25"
            >
              <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title" class="h-36 w-full object-cover" />
              <div class="p-4">
                <p class="text-xs font-bold text-accent">{{ statusLabel(item.type) }} · {{ dateTime(item.createdAt) }}</p>
                <p class="mt-2 font-bold text-white">{{ item.title }}</p>
                <p class="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{{ item.content }}</p>
                <p class="mt-3 text-sm font-semibold text-amber-100">閱讀更多</p>
              </div>
            </RouterLink>
          </div>

          <p v-else class="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">
            目前沒有公告，有新消息時將顯示於此。
          </p>
        </SectionCard>

        <SectionCard title="最新影片" subtitle="對應行動 App 的 YouTube 區塊，使用後端 YouTube API。">
          <div v-if="videos.length" class="space-y-3">
            <a
              v-for="video in videos"
              :key="video.id"
              :href="`https://www.youtube.com/watch?v=${video.id}`"
              target="_blank"
              rel="noreferrer"
              class="group grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-red-300/25 sm:grid-cols-[140px_1fr]"
            >
              <img v-if="video.thumbnail" :src="video.thumbnail" :alt="video.title" class="h-24 w-full rounded-xl object-cover" />
              <div class="flex min-w-0 flex-col justify-center">
                <p class="line-clamp-2 font-bold text-white">{{ video.title }}</p>
                <p class="mt-2 text-sm text-slate-400">{{ video.viewCount ? `${video.viewCount} 次觀看` : 'DOKER 官方影片' }}</p>
                <p class="mt-2 text-sm font-semibold text-red-200">在 YouTube 開啟</p>
              </div>
            </a>
          </div>

          <p v-else class="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-slate-400">
            目前無法取得最新影片，請稍後再試。
          </p>
        </SectionCard>
      </div>

      <section v-reveal class="relative overflow-hidden rounded-[2rem] border border-orange-300/20 bg-[radial-gradient(circle_at_12%_0%,rgba(238,114,45,.18),transparent_30%),linear-gradient(135deg,rgba(19,32,51,.92),rgba(18,37,59,.82))] p-5 shadow-premium sm:p-7">
        <div class="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div class="flex items-start gap-4">
            <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-orange-300/25 bg-orange-400/12 text-orange-200">
              <ShoppingCart class="h-7 w-7" />
            </div>
            <div>
              <p class="label text-orange-200">官方購物平台</p>
              <h2 class="mt-2 text-2xl font-black text-slate-100">官方蝦皮商城</h2>
              <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                偏好蝦皮結帳、物流或平台優惠時，可前往 DOKER 官方蝦皮商城查看更多商品並線上快速下單。
              </p>
              <div v-if="products.length" class="mt-4 flex flex-wrap gap-2">
                <span v-for="product in products.slice(0, 3)" :key="product.id" class="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
                  {{ product.name }}
                </span>
              </div>
            </div>
          </div>
          <a class="btn-primary" :href="externalLinks.shopee.href" target="_blank" rel="noreferrer">
            前往蝦皮商城
          </a>
        </div>
      </section>

      <SectionCard v-reveal title="聯絡我們" subtitle="保留行動 App 首頁的地圖、電話、LINE 與 YouTube 快捷入口。">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a
            v-for="contact in contacts"
            :key="contact.label"
            :href="contact.href"
            target="_blank"
            rel="noreferrer"
            class="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-1 hover:border-amber-200/25"
          >
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-amber-300/10 text-amber-100">
              <component :is="contact.icon" class="h-5 w-5" />
            </span>
            <span class="font-bold text-white">{{ contact.label }}</span>
          </a>
        </div>
      </SectionCard>
    </PageState>
  </div>
</template>
