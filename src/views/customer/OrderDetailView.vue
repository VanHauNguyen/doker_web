<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { PackageCheck, ShieldCheck, Truck, WalletCards, Wrench } from 'lucide-vue-next'
import { ordersApi, paymentsApi } from '@/api'
import PageHeader from '@/components/PageHeader.vue'
import PageState from '@/components/PageState.vue'
import SectionCard from '@/components/SectionCard.vue'
import TimelineRail from '@/components/TimelineRail.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { money, dateTime } from '@/utils/format'
import {
  deliveryMethodLabel,
  formatDeliveryDestination,
  fulfillmentStatusLabel,
  getNextFulfillmentStatus,
  getOrderTimelineCurrentLabel,
  getOrderTimelineSteps,
  paymentMethodLabel,
} from '@/utils/orderFulfillment'
import { statusLabel } from '@/utils/status'
import { getVehicleCoverImage, getVehicleImages, vehicleDisplayName } from '@/utils/vehicleImage'
import type { ApiRecord, Order, Payment } from '@/types/backend'

const route = useRoute()
const auth = useAuthStore()
const order = ref<Order | null>(null)
const payments = ref<Payment[]>([])
const loading = ref(false)
const actionLoading = ref(false)
const error = ref<string | null>(null)

const latestPayment = computed(() => payments.value[0] ?? null)
const nextFulfillment = computed(() => order.value ? getNextFulfillmentStatus(order.value) : null)
const vehicleSnapshot = computed(() => (order.value?.vehicleSnapshot ?? order.value?.items?.find((item) => item.vehicleSnapshot)?.vehicleSnapshot ?? null) as ApiRecord | null)
const orderImages = computed(() => order.value ? getVehicleImages({ vehicle: order.value.vehicle, snapshot: vehicleSnapshot.value, images: order.value.vehicleImages }) : [])
const vehicleCover = computed(() => order.value ? getVehicleCoverImage({ vehicle: order.value.vehicle, snapshot: vehicleSnapshot.value, images: order.value.vehicleImages }) : null)
const linkedWarranties = computed(() => order.value?.warranties ?? [])
const recommendedAction = computed(() => {
  if (!order.value) return null
  if (order.value.status === 'PENDING') return { label: '確認訂單', action: 'confirm' as const }
  if (nextFulfillment.value) return { label: `更新為${fulfillmentStatusLabel(nextFulfillment.value)}`, action: 'fulfillment' as const }
  return null
})

const load = async (): Promise<void> => {
  loading.value = true
  error.value = null
  try {
    const id = String(route.params.id)
    const [orderPayload, paymentPayload] = await Promise.all([ordersApi.detail(id), paymentsApi.forOrder(id)])
    order.value = orderPayload
    payments.value = paymentPayload
  } catch (err) {
    error.value = err instanceof Error ? err.message : '訂單詳情載入失敗'
  } finally {
    loading.value = false
  }
}

const runAdminAction = async (): Promise<void> => {
  if (!order.value || !recommendedAction.value) return
  actionLoading.value = true
  error.value = null
  try {
    if (recommendedAction.value.action === 'confirm') {
      order.value = await ordersApi.confirm(order.value.id)
    } else if (nextFulfillment.value) {
      order.value = await ordersApi.updateFulfillment(order.value.id, { fulfillmentStatus: nextFulfillment.value })
    }
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '訂單狀態更新失敗'
  } finally {
    actionLoading.value = false
  }
}

const formatSnapshotValue = (key: string): string => {
  const value = vehicleSnapshot.value?.[key]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '-'
}

onMounted(load)
</script>

<template>
  <PageState :loading="loading" :error="error" :empty="!order" empty-title="找不到訂單" @retry="load">
    <div v-if="order" class="space-y-6">
      <PageHeader :title="order.requestId ?? order.id" :description="dateTime(order.createdAt)">
        <template #actions>
          <StatusBadge :value="order.status" />
        </template>
      </PageHeader>

      <section v-reveal class="overflow-hidden rounded-[1.5rem] border border-amber-200/20 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,.22),transparent_35%),linear-gradient(135deg,rgba(15,23,42,.96),rgba(12,30,52,.9))] p-6 shadow-2xl shadow-black/30">
        <div class="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p class="text-xs font-black text-amber-100">訂單狀態</p>
            <h1 class="mt-2 text-3xl font-black text-white">{{ getOrderTimelineCurrentLabel(order) }}</h1>
            <p class="mt-2 text-sm leading-6 text-slate-300">
              {{ deliveryMethodLabel(order.deliveryMethod) }} · {{ paymentMethodLabel(order.paymentMethod) }} · {{ formatDeliveryDestination(order) }}
            </p>
          </div>
          <div class="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div class="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
              <WalletCards class="h-5 w-5 text-accent" />
              <p class="mt-3 text-xs text-slate-400">付款</p>
              <p class="font-black text-white">{{ latestPayment?.status ? statusLabel(latestPayment.status) : order.paidAt ? '已付款' : '待付款' }}</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
              <Truck class="h-5 w-5 text-sky-100" />
              <p class="mt-3 text-xs text-slate-400">配送</p>
              <p class="font-black text-white">{{ fulfillmentStatusLabel(order.fulfillmentStatus) }}</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
              <PackageCheck class="h-5 w-5 text-emerald-100" />
              <p class="mt-3 text-xs text-slate-400">總額</p>
              <p class="font-black text-accent">{{ money(order.totalAmount) }}</p>
            </div>
          </div>
        </div>
        <div v-if="auth.isAdmin && recommendedAction" class="mt-5 rounded-2xl border border-amber-200/20 bg-amber-300/10 p-4">
          <p class="text-sm font-bold text-amber-50">建議操作：{{ recommendedAction.label }}</p>
          <button class="btn-primary mt-3" :disabled="actionLoading" @click="runAdminAction">{{ actionLoading ? '更新中' : recommendedAction.label }}</button>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[1fr_380px]">
        <main class="space-y-6">
          <SectionCard v-reveal title="訂單生命週期" :subtitle="getOrderTimelineCurrentLabel(order)">
            <TimelineRail class="mt-4" :steps="getOrderTimelineSteps(order)" />
          </SectionCard>

          <SectionCard v-reveal title="訂單品項" subtitle="商品、服務、安裝需求與保固關聯。">
            <div class="mt-4 divide-y divide-line">
              <div v-for="item in order.items" :key="String(item.id)" class="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p class="font-black text-white">{{ item.name }}</p>
                  <p class="mt-1 text-sm text-slate-400">{{ item.sku ?? item.productVariant?.sku ?? '未提供 SKU' }} · x{{ item.quantity }}</p>
                  <div class="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span v-if="item.itemType" class="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1">{{ statusLabel(item.itemType) }}</span>
                    <span v-if="item.installationLabel" class="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1">{{ item.installationLabel }}</span>
                    <span v-if="item.warrantyEligible" class="rounded-full border border-emerald-200/15 bg-emerald-300/10 px-2 py-1 text-emerald-100">保固商品</span>
                  </div>
                </div>
                <p class="text-right font-black text-white">{{ money(item.totalPrice) }}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard v-if="linkedWarranties.length" v-reveal title="關聯保固" subtitle="訂單完成後由後端建立並啟用保固。">
            <div class="mt-4 grid gap-3 md:grid-cols-2">
              <RouterLink v-for="warranty in linkedWarranties" :key="warranty.id" class="hover-lift rounded-2xl border border-emerald-200/15 bg-emerald-300/10 p-4" :to="`/warranties/${warranty.id}`">
                <div class="flex items-center justify-between gap-3">
                  <ShieldCheck class="h-5 w-5 text-emerald-100" />
                  <StatusBadge :value="warranty.status" />
                </div>
                <p class="mt-3 font-black text-white">{{ warranty.vehicle?.plate ?? warranty.vehicleId }}</p>
                <p class="mt-1 text-sm text-slate-400">{{ statusLabel(warranty.type) }} · 到期 {{ warranty.expiredAt ? dateTime(warranty.expiredAt) : '永久' }}</p>
              </RouterLink>
            </div>
          </SectionCard>

          <SectionCard v-reveal title="車輛與安裝資料">
            <div class="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
              <div class="group relative h-44 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-950">
                <img v-if="vehicleCover" :src="vehicleCover" alt="訂單車輛照片" class="h-full w-full object-cover opacity-0 transition duration-500" @load="($event.target as HTMLElement).classList.remove('opacity-0')" />
                <div v-else class="grid h-full place-items-center text-center">
                  <Truck class="mx-auto h-10 w-10 text-slate-500" />
                  <p class="mt-2 text-xs font-bold text-slate-500">尚未上傳車輛照片</p>
                </div>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p class="text-xs font-bold text-slate-400">車輛</p>
                <p class="mt-2 font-black text-white">{{ vehicleDisplayName(order.vehicle, vehicleSnapshot) }}</p>
                <p class="mt-1 text-sm text-slate-400">{{ order.vehicle?.brand ?? formatSnapshotValue('brand') }} {{ order.vehicle?.model ?? formatSnapshotValue('model') }}</p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p class="text-xs font-bold text-slate-400">備註</p>
                <p class="mt-2 text-sm leading-6 text-slate-300">{{ order.note ?? formatSnapshotValue('note') }}</p>
              </div>
            </div>
            <div v-if="orderImages.length" class="mt-4 grid gap-3 sm:grid-cols-3">
              <img v-for="image in orderImages" :key="image" :src="image" alt="車輛安裝照片" class="h-32 w-full rounded-2xl border border-white/10 object-cover opacity-0 transition duration-500" @load="($event.currentTarget as HTMLElement).classList.remove('opacity-0')" />
            </div>
          </SectionCard>
        </main>

        <aside class="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <SectionCard v-reveal title="付款與金額">
            <dl class="mt-4 space-y-3 text-sm">
              <div class="flex justify-between"><dt class="text-slate-400">小計</dt><dd class="text-white">{{ money(order.subtotalAmount) }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-400">優惠折抵</dt><dd class="text-emerald-100">-{{ money(order.discountAmount ?? 0) }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-400">運費</dt><dd class="text-white">{{ money(order.shippingFee ?? 0) }}</dd></div>
              <div class="flex justify-between border-t border-white/10 pt-3 text-base"><dt class="text-slate-300">總額</dt><dd class="font-black text-accent">{{ money(order.totalAmount) }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-400">優惠券</dt><dd class="text-white">{{ order.couponCode ?? order.couponId ?? '-' }}</dd></div>
            </dl>
            <div v-if="payments.length" class="mt-4 space-y-3">
              <div v-for="payment in payments" :key="payment.id" class="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <div class="flex items-center justify-between gap-3">
                  <p class="font-semibold text-white">{{ payment.provider }}</p>
                  <StatusBadge :value="payment.status" />
                </div>
                <p class="mt-2 text-sm text-slate-400">{{ money(payment.amount) }} · {{ statusLabel(payment.method) }}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard v-reveal title="配送與收件">
            <dl class="mt-4 space-y-3 text-sm">
              <div class="flex justify-between gap-4"><dt class="text-slate-400">方式</dt><dd class="text-right text-white">{{ deliveryMethodLabel(order.deliveryMethod) }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-400">收件人</dt><dd class="text-right text-white">{{ order.recipientName ?? '-' }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-400">電話</dt><dd class="text-right text-white">{{ order.recipientPhone ?? '-' }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-400">地址/門市</dt><dd class="text-right text-white">{{ formatDeliveryDestination(order) }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-400">物流</dt><dd class="text-right text-white">{{ order.logisticsProvider ?? '-' }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-400">追蹤碼</dt><dd class="text-right text-white">{{ order.trackingNumber ?? '-' }}</dd></div>
            </dl>
          </SectionCard>

          <SectionCard v-if="auth.isAdmin && order.user" v-reveal title="客戶資訊">
            <div class="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p class="font-black text-white">{{ order.user.name }}</p>
              <p class="mt-1 text-sm text-slate-400">{{ order.user.phone ?? '-' }} · {{ order.user.email }}</p>
            </div>
          </SectionCard>

          <SectionCard v-reveal title="需要協助？">
            <div class="mt-4 flex flex-wrap gap-2">
              <RouterLink class="btn-secondary" to="/chat">聯絡客服</RouterLink>
              <RouterLink v-if="linkedWarranties.length" class="btn-secondary" :to="`/warranties/${linkedWarranties[0].id}`">
                <Wrench class="h-4 w-4" /> 查看保固
              </RouterLink>
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  </PageState>
</template>
