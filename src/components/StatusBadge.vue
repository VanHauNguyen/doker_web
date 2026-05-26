<script setup lang="ts">
import { statusClass, statusLabel } from '@/utils/status'

defineProps<{
  value?: string | null
}>()
</script>

<template>
  <span class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold" :class="statusClass(value)">
    {{ statusLabel(value) }}
  </span>
</template>
