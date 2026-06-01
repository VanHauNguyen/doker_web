<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Gift, Package, ShieldCheck, WalletCards } from 'lucide-vue-next'
import { ordersApi, warrantiesApi, membershipApi, newsApi } from '@/api'
import PremiumHero from '@/components/PremiumHero.vue'
import KpiCard from '@/components/KpiCard.vue'
import SectionCard from '@/components/SectionCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import TimelineRail from '@/components/TimelineRail.vue'
import { money, dateTime, normalizeList } from '@/utils/format'
import { getOrderTimelineCurrentLabel } from '@/utils/orderFulfillment'
import type { ApiRecord, NewsItem, Order, Warranty } from '@/types/backend'

const orders = ref<Order[]>([])
const warranties = ref<Warranty[]>([])
const membership = ref<ApiRecord | null>(null)
const news = ref<NewsItem[]>([])

onMounted(async () => {
  const [orderPayload, warrantyPayload, memberPayload, newsPayload] = await Promise.all([
    ordersApi.list({ limit: 5 }),
    warrantiesApi.list(),
    membershipApi.me(),
    newsApi.publicList(),
  ])
  orders.value = normalizeList(orderPayload)
  warranties.value = warrantyPayload
  membership.value = memberPayload
  news.value = newsPayload.slice(0, 3)
})
</script>

<template>
  <div class="space-y-6">
    <PremiumHero
      eyebrow="會員總覽"
      title="你的 DOKER 服務、保固、點數與訂單總控台。"
      description="依據後端真實生命週期追蹤安裝訂單、保固狀態、會員進度與 DOKER 最新消息。"
    >
      <template #actions>
        <RouterLink class="btn-primary" to="/catalog">前往商城</RouterLink>
        <RouterLink class="btn-secondary" to="/warranties">查看保固</RouterLink>
      </template>
      <div class="grid gap-4 md:grid-cols-4">
        <KpiCard label="訂單數" :value="orders.length" :icon="Package" tone="blue" />
        <KpiCard label="生效保固" :value="warranties.filter((item) => item.status === 'ACTIVE').length" :icon="ShieldCheck" tone="green" />
        <KpiCard label="會員點數" :value="String(membership?.currentPoints ?? 0)" :icon="Gift" tone="gold" />
        <KpiCard label="累積消費" :value="money(membership?.lifetimeSpending)" :icon="WalletCards" tone="slate" />
      </div>
    </PremiumHero>

    <div class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,.75fr)]">
      <SectionCard title="近期訂單動態" subtitle="依據後端訂單與履約欄位呈現即時狀態。">
        <div class="space-y-3">
          <RouterLink v-for="order in orders" :key="order.id" :to="`/orders/${order.id}`" class="glass-card block">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="font-bold text-white">{{ order.requestId ?? order.id }}</p>
                <p class="mt-1 text-sm text-slate-400">{{ getOrderTimelineCurrentLabel(order) }} · {{ dateTime(order.createdAt) }}</p>
              </div>
              <div class="flex items-center gap-3">
                <StatusBadge :value="order.status" />
                <p class="font-bold text-accent">{{ money(order.totalAmount) }}</p>
              </div>
            </div>
          </RouterLink>
        </div>
      </SectionCard>

      <SectionCard title="保固生命週期">
        <TimelineRail
          :steps="[
            { key: 'order', label: '建立安裝訂單', state: orders.length ? 'completed' : 'pending' },
            { key: 'complete', label: '門市完成訂單', state: warranties.length ? 'completed' : 'current' },
            { key: 'active', label: '保固正式生效', state: warranties.some((item) => item.status === 'ACTIVE') ? 'current' : 'pending' },
          ]"
        />
      </SectionCard>
    </div>

    <SectionCard title="DOKER 最新消息" subtitle="後端已發布的會員公告與內容。">
      <div class="grid gap-4 lg:grid-cols-3">
        <article v-for="item in news" :key="item.id" class="glass-card">
          <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title" class="mb-4 h-32 w-full rounded-lg object-cover" />
          <p class="text-xs font-bold uppercase text-accent">{{ item.type }}</p>
          <p class="mt-2 font-bold text-white">{{ item.title }}</p>
          <p class="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{{ item.content }}</p>
        </article>
      </div>
    </SectionCard>
  </div>
</template>
