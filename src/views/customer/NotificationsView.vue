<script setup lang="ts">
import { onMounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import PageState from '@/components/PageState.vue'
import { useRealtimeStore } from '@/stores/realtime'
import { dateTime } from '@/utils/format'

const realtime = useRealtimeStore()
const loading = false

onMounted(realtime.refreshNotifications)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="通知中心" />
    <PageState :loading="loading" :empty="!realtime.notifications.length" empty-title="目前沒有通知">
    <div class="space-y-3">
      <article v-for="item in realtime.notifications" :key="item.id" class="surface rounded-lg p-4" :class="{ 'opacity-60': item.isRead }">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-bold text-white">{{ item.title }}</p>
            <p class="mt-1 text-sm text-slate-400">{{ item.body }}</p>
            <p class="mt-2 text-xs text-slate-500">{{ item.type }} · {{ dateTime(item.createdAt) }}</p>
            <RouterLink
              v-if="item.data?.orderId"
              class="mt-2 inline-block text-sm font-semibold text-accent"
              :to="`/orders/${item.data.orderId}`"
            >
              查看訂單
            </RouterLink>
          </div>
          <button v-if="!item.isRead" class="btn-secondary" @click="realtime.markRead(item.id)">標為已讀</button>
        </div>
      </article>
    </div>
    </PageState>
  </div>
</template>
