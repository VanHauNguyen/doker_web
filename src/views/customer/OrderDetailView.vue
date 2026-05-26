<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ordersApi, paymentsApi } from '@/api'
import PageHeader from '@/components/PageHeader.vue'
import SectionCard from '@/components/SectionCard.vue'
import TimelineRail from '@/components/TimelineRail.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { money, dateTime } from '@/utils/format'
import { deliveryMethodLabel, formatDeliveryDestination, getOrderTimelineCurrentLabel, getOrderTimelineSteps, paymentMethodLabel } from '@/utils/orderFulfillment'
import { statusLabel } from '@/utils/status'
import type { Order, Payment } from '@/types/backend'

const route = useRoute()
const order = ref<Order | null>(null)
const payments = ref<Payment[]>([])

onMounted(async () => {
  const id = String(route.params.id)
  order.value = await ordersApi.detail(id)
  payments.value = await paymentsApi.forOrder(id)
})
</script>

<template>
  <div v-if="order" class="space-y-6">
    <PageHeader :title="order.requestId ?? order.id" :description="dateTime(order.createdAt)">
      <template #actions>
        <StatusBadge :value="order.status" />
      </template>
    </PageHeader>
    <div class="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <SectionCard title="訂單摘要" :subtitle="getOrderTimelineCurrentLabel(order)">
        <dl class="mt-4 grid gap-3 text-sm">
          <div class="flex justify-between"><dt class="text-slate-400">類型</dt><dd>{{ statusLabel(order.orderType) }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-400">流程</dt><dd>{{ getOrderTimelineCurrentLabel(order) }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-400">配送</dt><dd>{{ deliveryMethodLabel(order.deliveryMethod) }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-400">付款</dt><dd>{{ paymentMethodLabel(order.paymentMethod) }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-slate-400">收件資訊</dt><dd class="text-right">{{ formatDeliveryDestination(order) }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-400">優惠券</dt><dd>{{ order.couponCode ?? '-' }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-400">總額</dt><dd class="font-bold text-accent">{{ money(order.totalAmount) }}</dd></div>
        </dl>
      </SectionCard>
      <SectionCard title="訂單生命週期">
        <TimelineRail :steps="getOrderTimelineSteps(order)" />
      </SectionCard>
      <SectionCard title="付款紀錄">
        <div class="mt-4 space-y-3">
          <div v-for="payment in payments" :key="payment.id" class="rounded-md border border-line p-3">
            <div class="flex items-center justify-between gap-3">
              <p class="font-semibold text-white">{{ payment.provider }}</p>
              <StatusBadge :value="payment.status" />
            </div>
            <p class="mt-2 text-sm text-slate-400">{{ money(payment.amount) }} · {{ payment.method }}</p>
          </div>
        </div>
      </SectionCard>
      <SectionCard v-if="order.items?.length" class="lg:col-span-2" title="訂單明細">
        <div class="mt-4 divide-y divide-line">
          <div v-for="item in order.items" :key="String(item.id)" class="grid gap-2 py-3 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div>
              <p class="font-semibold text-white">{{ item.name }}</p>
              <p class="text-sm text-slate-400">{{ item.sku ?? '-' }}</p>
            </div>
            <p class="text-sm text-slate-300">x{{ item.quantity }}</p>
            <p class="font-semibold text-white">{{ money(item.totalPrice) }}</p>
          </div>
        </div>
      </SectionCard>
    </div>
  </div>
</template>
