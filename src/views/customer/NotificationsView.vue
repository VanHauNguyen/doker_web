<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import PageState from '@/components/PageState.vue'
import { useAuthStore } from '@/stores/auth'
import { useRealtimeStore } from '@/stores/realtime'
import { dateTime } from '@/utils/format'
import { notificationGroupLabel, notificationMeta, notificationRouteTarget } from '@/utils/notificationNavigation'
import type { NotificationItem } from '@/types/backend'

const realtime = useRealtimeStore()
const auth = useAuthStore()
const router = useRouter()
const loading = ref(false)
const error = ref<string | null>(null)

const groupedNotifications = computed(() => {
  const groups = new Map<string, NotificationItem[]>()
  realtime.notifications.forEach((item) => {
    const label = notificationGroupLabel(item)
    groups.set(label, [...(groups.get(label) ?? []), item])
  })
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }))
})

const load = async (): Promise<void> => {
  loading.value = true
  error.value = null
  try {
    await realtime.refreshNotifications()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '通知載入失敗'
  } finally {
    loading.value = false
  }
}

const openNotification = async (item: NotificationItem): Promise<void> => {
  if (!item.isRead) await realtime.markRead(item.id)
  const target = notificationRouteTarget(item, auth.isAdmin)
  if (target.path !== '/notifications') await router.push(target.path)
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="通知中心" description="訂單、保固、會員、客服與系統事件會依後端 payload 導向對應頁面。">
      <template #actions>
        <button class="btn-secondary" :disabled="!realtime.unread" @click="realtime.markAllRead">全部標為已讀</button>
      </template>
    </PageHeader>
    <PageState :loading="loading" :error="error" :empty="!realtime.notifications.length" empty-title="目前沒有通知" empty-detail="新的訂單、保固與會員事件會即時顯示在這裡。" @retry="load">
      <div class="space-y-6">
        <section v-for="group in groupedNotifications" :key="group.label" v-reveal class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-black text-white">{{ group.label }}</h2>
            <span class="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-300">{{ group.items.length }} 則</span>
          </div>
          <article
            v-for="item in group.items"
            :key="item.id"
            class="hover-lift surface cursor-pointer rounded-2xl p-4 transition"
            :class="{ 'opacity-65': item.isRead }"
            @click="openNotification(item)"
          >
            <div class="flex items-start gap-4">
              <span
                class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border"
                :class="{
                  'border-amber-200/20 bg-amber-300/10 text-amber-100': notificationMeta(item).tone === 'gold',
                  'border-sky-200/20 bg-sky-300/10 text-sky-100': notificationMeta(item).tone === 'blue',
                  'border-emerald-200/20 bg-emerald-300/10 text-emerald-100': notificationMeta(item).tone === 'green',
                  'border-rose-200/20 bg-rose-300/10 text-rose-100': notificationMeta(item).tone === 'rose',
                  'border-white/10 bg-white/[0.05] text-slate-300': notificationMeta(item).tone === 'slate',
                }"
              >
                <component :is="notificationMeta(item).icon" class="h-5 w-5" />
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p class="font-black text-white">{{ item.title }}</p>
                    <p class="mt-1 text-sm leading-6 text-slate-400">{{ item.body }}</p>
                  </div>
                  <span v-if="!item.isRead" class="rounded-full bg-amber-300 px-2.5 py-1 text-xs font-black text-slate-950">未讀</span>
                </div>
                <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{{ notificationMeta(item).label }}</span>
                  <span>{{ dateTime(item.createdAt) }}</span>
                  <span>{{ notificationRouteTarget(item, auth.isAdmin).reason }}</span>
                </div>
                <div class="mt-4 flex flex-wrap gap-2">
                  <button class="btn-primary" type="button" @click.stop="openNotification(item)">
                    {{ notificationRouteTarget(item, auth.isAdmin).label }}
                  </button>
                  <button v-if="!item.isRead" class="btn-secondary" type="button" @click.stop="realtime.markRead(item.id)">標為已讀</button>
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>
    </PageState>
  </div>
</template>
