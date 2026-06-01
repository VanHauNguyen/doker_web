<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ordersApi } from '@/api'
import PremiumHero from '@/components/PremiumHero.vue'
import SectionCard from '@/components/SectionCard.vue'
import PageState from '@/components/PageState.vue'
import AdminDetailDrawer from '@/components/admin/AdminDetailDrawer.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import AdminToolbar from '@/components/admin/AdminToolbar.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import StatusPill from '@/components/admin/StatusPill.vue'
import { money, normalizeList } from '@/utils/format'
import { getAdminOrderActions } from '@/utils/adminOrderActions'
import type { FulfillmentStatus, Order } from '@/types/backend'

const orders = ref<Order[]>([])
const status = ref('')
const search = ref('')
const quick = ref({ serviceId: '', plate: '', name: '', phone: '', brand: '', model: '' })
const selected = ref<Order | null>(null)
const pendingAction = ref<{ order: Order; label: string; run: () => Promise<void> } | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const filteredOrders = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) return orders.value
  return orders.value.filter((order) => [
    order.requestId,
    order.id,
    order.user?.name,
    order.user?.email,
    order.recipientName,
    order.recipientPhone,
    order.vehicle?.plate,
    order.couponCode,
  ].some((value) => String(value ?? '').toLowerCase().includes(keyword)))
})

const load = async (): Promise<void> => {
  loading.value = true
  error.value = null
  try {
    orders.value = normalizeList(await ordersApi.list({ limit: 100, status: status.value || undefined }))
  } catch (err) {
    error.value = err instanceof Error ? err.message : '訂單載入失敗'
  } finally {
    loading.value = false
  }
}

const confirm = async (id: string): Promise<void> => {
  await ordersApi.confirm(id)
  await load()
  if (selected.value?.id === id) selected.value = orders.value.find((item) => item.id === id) ?? null
}

const updateFulfillment = async (id: string, fulfillmentStatus: FulfillmentStatus): Promise<void> => {
  await ordersApi.updateFulfillment(id, { fulfillmentStatus })
  await load()
  if (selected.value?.id === id) selected.value = orders.value.find((item) => item.id === id) ?? null
}

const quickCreate = async (): Promise<void> => {
  await ordersApi.quickCreate({
    serviceId: quick.value.serviceId,
    plate: quick.value.plate,
    name: quick.value.name || undefined,
    phone: quick.value.phone || undefined,
    brand: quick.value.brand || undefined,
    model: quick.value.model || undefined,
  })
  quick.value = { serviceId: '', plate: '', name: '', phone: '', brand: '', model: '' }
  await load()
}

const queueAction = (order: Order, label: string, run: () => Promise<void>): void => {
  pendingAction.value = { order, label, run }
}

const runPendingAction = async (): Promise<void> => {
  if (!pendingAction.value) return
  await pendingAction.value.run()
  pendingAction.value = null
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <PremiumHero eyebrow="訂單管理" title="處理商品、安裝與舊版服務訂單。" description="管理動作依照行動 App 下一步邏輯與後端履約端點產生。" />
    <AdminToolbar title="訂單佇列篩選" subtitle="依照後端訂單狀態與本機關鍵字搜尋縮小工作範圍。">
        <input v-model="search" class="field w-full sm:w-72" placeholder="搜尋單號、會員、車牌、收件人" />
        <select v-model="status" class="field w-full sm:w-48" @change="load">
          <option value="">全部狀態</option>
          <option value="PENDING">待處理</option>
          <option value="PAID">已付款</option>
          <option value="COMPLETED">已完成</option>
        </select>
      <button class="btn-secondary" @click="load">重新整理</button>
    </AdminToolbar>
    <SectionCard title="快速建立舊版服務訂單" subtitle="使用後端 /orders/quick-create，僅供後台維護既有服務紀錄。">
      <form class="grid gap-3 md:grid-cols-3" @submit.prevent="quickCreate">
        <input v-model="quick.serviceId" class="field" placeholder="服務 ID" required />
        <input v-model="quick.plate" class="field" placeholder="車牌" required />
        <input v-model="quick.name" class="field" placeholder="會員姓名" />
        <input v-model="quick.phone" class="field" placeholder="手機" />
        <input v-model="quick.brand" class="field" placeholder="品牌" />
        <input v-model="quick.model" class="field" placeholder="車型" />
        <button class="btn-primary md:col-span-3">快速建立</button>
      </form>
    </SectionCard>
    <PageState :loading="loading" :error="error" :empty="!filteredOrders.length" empty-title="目前沒有訂單">
    <AdminTable :columns="['單號', '會員', '狀態', '履約', '總額', '建議下一步', '操作']">
      <tr v-for="order in filteredOrders" :key="order.id" class="table-row">
        <td class="px-4 py-3">
          <button class="font-semibold text-accent" @click="selected = order">{{ order.requestId ?? order.id }}</button>
        </td>
        <td class="px-4 py-3 text-sm text-slate-300">{{ order.user?.name ?? '-' }}</td>
        <td class="px-4 py-3"><StatusPill :value="order.status" /></td>
        <td class="px-4 py-3"><StatusPill :value="order.fulfillmentStatus" /></td>
        <td class="px-4 py-3">{{ money(order.totalAmount) }}</td>
        <td class="px-4 py-3 text-sm text-amber-100">{{ getAdminOrderActions(order)[0]?.label ?? '檢視明細' }}</td>
        <td class="flex flex-wrap gap-2 px-4 py-3">
          <button class="btn-secondary" @click="selected = order">明細</button>
          <button
            v-for="action in getAdminOrderActions(order)"
            :key="`${order.id}-${action.label}`"
            class="btn-secondary"
            @click="action.kind === 'VIEW_WARRANTY' ? selected = order : queueAction(order, action.label, () => action.kind === 'CONFIRM_ORDER' ? confirm(order.id) : updateFulfillment(order.id, action.fulfillmentStatus))"
          >
            {{ action.label }}
          </button>
        </td>
      </tr>
    </AdminTable>
    </PageState>

    <AdminDetailDrawer :open="Boolean(selected)" :title="selected?.requestId ?? selected?.id ?? '訂單明細'" subtitle="訂單營運明細" @close="selected = null">
      <div v-if="selected" class="space-y-5">
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="glass-card">
            <p class="label">會員</p>
            <p class="mt-2 font-semibold text-white">{{ selected.user?.name ?? selected.recipientName ?? '-' }}</p>
            <p class="text-sm text-slate-400">{{ selected.user?.email ?? selected.recipientEmail ?? '-' }}</p>
            <p class="text-sm text-slate-400">{{ selected.recipientPhone ?? selected.user?.phone ?? '-' }}</p>
          </div>
          <div class="glass-card">
            <p class="label">付款與金額</p>
            <p class="mt-2 font-semibold text-white">{{ money(selected.totalAmount) }}</p>
            <p class="text-sm text-slate-400">小計 {{ money(selected.subtotalAmount) }} · 折扣 {{ money(selected.discountAmount ?? 0) }}</p>
            <p class="text-sm text-slate-400">付款方式 {{ selected.paymentMethod ?? '-' }} · {{ selected.paidAt ?? '尚未付款' }}</p>
          </div>
          <div class="glass-card">
            <p class="label">配送 / 履約</p>
            <p class="mt-2 text-sm text-slate-300">{{ selected.deliveryMethod ?? '-' }} · {{ selected.fulfillmentStatus ?? '-' }}</p>
            <p class="text-sm text-slate-400">{{ selected.city }}{{ selected.district }}{{ selected.address }}</p>
            <p class="text-sm text-slate-400">{{ selected.cvsStoreName ?? selected.trackingNumber ?? '-' }}</p>
          </div>
          <div class="glass-card">
            <p class="label">車輛 / 優惠</p>
            <p class="mt-2 text-sm text-slate-300">{{ selected.vehicle?.plate ?? selected.vehicleId ?? '-' }}</p>
            <p class="text-sm text-slate-400">{{ selected.vehicle?.brand ?? '' }} {{ selected.vehicle?.model ?? '' }}</p>
            <p class="text-sm text-slate-400">優惠券 {{ selected.couponCode ?? '-' }}</p>
          </div>
        </div>
        <section>
          <h3 class="font-bold text-white">品項</h3>
          <div class="mt-3 space-y-2">
            <div v-for="item in selected.items" :key="item.id" class="rounded-lg border border-line p-3">
              <div class="flex items-center justify-between gap-3">
                <p class="font-semibold text-white">{{ item.name }}</p>
                <p class="text-sm text-slate-300">{{ item.quantity }} x {{ money(item.unitPrice) }}</p>
              </div>
              <p class="mt-1 text-xs text-slate-400">{{ item.sku ?? item.itemType }} · 保固 {{ item.warrantyEligible ? '適用' : '不適用' }}</p>
            </div>
          </div>
        </section>
        <section>
          <h3 class="font-bold text-white">保固連結</h3>
          <div class="mt-3 flex flex-wrap gap-2">
            <RouterLink v-for="warranty in selected.warranties" :key="warranty.id" class="btn-secondary" to="/admin/warranties">
              {{ warranty.vehicle?.plate ?? warranty.id }}
            </RouterLink>
            <p v-if="!selected.warranties?.length" class="text-sm text-slate-400">此訂單尚無保固資料。</p>
          </div>
        </section>
      </div>
    </AdminDetailDrawer>

    <ConfirmDialog
      :open="Boolean(pendingAction)"
      title="確認執行訂單動作"
      :message="`確定要對 ${pendingAction?.order.requestId ?? pendingAction?.order.id ?? ''} 執行「${pendingAction?.label ?? ''}」？`"
      confirm-label="執行"
      @cancel="pendingAction = null"
      @confirm="runPendingAction"
    />
  </div>
</template>
