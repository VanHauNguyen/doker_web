<script setup lang="ts">
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
</script>

<template>
  <div class="fixed right-4 top-4 z-50 space-y-2">
    <div
      v-for="message in toast.messages"
      :key="message.id"
      class="animate-rise-in rounded-xl border px-4 py-3 text-sm font-semibold shadow-premium backdrop-blur"
      :class="{
        'border-emerald-300/30 bg-emerald-400/15 text-emerald-100': message.tone === 'success',
        'border-rose-300/30 bg-rose-400/15 text-rose-100': message.tone === 'error',
        'border-sky-300/30 bg-sky-400/15 text-sky-100': message.tone === 'info',
      }"
    >
      {{ message.text }}
    </div>
  </div>
</template>
