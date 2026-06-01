<script setup lang="ts">
import {
  Bell,
  Boxes,
  Car,
  ChevronRight,
  ExternalLink,
  Home,
  Gauge,
  Gift,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Newspaper,
  Package,
  Phone,
  QrCode,
  ShieldCheck,
  ShoppingCart,
  UserRound,
  Wrench,
  X,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useRealtimeStore } from '@/stores/realtime'
import { externalLinks } from '@/config/externalLinks'
import shopeeLogo from '@/assets/brands/shopee.svg'
import youtubeLogo from '@/assets/brands/youtube.svg'
import lineLogo from '@/assets/brands/line.svg'
import facebookLogo from '@/assets/brands/facebook.svg'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const realtime = useRealtimeStore()
const mobileMenuOpen = ref(false)

const customerNav = [
  { to: '/home', label: '首頁', icon: Home },
  { to: '/dashboard', label: '會員總覽', icon: Gauge },
  { to: '/catalog', label: '商品商城', icon: Boxes },
  { to: '/cart', label: '購物車', icon: ShoppingCart },
  { to: '/orders', label: '訂單', icon: Package },
  { to: '/warranties', label: '保固', icon: ShieldCheck },
  { to: '/vehicles', label: '愛車資料', icon: Car },
  { to: '/membership', label: '會員點數', icon: Gift },
  { to: '/chat', label: '客服聊天室', icon: MessageCircle },
  { to: '/qr', label: 'QR', icon: QrCode },
  { to: '/news', label: '最新消息', icon: Newspaper },
]

const adminNav = [
  { to: '/admin/dashboard', label: '營運總覽', icon: Gauge },
  { to: '/admin/orders', label: '訂單管理', icon: Package },
  { to: '/admin/commerce', label: '商品管理', icon: Boxes },
  { to: '/admin/warranties', label: '保固管理', icon: ShieldCheck },
  { to: '/admin/customers', label: '會員管理', icon: UserRound },
  { to: '/admin/engagement', label: '點數優惠', icon: Gift },
  { to: '/admin/content', label: '新聞推播', icon: Newspaper },
  { to: '/services', label: '服務項目', icon: Wrench },
  { to: '/chat', label: '客服聊天室', icon: MessageCircle },
  { to: '/qr', label: 'QR 掃描', icon: QrCode },
]

const publicNav = [
  { to: '/catalog', label: '商品商城', icon: Boxes },
  { to: '/news', label: '最新消息', icon: Newspaper },
]

const nav = computed(() => {
  if (auth.isAdmin) return adminNav
  if (auth.isAuthenticated) return customerNav
  return publicNav
})

const showBrandFooter = computed(() => route.meta.showBrandFooter === true)

const platformCards = [
  {
    title: '官方蝦皮商城',
    subtitle: '線上快速下單，查看更多保固商品與安裝服務',
    button: '前往蝦皮商城',
    href: externalLinks.shopee.href,
    logo: shopeeLogo,
    accent: 'border-orange-300/25 bg-orange-400/10 hover:border-orange-300/40',
  },
  {
    title: 'LINE 官方客服',
    subtitle: '訂單、保固與安裝問題都可以快速諮詢',
    button: '加入 LINE',
    href: externalLinks.line.href,
    logo: lineLogo,
    accent: 'border-emerald-300/25 bg-emerald-400/10 hover:border-emerald-300/40',
  },
  {
    title: 'DOKER 官方 YouTube',
    subtitle: '查看施工案例、產品介紹與保養知識',
    button: '前往 YouTube',
    href: externalLinks.youtube.href,
    logo: youtubeLogo,
    accent: 'border-rose-300/25 bg-rose-400/10 hover:border-rose-300/40',
  },
  {
    title: 'Facebook 官方',
    subtitle: '追蹤最新活動、案例分享與品牌消息',
    button: '前往 Facebook',
    href: externalLinks.facebook.href,
    logo: facebookLogo,
    accent: 'border-sky-300/25 bg-sky-400/10 hover:border-sky-300/40',
  },
]

const isActive = (path: string): boolean => route.path === path || route.path.startsWith(`${path}/`)

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
  },
)

const signOut = async (): Promise<void> => {
  realtime.disconnect()
  await auth.logout()
  await router.push('/auth/login')
}

onMounted(async () => {
  if (!auth.isAuthenticated) return
  if (!auth.isAdmin) await Promise.allSettled([cart.refresh()])
  await realtime.refreshNotifications()
  realtime.connect()
})
</script>

<template>
  <div class="min-h-screen overflow-x-hidden">
    <div class="app-ambient" aria-hidden="true" />
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-line bg-ink/72 p-4 shadow-[12px_0_55px_rgba(0,0,0,.26)] backdrop-blur-2xl xl:block">
      <div class="premium-panel mb-6 rounded-2xl bg-gradient-to-br from-white/[0.11] to-white/[0.045] p-4">
        <div class="flex items-center gap-3">
          <div class="grid h-11 w-11 place-items-center rounded-xl bg-accent text-lg font-black text-ink shadow-lg shadow-amber-500/20">D</div>
          <div>
            <p class="gradient-title text-sm font-black">DOKER</p>
            <p class="text-xs text-slate-400">保固服務平台</p>
          </div>
        </div>
      </div>
      <nav class="space-y-1">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.075] hover:text-slate-100"
          :class="{ 'border border-amber-300/25 bg-gradient-to-r from-amber-300/18 to-white/[0.06] text-slate-100 shadow-md shadow-black/20': isActive(item.to) }"
        >
          <span class="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.075] text-accent ring-1 ring-amber-200/15 group-hover:bg-white/[0.12]">
            <component :is="item.icon" class="h-4 w-4" />
          </span>
          <span>{{ item.label }}</span>
          <ChevronRight v-if="isActive(item.to)" class="ml-auto h-4 w-4 text-accent" />
        </RouterLink>
      </nav>
    </aside>

    <div class="xl:pl-72">
      <header class="sticky top-0 z-20 border-b border-line bg-ink/68 px-4 py-3 shadow-sm backdrop-blur-2xl sm:px-6">
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <button class="btn-secondary h-10 w-10 shrink-0 px-0 xl:hidden" type="button" aria-label="開啟選單" @click="mobileMenuOpen = true">
              <Menu class="h-4 w-4" />
            </button>
            <div class="min-w-0">
            <div class="mb-1 flex items-center gap-2 text-xs text-slate-500">
              <RouterLink class="font-bold hover:text-accent" to="/">DOKER</RouterLink>
              <ChevronRight class="h-3 w-3" />
              <span class="truncate">{{ route.path.split('/').filter(Boolean)[0] ?? '首頁' }}</span>
            </div>
            <p class="truncate text-sm font-semibold text-slate-100">{{ auth.user?.name ?? 'DOKER' }}</p>
            <p class="truncate text-xs text-slate-500">{{ auth.user ? `${auth.user.email} · ${auth.user.role === 'ADMIN' ? '後台管理員' : '一般會員'}` : '公開瀏覽' }}</p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <RouterLink v-if="auth.isAuthenticated" to="/notifications" class="btn-secondary relative h-10 w-10 px-0" title="通知中心">
              <Bell class="h-4 w-4" />
              <span v-if="realtime.unread" class="absolute -right-1 -top-1 rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                {{ realtime.unread }}
              </span>
            </RouterLink>
            <RouterLink v-if="auth.isAuthenticated && !auth.isAdmin" to="/cart" class="btn-secondary relative h-10 w-10 px-0" title="購物車">
              <ShoppingCart class="h-4 w-4" />
              <span v-if="cart.count" class="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 text-[10px] font-bold text-ink">
                {{ cart.count }}
              </span>
            </RouterLink>
            <RouterLink v-if="auth.isAuthenticated" to="/profile" class="btn-secondary h-10 w-10 px-0" title="個人資料">
              <UserRound class="h-4 w-4" />
            </RouterLink>
            <RouterLink v-if="!auth.isAuthenticated" to="/auth/login" class="btn-secondary">登入</RouterLink>
            <button v-else class="btn-secondary h-10 w-10 px-0" title="登出" @click="signOut">
              <LogOut class="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <Teleport to="body">
        <div v-if="mobileMenuOpen" class="fixed inset-0 z-50 xl:hidden">
          <button class="absolute inset-0 bg-black/55 backdrop-blur-sm" aria-label="關閉選單" @click="mobileMenuOpen = false" />
          <aside class="surface absolute left-0 top-0 flex h-full w-[min(86vw,20rem)] max-w-full flex-col overflow-y-auto rounded-r-2xl border-y-0 border-l-0 p-4 shadow-2xl">
            <div class="mb-5 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="gradient-title text-sm font-black">DOKER</p>
                <p class="truncate text-xs text-slate-400">保固服務平台</p>
              </div>
              <button class="btn-secondary h-10 w-10 shrink-0 px-0" type="button" aria-label="關閉選單" @click="mobileMenuOpen = false">
                <X class="h-4 w-4" />
              </button>
            </div>
            <nav class="grid gap-1">
              <RouterLink
                v-for="item in nav"
                :key="item.to"
                :to="item.to"
                class="group flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.075] hover:text-slate-100"
                :class="{ 'border border-amber-300/25 bg-gradient-to-r from-amber-300/18 to-white/[0.06] text-slate-100 shadow-md shadow-black/20': isActive(item.to) }"
              >
                <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.075] text-accent ring-1 ring-amber-200/15 group-hover:bg-white/[0.12]">
                  <component :is="item.icon" class="h-4 w-4" />
                </span>
                <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
                <ChevronRight v-if="isActive(item.to)" class="h-4 w-4 shrink-0 text-accent" />
              </RouterLink>
            </nav>
          </aside>
        </div>
      </Teleport>

      <main class="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 sm:py-8">
        <RouterView v-slot="{ Component, route: activeRoute }">
          <Transition name="page-fade" mode="out-in">
            <component :is="Component" :key="activeRoute.fullPath" />
          </Transition>
        </RouterView>
      </main>

      <footer v-if="showBrandFooter" v-reveal class="mx-auto max-w-[1500px] px-3 pb-6 sm:px-6 sm:pb-8">
        <section class="relative overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_12%_0%,rgba(210,164,90,.18),transparent_32%),linear-gradient(135deg,rgba(19,32,51,.92),rgba(12,23,40,.96))] p-4 shadow-premium sm:rounded-[2rem] sm:p-7">
          <div class="absolute right-10 top-8 hidden h-40 w-40 rounded-full bg-sky-300/10 blur-3xl lg:block" />
          <div class="relative grid min-w-0 gap-6 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.55fr)_minmax(0,.65fr)]">
            <div class="rounded-2xl border border-amber-300/18 bg-white/[0.055] p-5">
              <div class="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-lg font-black text-ink shadow-lg shadow-amber-500/20">D</div>
              <p class="mt-5 text-xl font-black text-slate-100">DOKER 保固服務平台</p>
              <p class="mt-3 text-sm leading-6 text-slate-400">
                整合保固、會員、商城、客服與官方購物平台，提供高階機車服務的一站式體驗。
              </p>
              <a class="btn-primary mt-5 w-full sm:w-auto" :href="externalLinks.shopee.href" target="_blank" rel="noreferrer">
                前往蝦皮商城
                <ExternalLink class="h-4 w-4" />
              </a>
            </div>

            <div>
              <div class="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p class="label text-accent">OFFICIAL PLATFORMS</p>
                  <h2 class="mt-1 text-2xl font-black text-slate-100">官方平台連結</h2>
                </div>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <a
                  v-for="item in platformCards"
                  :key="item.href"
                  class="group rounded-2xl border p-4 transition duration-200 hover:-translate-y-1 hover:bg-white/[0.085] hover:shadow-lg hover:shadow-black/20"
                  :class="item.accent"
                  :href="item.href"
                  target="_blank"
                  rel="noreferrer"
                >
                  <div class="flex min-w-0 items-start gap-4">
                    <img :src="item.logo" :alt="item.title" class="h-12 w-12 rounded-2xl shadow-lg shadow-black/20" />
                    <div class="min-w-0 flex-1">
                      <p class="break-words font-black text-slate-100">{{ item.title }}</p>
                      <p class="mt-1 min-h-10 text-sm leading-5 text-slate-400">{{ item.subtitle }}</p>
                      <span class="mt-4 inline-flex max-w-full items-center gap-2 break-words text-sm font-bold text-accent">
                        {{ item.button }}
                        <ExternalLink class="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </div>
                  </div>
                </a>
              </div>
            </div>

            <div class="rounded-2xl border border-line bg-white/[0.055] p-5">
              <p class="label text-accent">SUPPORT</p>
              <h2 class="mt-1 text-xl font-black text-slate-100">客服資訊</h2>
              <div class="mt-5 space-y-3">
                <a class="group flex items-center gap-3 rounded-xl border border-line bg-white/[0.055] p-3 transition hover:border-amber-300/25 hover:bg-white/[0.085]" :href="externalLinks.supportPhone.href" target="_blank" rel="noreferrer">
                  <span class="grid h-10 w-10 place-items-center rounded-xl bg-amber-300/10 text-amber-100"><Phone class="h-4 w-4" /></span>
                  <span>
                    <span class="block text-sm font-bold text-slate-100">客服電話</span>
                    <span class="text-xs text-slate-400">{{ externalLinks.supportPhone.text }}</span>
                  </span>
                </a>
                <a class="group flex items-center gap-3 rounded-xl border border-line bg-white/[0.055] p-3 transition hover:border-amber-300/25 hover:bg-white/[0.085]" :href="externalLinks.map.href" target="_blank" rel="noreferrer">
                  <span class="grid h-10 w-10 place-items-center rounded-xl bg-sky-300/10 text-sky-200"><MapPin class="h-4 w-4" /></span>
                  <span>
                    <span class="block text-sm font-bold text-slate-100">門市導航</span>
                    <span class="text-xs text-slate-400">鍍客 doker 永康旗艦館</span>
                  </span>
                </a>
              </div>
            </div>
          </div>

          <div class="relative mt-6 flex flex-col gap-2 border-t border-line pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© DOKER 保固服務平台</p>
            <p>官方蝦皮商城 · LINE 官方客服 · YouTube 官方頻道</p>
          </div>
        </section>
      </footer>
    </div>
  </div>
</template>
