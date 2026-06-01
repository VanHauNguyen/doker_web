<script setup lang="ts">
import { statusClass, statusLabel } from '@/utils/status'

defineProps<{
  value?: string | null
}>()
</script>

<template>
  <span class="inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-snug" :class="statusClass(value)">
    {{ statusLabel(value) }}
  </span>
</template>
