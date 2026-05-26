<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ordersApi } from '@/api'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import DataTable from '@/components/DataTable.vue'
import FilterBar from '@/components/FilterBar.vue'
import PageState from '@/components/PageState.vue'
import { dateTime, money, normalizeList } from '@/utils/format'
import { getOrderTimelineCurrentLabel } from '@/utils/orderFulfillment'
import { statusLabel } from '@/utils/status'
import type { Order } from '@/types/backend'

const orders = ref<Order[]>([])
const status = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const load = async (): Promise<void> => {
  loading.value = true
  error.value = null
  try {
    orders.value = normalizeList(await ordersApi.list({ limit: 50, status: status.value || undefined }))
  } catch (err) {
    error.value = err instanceof Error ? err.message : '訂單載入失敗'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="訂單" description="追蹤服務、商品、安裝、配送、付款與保固關聯訂單。" />
    <FilterBar title="訂單篩選">
      <select v-model="status" class="field" @change="load">
        <option value="">全部狀態</option>
        <option value="PENDING">待處理</option>
        <option value="PAID">已付款</option>
        <option value="PROCESSING">處理中</option>
        <option value="SHIPPED">已出貨</option>
        <option value="COMPLETED">已完成</option>
      </select>
      <button class="btn-secondary" @click="load">重新整理</button>
    </FilterBar>
    <PageState :loading="loading" :error="error" :empty="!orders.length" empty-title="尚未有訂單" empty-detail="前往商城或完成安裝商品結帳後，訂單紀錄會顯示在這裡。">
    <DataTable :columns="['單號', '類型', '狀態', '流程', '總額', '建立時間']">
      <tr v-for="order in orders" :key="order.id" class="table-row">
        <td class="px-4 py-3"><RouterLink class="font-semibold text-accent" :to="`/orders/${order.id}`">{{ order.requestId ?? order.id }}</RouterLink></td>
        <td class="px-4 py-3 text-sm text-slate-300">{{ statusLabel(order.orderType) }}</td>
        <td class="px-4 py-3"><StatusBadge :value="order.status" /></td>
        <td class="px-4 py-3 text-sm text-slate-300">{{ getOrderTimelineCurrentLabel(order) }}</td>
        <td class="px-4 py-3 text-sm text-white">{{ money(order.totalAmount) }}</td>
        <td class="px-4 py-3 text-sm text-slate-400">{{ dateTime(order.createdAt) }}</td>
      </tr>
    </DataTable>
    </PageState>
  </div>
</template>
