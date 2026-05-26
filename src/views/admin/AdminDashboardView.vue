<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  ClipboardList,
  CreditCard,
  Gift,
  MessageCircle,
  Newspaper,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-vue-next'
import { chatApi, ordersApi, paymentsApi, pointsApi, productsApi, usersApi, warrantiesApi } from '@/api'
import AdminTable from '@/components/admin/AdminTable.vue'
import KpiCard from '@/components/KpiCard.vue'
import PageState from '@/components/PageState.vue'
import SectionCard from '@/components/SectionCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { dateTime, money, normalizeList } from '@/utils/format'
import { statusLabel } from '@/utils/status'
import type { ApiRecord, Order, Payment, Product, User, Warranty } from '@/types/backend'

const orders = ref<Order[]>([])
const customers = ref<User[]>([])
const payments = ref<Payment[]>([])
const products = ref<Product[]>([])
const warranties = ref<Warranty[]>([])
const warrantyDashboard = ref<ApiRecord | null>(null)
const points = ref<ApiRecord | null>(null)
const supportUsers = ref<ApiRecord[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const pipelineStatuses = ['PENDING', 'CONFIRMED', 'PAID', 'PROCESSING', 'COMPLETED'] as const

const paidRevenue = computed(() =>
  payments.value
    .filter((payment) => payment.status === 'PAID')
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
)

const pendingOrders = computed(() => orders.value.filter((order) => order.status === 'PENDING'))
const activeWarranties = computed(() => warranties.value.filter((warranty) => warranty.status === 'ACTIVE'))
const pendingWarranties = computed(() => warranties.value.filter((warranty) => warranty.status === 'PENDING'))
const expiredWarranties = computed(() => warranties.value.filter((warranty) => warranty.status === 'EXPIRED'))
const lowStockProducts = computed(() => products.value.filter((product) => Number(product.stock ?? 0) <= 3).slice(0, 5))

const pipeline = computed(() => {
  const max = Math.max(...pipelineStatuses.map((status) => orders.value.filter((order) => order.status === status).length), 1)
  return pipelineStatuses.map((status) => {
    const count = orders.value.filter((order) => order.status === status).length
    return { status, label: statusLabel(status), count, width: `${Math.max(8, (count / max) * 100)}%` }
  })
})

const topItems = computed(() => {
  const map = new Map<string, { name: string; quantity: number; revenue: number }>()
  orders.value.forEach((order) => {
    order.items?.forEach((item) => {
      const current = map.get(item.name) ?? { name: item.name, quantity: 0, revenue: 0 }
      current.quantity += Number(item.quantity ?? 0)
      current.revenue += Number(item.totalPrice ?? 0)
      map.set(item.name, current)
    })
  })
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
})

const todayLabel = computed(() => new Intl.DateTimeFormat('zh-TW', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date()))

const dashboardMetric = (key: string, fallback: number): number => {
  const value = warrantyDashboard.value?.[key]
  return typeof value === 'number' ? value : fallback
}

const extractSupportUsers = (payload: ApiRecord): ApiRecord[] => {
  const data = payload.data
  return Array.isArray(data) ? data.filter((item): item is ApiRecord => Boolean(item) && typeof item === 'object') : []
}

const load = async (): Promise<void> => {
  loading.value = true
  error.value = null
  try {
    const [orderPayload, customerPayload, paymentPayload, warrantyPayload, warrantyListPayload, pointPayload, productPayload, chatPayload] = await Promise.allSettled([
      ordersApi.list({ limit: 100 }),
      usersApi.customers({ limit: 100 }),
      paymentsApi.adminList({ limit: 100 }),
      warrantiesApi.dashboard(),
      warrantiesApi.adminList(),
      pointsApi.adminSummary(),
      productsApi.adminList({ limit: 100 }),
      chatApi.users(1),
    ])

    if (orderPayload.status === 'fulfilled') orders.value = normalizeList(orderPayload.value)
    if (customerPayload.status === 'fulfilled') customers.value = customerPayload.value.data
    if (paymentPayload.status === 'fulfilled') payments.value = paymentPayload.value.data
    if (warrantyPayload.status === 'fulfilled') warrantyDashboard.value = warrantyPayload.value
    if (warrantyListPayload.status === 'fulfilled') warranties.value = warrantyListPayload.value
    if (pointPayload.status === 'fulfilled') points.value = pointPayload.value
    if (productPayload.status === 'fulfilled') products.value = productPayload.value.data
    if (chatPayload.status === 'fulfilled') supportUsers.value = extractSupportUsers(chatPayload.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '營運資料載入失敗'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <section v-reveal class="relative overflow-hidden rounded-[2rem] border border-line bg-[radial-gradient(circle_at_12%_0%,rgba(210,164,90,.20),transparent_34%),linear-gradient(135deg,rgba(19,32,51,.95),rgba(18,37,59,.88)_58%,rgba(16,27,44,.96))] p-6 shadow-premium">
      <div class="absolute right-8 top-8 hidden h-44 w-44 rounded-full bg-sky-300/10 blur-3xl lg:block" />
      <div class="relative grid gap-6 xl:grid-cols-[1.2fr_.8fr] xl:items-end">
        <div>
          <p class="inline-flex rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-1.5 text-xs font-black tracking-[0.18em] text-amber-100">
            EXECUTIVE OPERATIONS
          </p>
          <h1 class="mt-4 max-w-4xl text-4xl font-black leading-tight text-ink sm:text-5xl">
            {{ todayLabel }}營運總覽
          </h1>
          <p class="mt-4 max-w-3xl text-base leading-7 text-slate-500">
            彙整訂單、付款、保固、會員、商品庫存與客服入口，使用後端清單資料進行即時營運聚合。
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <RouterLink class="btn-primary" to="/admin/orders">
              <ClipboardList class="h-4 w-4" />
              處理訂單
            </RouterLink>
            <RouterLink class="btn-secondary" to="/admin/commerce">
              <ShoppingBag class="h-4 w-4" />
              商品與服務
            </RouterLink>
            <RouterLink class="btn-secondary" to="/admin/engagement">
              <Gift class="h-4 w-4" />
              優惠券管理
            </RouterLink>
          </div>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <KpiCard label="已付款營收" :value="money(paidRevenue)" :icon="CreditCard" tone="gold" />
          <KpiCard label="待處理訂單" :value="pendingOrders.length" :icon="Bell" tone="rose" />
        </div>
      </div>
    </section>

    <PageState :loading="loading" :error="error" @retry="load">
      <div class="stagger-children grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="營收" :value="money(paidRevenue)" :icon="BarChart3" tone="gold" />
        <KpiCard label="訂單" :value="orders.length" :icon="Package" tone="blue" />
        <KpiCard label="待處理" :value="pendingOrders.length" :icon="AlertTriangle" tone="rose" />
        <KpiCard label="生效保固" :value="dashboardMetric('active', activeWarranties.length)" :icon="ShieldCheck" tone="green" />
        <KpiCard label="會員" :value="customers.length" :icon="Users" tone="slate" />
        <KpiCard label="客服用戶" :value="supportUsers.length" :icon="MessageCircle" tone="blue" />
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <SectionCard v-reveal title="營運管線" subtitle="依據真實訂單狀態從待處理到完成聚合。">
          <div class="space-y-4">
            <div v-for="item in pipeline" :key="item.status" class="rounded-xl border border-line bg-white/[0.07] p-4">
              <div class="mb-2 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <StatusBadge :value="item.status" />
                  <span class="text-sm font-semibold text-ink">{{ item.label }}</span>
                </div>
                <span class="text-lg font-black text-ink">{{ item.count }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                <div class="progress-animate h-full rounded-full bg-gradient-to-r from-sky-300 to-amber-400" :style="{ width: item.width }" />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard v-reveal title="保固健康度" subtitle="以保固清單與儀表板端點共同呈現。">
          <div class="grid gap-3">
            <div class="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4">
              <p class="text-sm font-semibold text-emerald-200">生效中</p>
              <p class="mt-2 text-3xl font-black text-ink">{{ dashboardMetric('active', activeWarranties.length) }}</p>
            </div>
            <div class="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4">
              <p class="text-sm font-semibold text-amber-100">待啟用 / 待建立</p>
              <p class="mt-2 text-3xl font-black text-ink">{{ dashboardMetric('pending', pendingWarranties.length) }}</p>
            </div>
            <div class="rounded-xl border border-slate-300/15 bg-white/[0.06] p-4">
              <p class="text-sm font-semibold text-slate-300">已過期</p>
              <p class="mt-2 text-3xl font-black text-ink">{{ dashboardMetric('expired', expiredWarranties.length) }}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <SectionCard v-reveal title="近期訂單" subtitle="最新訂單、會員、付款與履約狀態。">
          <AdminTable :columns="['單號', '會員', '狀態', '履約', '金額', '建立時間']">
            <tr v-for="order in orders.slice(0, 8)" :key="order.id" class="table-row">
              <td class="px-4 py-3 font-semibold text-ink">{{ order.requestId ?? order.id }}</td>
              <td class="px-4 py-3 text-sm text-slate-500">{{ order.user?.name ?? order.recipientName ?? order.userId }}</td>
              <td class="px-4 py-3"><StatusBadge :value="order.status" /></td>
              <td class="px-4 py-3"><StatusBadge :value="order.fulfillmentStatus" /></td>
              <td class="px-4 py-3 font-bold text-ink">{{ money(order.totalAmount) }}</td>
              <td class="px-4 py-3 text-sm text-slate-500">{{ dateTime(order.createdAt) }}</td>
            </tr>
          </AdminTable>
          <p v-if="!orders.length" class="mt-3 rounded-xl border border-dashed border-line bg-white/60 p-5 text-center text-sm text-slate-500">
            目前沒有訂單資料。
          </p>
        </SectionCard>

        <SectionCard v-reveal title="營運提醒" subtitle="需要優先處理的訂單、庫存與保固狀態。">
          <div class="stagger-children space-y-3">
            <RouterLink class="hover-lift block rounded-xl border border-rose-300/20 bg-rose-300/10 p-4" to="/admin/orders">
              <div class="flex items-center gap-3">
                <AlertTriangle class="h-5 w-5 text-rose-300" />
                <p class="font-bold text-ink">待處理訂單 {{ pendingOrders.length }} 筆</p>
              </div>
              <p class="mt-2 text-sm text-slate-500">需要確認付款、履約或下一步作業。</p>
            </RouterLink>
            <RouterLink class="hover-lift block rounded-xl border border-amber-300/20 bg-amber-300/10 p-4" to="/admin/commerce">
              <div class="flex items-center gap-3">
                <Package class="h-5 w-5 text-amber-200" />
                <p class="font-bold text-ink">低庫存商品 {{ lowStockProducts.length }} 項</p>
              </div>
              <p class="mt-2 text-sm text-slate-500">{{ lowStockProducts[0]?.name ?? '目前沒有低庫存警示。' }}</p>
            </RouterLink>
            <RouterLink class="hover-lift block rounded-xl border border-slate-300/15 bg-white/[0.07] p-4" to="/admin/warranties">
              <div class="flex items-center gap-3">
                <ShieldCheck class="h-5 w-5 text-sky-300" />
                <p class="font-bold text-ink">已過期保固 {{ expiredWarranties.length }} 張</p>
              </div>
              <p class="mt-2 text-sm text-slate-500">可至保固管理檢視生命週期與服務紀錄。</p>
            </RouterLink>
          </div>
        </SectionCard>
      </div>

      <div class="grid gap-6 xl:grid-cols-3">
        <SectionCard v-reveal title="熱門服務 / 商品" subtitle="由訂單品項彙總，無獨立 analytics 端點時使用前端聚合。">
          <div v-if="topItems.length" class="space-y-3">
            <div v-for="item in topItems" :key="item.name" class="rounded-xl border border-line bg-white/[0.07] p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-bold text-ink">{{ item.name }}</p>
                  <p class="mt-1 text-sm text-slate-500">數量 {{ item.quantity }}</p>
                </div>
                <p class="font-black text-accent">{{ money(item.revenue) }}</p>
              </div>
            </div>
          </div>
          <p v-else class="rounded-xl border border-dashed border-line bg-white/60 p-5 text-sm text-slate-500">尚無足夠訂單品項可彙總。</p>
        </SectionCard>

        <SectionCard v-reveal title="低庫存商品" subtitle="使用商品管理清單的庫存欄位。">
          <div v-if="lowStockProducts.length" class="space-y-3">
            <div v-for="product in lowStockProducts" :key="product.id" class="rounded-xl border border-line bg-white/[0.07] p-4">
              <p class="font-bold text-ink">{{ product.name }}</p>
              <p class="mt-1 text-sm text-slate-500">庫存 {{ product.stock }} · {{ money(product.price) }}</p>
            </div>
          </div>
          <p v-else class="rounded-xl border border-dashed border-line bg-white/60 p-5 text-sm text-slate-500">目前沒有低庫存商品。</p>
        </SectionCard>

        <SectionCard v-reveal title="管理捷徑" subtitle="進入常用後台工作區。">
          <div class="grid gap-3">
            <RouterLink class="btn-secondary justify-start" to="/admin/commerce"><Plus class="h-4 w-4" />建立商品</RouterLink>
            <RouterLink class="btn-secondary justify-start" to="/admin/commerce"><Wrench class="h-4 w-4" />建立服務</RouterLink>
            <RouterLink class="btn-secondary justify-start" to="/admin/content"><Newspaper class="h-4 w-4" />發布公告</RouterLink>
            <RouterLink class="btn-secondary justify-start" to="/admin/engagement"><Gift class="h-4 w-4" />管理優惠券</RouterLink>
            <RouterLink class="btn-secondary justify-start" to="/admin/warranties"><Sparkles class="h-4 w-4" />檢視保固紀錄</RouterLink>
          </div>
        </SectionCard>
      </div>

      <SectionCard v-reveal title="付款與點數摘要" subtitle="使用付款管理與點數摘要端點。">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-xl border border-line bg-white/[0.07] p-4">
            <p class="text-sm font-semibold text-slate-500">付款筆數</p>
            <p class="mt-2 text-3xl font-black text-ink">{{ payments.length }}</p>
          </div>
          <div class="rounded-xl border border-line bg-white/[0.07] p-4">
            <p class="text-sm font-semibold text-slate-500">已付款金額</p>
            <p class="mt-2 text-3xl font-black text-ink">{{ money(paidRevenue) }}</p>
          </div>
          <div class="rounded-xl border border-line bg-white/[0.07] p-4">
            <p class="text-sm font-semibold text-slate-500">已發點數</p>
            <p class="mt-2 text-3xl font-black text-ink">{{ money(points?.totalEarned ?? points?.totalPoints ?? 0) }}</p>
          </div>
        </div>
      </SectionCard>
    </PageState>
  </div>
</template>
