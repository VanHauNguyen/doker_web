<script setup lang="ts">
import StatusBadge from '@/components/StatusBadge.vue'

defineProps<{
  value?: string | null
}>()
</script>

<template>
  <StatusBadge :value="value" />
</template>
