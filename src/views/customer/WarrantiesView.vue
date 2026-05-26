<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { qrApi, warrantiesApi } from '@/api'
import PremiumHero from '@/components/PremiumHero.vue'
import KpiCard from '@/components/KpiCard.vue'
import PageState from '@/components/PageState.vue'
import SectionCard from '@/components/SectionCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { dateTime } from '@/utils/format'
import { statusLabel } from '@/utils/status'
import type { ApiRecord, Warranty } from '@/types/backend'
import { CalendarClock, ShieldCheck, Wrench } from 'lucide-vue-next'

const warranties = ref<Warranty[]>([])
const selected = ref<Warranty | null>(null)
const qrPayload = ref<ApiRecord | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    warranties.value = await warrantiesApi.list()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '保固資料載入失敗'
  } finally {
    loading.value = false
  }
})

const generateQr = async (id: string): Promise<void> => {
  qrPayload.value = await qrApi.warranty(id)
}
</script>

<template>
  <div class="space-y-6">
    <PremiumHero eyebrow="保固中心" title="保固範圍、QR 憑證、車輛關聯與服務紀錄。">
      <div class="grid gap-4 md:grid-cols-3">
        <KpiCard label="保固總數" :value="warranties.length" :icon="ShieldCheck" tone="blue" />
        <KpiCard label="生效中" :value="warranties.filter((item) => item.status === 'ACTIVE').length" :icon="CalendarClock" tone="green" />
        <KpiCard label="服務紀錄" :value="warranties.reduce((sum, item) => sum + (item.logs?.length ?? 0), 0)" :icon="Wrench" tone="gold" />
      </div>
    </PremiumHero>
    <PageState :loading="loading" :error="error" :empty="!warranties.length" empty-title="尚未有保固" empty-detail="符合資格的安裝商品訂單完成後，後端會建立保固資料。">
    <div class="grid gap-4 lg:grid-cols-2">
      <article v-for="warranty in warranties" :key="warranty.id" class="surface rounded-lg p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-bold text-white">{{ warranty.vehicle?.plate ?? warranty.vehicleId }}</p>
            <p class="mt-1 text-sm text-slate-400">{{ statusLabel(warranty.type) }} · 到期 {{ dateTime(warranty.expiredAt) }}</p>
          </div>
          <StatusBadge :value="warranty.status" />
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <RouterLink class="btn-secondary" :to="`/warranties/${warranty.id}`">查看詳情</RouterLink>
          <button class="btn-secondary" @click="selected = warranty">快速預覽</button>
          <button class="btn-secondary" @click="generateQr(warranty.id)">產生 QR</button>
        </div>
      </article>
    </div>
    </PageState>
    <SectionCard v-if="selected" title="保固詳情" :subtitle="selected.id">
      <div class="grid gap-4 md:grid-cols-2">
        <p class="text-sm text-slate-300">訂單：{{ selected.order?.requestId ?? selected.orderId }}</p>
        <p class="text-sm text-slate-300">車輛：{{ selected.vehicle?.plate ?? selected.vehicleId }}</p>
        <p class="text-sm text-slate-300">開始：{{ dateTime(selected.startedAt) }}</p>
        <p class="text-sm text-slate-300">到期：{{ dateTime(selected.expiredAt) }}</p>
      </div>
      <div class="mt-4 space-y-3">
        <div v-for="log in selected.logs" :key="log.id" class="rounded-md border border-line p-3">
          <p class="font-semibold text-white">{{ statusLabel(log.action) }}</p>
          <p class="text-sm text-slate-400">{{ log.note }} · {{ dateTime(log.createdAt) }}</p>
        </div>
      </div>
    </SectionCard>
    <pre v-if="qrPayload" class="surface overflow-auto rounded-lg p-4 text-xs text-slate-300">{{ qrPayload }}</pre>
  </div>
</template>
