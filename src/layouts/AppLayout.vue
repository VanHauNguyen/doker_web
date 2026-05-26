<script setup lang="ts">
import {
  Bell,
  Boxes,
  Car,
  ChevronRight,
  Home,
  Gauge,
  Gift,
  LogOut,
  MessageCircle,
  Newspaper,
  Package,
  QrCode,
  ShieldCheck,
  ShoppingCart,
  UserRound,
  Wrench,
} from 'lucide-vue-next'
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useRealtimeStore } from '@/stores/realtime'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const realtime = useRealtimeStore()

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

const isActive = (path: string): boolean => route.path === path || route.path.startsWith(`${path}/`)

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
  <div class="min-h-screen">
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-line bg-ink/72 p-4 shadow-[12px_0_55px_rgba(0,0,0,.26)] backdrop-blur-2xl xl:block">
      <div class="mb-6 rounded-2xl border border-line bg-gradient-to-br from-white/[0.11] to-white/[0.045] p-4 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="grid h-11 w-11 place-items-center rounded-xl bg-accent text-lg font-black text-white shadow-lg shadow-amber-500/20">D</div>
          <div>
            <p class="text-sm font-black text-ink">DOKER</p>
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
          <div class="min-w-0">
            <div class="mb-1 flex items-center gap-2 text-xs text-slate-500">
              <RouterLink class="hover:text-accent" to="/">DOKER</RouterLink>
              <ChevronRight class="h-3 w-3" />
              <span>{{ route.path.split('/').filter(Boolean)[0] ?? '首頁' }}</span>
            </div>
            <p class="truncate text-sm font-semibold text-slate-100">{{ auth.user?.name ?? 'DOKER' }}</p>
            <p class="truncate text-xs text-slate-500">{{ auth.user ? `${auth.user.email} · ${auth.user.role === 'ADMIN' ? '後台管理員' : '一般會員'}` : '公開瀏覽' }}</p>
          </div>
          <div class="flex items-center gap-2">
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
        <nav class="mt-3 flex gap-2 overflow-x-auto xl:hidden">
          <RouterLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="flex shrink-0 items-center gap-2 rounded-md border border-line bg-white/[0.065] px-3 py-2 text-xs text-slate-400"
            :class="{ 'bg-amber-300/15 text-slate-100': isActive(item.to) }"
          >
            <component :is="item.icon" class="h-4 w-4" />
            {{ item.label }}
          </RouterLink>
        </nav>
      </header>

      <main class="mx-auto max-w-[1500px] px-4 py-8 sm:px-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
