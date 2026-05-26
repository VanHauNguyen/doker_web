<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { newsApi } from '@/api'
import PageHeader from '@/components/PageHeader.vue'
import { dateTime } from '@/utils/format'
import { statusLabel } from '@/utils/status'
import type { NewsItem } from '@/types/backend'

const news = ref<NewsItem[]>([])

onMounted(async () => {
  news.value = await newsApi.publicList()
})
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="最新消息" />
    <div class="grid gap-4 lg:grid-cols-3">
      <article v-for="item in news" :key="item.id" class="surface overflow-hidden rounded-lg">
        <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title" class="h-44 w-full object-cover" />
        <div class="p-5">
          <p class="text-xs font-semibold text-accent">{{ statusLabel(item.type) }} · {{ dateTime(item.publishedAt ?? item.createdAt) }}</p>
          <h2 class="mt-2 text-lg font-bold text-white">{{ item.title }}</h2>
          <p class="mt-3 text-sm text-slate-400">{{ item.content }}</p>
        </div>
      </article>
    </div>
  </div>
</template>
