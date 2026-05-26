<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ordersApi, servicesApi, vehiclesApi } from '@/api'
import PageHeader from '@/components/PageHeader.vue'
import PageState from '@/components/PageState.vue'
import SectionCard from '@/components/SectionCard.vue'
import { money } from '@/utils/format'
import { statusLabel } from '@/utils/status'
import { useAuthStore } from '@/stores/auth'
import type { ServiceItem, Vehicle } from '@/types/backend'

const auth = useAuthStore()
const services = ref<ServiceItem[]>([])
const vehicles = ref<Vehicle[]>([])
const selectedVehicle = ref('')
const message = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    services.value = await servicesApi.list()
    if (!auth.isAdmin) vehicles.value = await vehiclesApi.list()
    selectedVehicle.value = vehicles.value[0]?.id ?? ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : '服務項目載入失敗'
  } finally {
    loading.value = false
  }
})

const orderService = async (service: ServiceItem): Promise<void> => {
  const order = await ordersApi.create({ serviceId: service.id, vehicleId: selectedVehicle.value })
  message.value = `訂單 ${order.requestId ?? order.id} 已建立`
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="服務項目" description="舊版服務下單目前僅供後台使用；會員保固會由安裝商品訂單完成後建立。" />
    <SectionCard v-if="!auth.isAdmin" title="會員服務下單暫停" subtitle="行動 App 已停用此舊流程，請透過商城選購需門市安裝的商品建立保固。" />
    <div v-if="auth.isAdmin" class="surface rounded-lg p-4">
      <label class="label">服務車輛</label>
      <select v-model="selectedVehicle" class="field mt-2 max-w-md">
        <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.plate }} · {{ vehicle.brand }} {{ vehicle.model }}</option>
      </select>
      <p v-if="message" class="mt-3 text-sm text-mint">{{ message }}</p>
    </div>
    <PageState :loading="loading" :error="error" :empty="!services.length" empty-title="尚未設定服務項目">
    <div class="grid gap-4 lg:grid-cols-3">
      <article v-for="service in services" :key="service.id" class="surface rounded-lg p-5">
        <p class="text-lg font-bold text-white">{{ service.name }}</p>
        <p class="mt-2 min-h-10 text-sm text-slate-400">{{ service.description }}</p>
        <p class="mt-4 text-xl font-bold text-accent">{{ money(service.price) }}</p>
        <p class="mt-2 text-xs text-slate-500">{{ statusLabel(service.warrantyType) }} {{ service.durationValue }} {{ service.durationUnit }}</p>
        <button v-if="auth.isAdmin" class="btn-primary mt-4 w-full" :disabled="!selectedVehicle" @click="orderService(service)">建立舊版服務訂單</button>
      </article>
    </div>
    </PageState>
  </div>
</template>
