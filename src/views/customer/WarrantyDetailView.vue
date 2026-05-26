<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import QRCode from 'qrcode'
import { CalendarClock, Car, FileText, QrCode, ShieldCheck, Wrench } from 'lucide-vue-next'
import { qrApi, warrantiesApi } from '@/api'
import PageHeader from '@/components/PageHeader.vue'
import PageState from '@/components/PageState.vue'
import SectionCard from '@/components/SectionCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import TimelineRail from '@/components/TimelineRail.vue'
import { dateTime, money } from '@/utils/format'
import { statusLabel } from '@/utils/status'
import { getVehicleCoverImage, getVehicleImages, vehicleDisplayName } from '@/utils/vehicleImage'
import type { ApiRecord, Warranty, WarrantyAction } from '@/types/backend'

const route = useRoute()
const warranty = ref<Warranty | null>(null)
const logs = ref<Warranty['logs']>([])
const loading = ref(false)
const error = ref<string | null>(null)
const qrPayload = ref<ApiRecord | null>(null)
const qrDataUrl = ref('')

const sourceItem = computed(() => warranty.value?.orderItem ?? warranty.value?.order?.items?.find((item) => item.id === warranty.value?.orderItemId) ?? warranty.value?.order?.items?.[0] ?? null)
const sourceTitle = computed(() => sourceItem.value?.product?.name ?? sourceItem.value?.name ?? warranty.value?.order?.service?.name ?? '商品安裝保固')
const selectedOptions = computed(() => sourceItem.value?.selectedOptions ?? sourceItem.value?.metadata?.selectedOptions ?? null)
const vehicleSnapshot = computed(() => (warranty.value?.metadata?.vehicleSnapshot ?? warranty.value?.order?.vehicleSnapshot ?? null) as ApiRecord | null)
const vehicleImages = computed(() => {
  if (!warranty.value) return []
  return getVehicleImages({
    vehicle: warranty.value.vehicle,
    snapshot: vehicleSnapshot.value,
    images: warranty.value.metadata?.vehicleImages ?? warranty.value.order?.vehicleImages,
  })
})
const vehicleCover = computed(() => warranty.value ? getVehicleCoverImage({ vehicle: warranty.value.vehicle, snapshot: vehicleSnapshot.value, images: warranty.value.metadata?.vehicleImages ?? warranty.value.order?.vehicleImages }) : null)
const lifecycleSteps = computed(() => {
  const item = warranty.value
  if (!item) return []
  const expired = item.expiredAt ? new Date(item.expiredAt).getTime() < Date.now() : false
  return [
    { key: 'created', label: '保固建立', state: 'completed' as const, value: item.createdAt },
    { key: 'active', label: '保固生效', state: item.status === 'PENDING' ? 'pending' as const : 'completed' as const, value: item.startedAt },
    { key: 'logs', label: '服務紀錄', state: logs.value?.length ? 'completed' as const : 'pending' as const, value: logs.value?.[0]?.createdAt },
    { key: 'expired', label: item.type === 'PERMANENT' ? '永久保固' : '保固到期', state: expired ? 'failed' as const : item.status === 'ACTIVE' ? 'current' as const : 'pending' as const, value: item.expiredAt },
  ]
})

const actionLabel = (action?: WarrantyAction): string => {
  if (action === 'REPAIR') return '維修'
  if (action === 'REPLACE') return '更換'
  if (action === 'INSPECTION') return '檢查'
  return '保固紀錄'
}

const load = async (): Promise<void> => {
  loading.value = true
  error.value = null
  try {
    const id = String(route.params.id)
    warranty.value = await warrantiesApi.detail(id)
    logs.value = await warrantiesApi.logs(id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '保固詳情載入失敗'
  } finally {
    loading.value = false
  }
}

const generateQr = async (): Promise<void> => {
  if (!warranty.value) return
  qrPayload.value = await qrApi.warranty(warranty.value.id)
  const record = qrPayload.value
  const token = String(record.token ?? record.qrToken ?? record.payload ?? JSON.stringify(record))
  qrDataUrl.value = await QRCode.toDataURL(token, { width: 260, margin: 1, errorCorrectionLevel: 'M' })
}

const snapshotValue = (key: string): string => {
  const value = vehicleSnapshot.value?.[key]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '-'
}

onMounted(load)
</script>

<template>
  <PageState :loading="loading" :error="error" :empty="!warranty" empty-title="找不到保固資料" @retry="load">
    <div v-if="warranty" class="space-y-6">
      <PageHeader :title="sourceTitle" :description="`保固編號 ${warranty.id}`">
        <template #actions>
          <StatusBadge :value="warranty.status" />
        </template>
      </PageHeader>

      <section v-reveal class="overflow-hidden rounded-[1.5rem] border border-emerald-200/20 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,.18),transparent_34%),linear-gradient(135deg,rgba(15,23,42,.96),rgba(9,35,49,.92))] p-6 shadow-2xl shadow-black/30">
        <div class="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p class="text-xs font-black text-emerald-100">DOKER 保固憑證</p>
            <h1 class="mt-2 text-3xl font-black text-white">{{ sourceTitle }}</h1>
            <p class="mt-2 text-sm leading-6 text-slate-300">
              {{ statusLabel(warranty.type) }} · {{ warranty.startedAt ? dateTime(warranty.startedAt) : '尚未生效' }} - {{ warranty.expiredAt ? dateTime(warranty.expiredAt) : '永久有效' }}
            </p>
          </div>
          <div class="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div class="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
              <ShieldCheck class="h-5 w-5 text-emerald-100" />
              <p class="mt-3 text-xs text-slate-400">狀態</p>
              <p class="font-black text-white">{{ statusLabel(warranty.status) }}</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
              <CalendarClock class="h-5 w-5 text-accent" />
              <p class="mt-3 text-xs text-slate-400">到期</p>
              <p class="font-black text-white">{{ warranty.expiredAt ? dateTime(warranty.expiredAt) : '永久' }}</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
              <Wrench class="h-5 w-5 text-sky-100" />
              <p class="mt-3 text-xs text-slate-400">紀錄</p>
              <p class="font-black text-white">{{ logs?.length ?? 0 }} 筆</p>
            </div>
          </div>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[1fr_380px]">
        <main class="space-y-6">
          <SectionCard v-reveal title="保固生命週期">
            <TimelineRail class="mt-4" :steps="lifecycleSteps" />
          </SectionCard>

          <SectionCard v-reveal title="保固紀錄" subtitle="維修、檢查與更換紀錄由後端保固 log 管理。">
            <div v-if="logs?.length" class="mt-4 space-y-3">
              <article v-for="(log, index) in logs" :key="log.id" class="animate-fade-up rounded-2xl border border-white/10 bg-white/[0.035] p-4" :style="{ animationDelay: `${index * 70}ms` }">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-black text-white">{{ actionLabel(log.action) }}</p>
                    <p class="mt-1 text-sm leading-6 text-slate-400">{{ log.note ?? '未填寫備註' }}</p>
                  </div>
                  <span class="rounded-full border border-sky-200/15 bg-sky-300/10 px-2.5 py-1 text-xs font-bold text-sky-100">{{ dateTime(log.createdAt) }}</span>
                </div>
                <p v-if="log.createdBy" class="mt-2 text-xs text-slate-500">操作人員 {{ log.createdBy }}</p>
              </article>
            </div>
            <p v-else class="mt-4 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">尚無保固服務紀錄。</p>
          </SectionCard>

          <SectionCard v-reveal title="保固範圍">
            <div class="mt-4 grid gap-4 md:grid-cols-2">
              <div class="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <FileText class="h-5 w-5 text-accent" />
                <p class="mt-3 text-sm text-slate-400">保固來源</p>
                <p class="mt-1 font-black text-white">{{ sourceTitle }}</p>
                <p class="mt-1 text-sm text-slate-400">金額 {{ sourceItem?.totalPrice ? money(sourceItem.totalPrice) : '-' }}</p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p class="text-sm text-slate-400">規格/安裝</p>
                <p class="mt-2 text-sm leading-6 text-white">
                  <template v-if="selectedOptions">
                    <span v-for="(value, key) in selectedOptions" :key="key" class="mr-2">{{ key }}: {{ value }}</span>
                  </template>
                  <template v-else>{{ sourceItem?.installationLabel ?? '未提供' }}</template>
                </p>
              </div>
            </div>
          </SectionCard>
        </main>

        <aside class="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <SectionCard v-reveal title="車輛資訊">
            <div class="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
              <div class="group relative h-44 bg-gradient-to-br from-slate-800 to-slate-950">
                <img v-if="vehicleCover" :src="vehicleCover" alt="保固車輛照片" class="h-full w-full object-cover opacity-0 transition duration-500" @load="($event.target as HTMLElement).classList.remove('opacity-0')" />
                <div v-else class="grid h-full place-items-center text-center">
                  <Car class="mx-auto h-10 w-10 text-slate-500" />
                  <p class="mt-2 text-xs font-bold text-slate-500">尚未上傳車輛照片</p>
                </div>
              </div>
              <div class="p-4">
                <p class="font-black text-white">{{ vehicleDisplayName(warranty.vehicle, vehicleSnapshot) }}</p>
                <p class="mt-1 text-sm text-slate-400">{{ warranty.vehicle?.brand ?? snapshotValue('brand') }} {{ warranty.vehicle?.model ?? snapshotValue('model') }}</p>
              </div>
            </div>
            <div v-if="vehicleImages.length" class="mt-4 grid grid-cols-2 gap-3">
              <img v-for="image in vehicleImages" :key="image" :src="image" alt="保固車輛照片" class="h-28 w-full rounded-2xl border border-white/10 object-cover opacity-0 transition duration-500" @load="($event.currentTarget as HTMLElement).classList.remove('opacity-0')" />
            </div>
          </SectionCard>

          <SectionCard v-reveal title="關聯訂單">
            <div class="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p class="font-black text-white">{{ warranty.order?.requestId ?? warranty.orderId }}</p>
              <p class="mt-1 text-sm text-slate-400">{{ warranty.order?.createdAt ? dateTime(warranty.order.createdAt) : '-' }}</p>
              <RouterLink class="btn-secondary mt-4" :to="`/orders/${warranty.orderId}`">查看訂單</RouterLink>
            </div>
          </SectionCard>

          <SectionCard v-reveal title="QR 憑證">
            <div class="mt-4 rounded-3xl border border-white/10 bg-white p-4">
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="保固 QR Code" class="mx-auto h-56 w-56 object-contain" />
              <div v-else class="grid h-56 place-items-center text-slate-400">
                <QrCode class="h-16 w-16" />
              </div>
            </div>
            <button class="btn-primary mt-4 w-full" @click="generateQr">產生保固 QR</button>
            <p v-if="qrPayload" class="mt-3 break-all rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-400">{{ qrPayload }}</p>
          </SectionCard>

          <SectionCard v-reveal title="需要協助？">
            <div class="mt-4 flex flex-wrap gap-2">
              <RouterLink class="btn-secondary" to="/chat">聯絡客服</RouterLink>
              <RouterLink class="btn-secondary" to="/qr">開啟 QR 中心</RouterLink>
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  </PageState>
</template>
