<script setup lang="ts">
import KpiCard from '@/components/KpiCard.vue'
import type { Component } from 'vue'

defineProps<{
  label: string
  value: string | number
  icon: Component
  tone?: 'blue' | 'green' | 'gold' | 'rose' | 'slate'
}>()
</script>

<template>
  <KpiCard :label="label" :value="value" :icon="icon" :tone="tone" />
</template>
