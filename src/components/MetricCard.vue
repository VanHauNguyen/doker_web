<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  note?: string
}>()
</script>

<template>
  <section class="surface rounded-lg p-5">
    <p class="text-xs font-semibold uppercase text-slate-500">{{ label }}</p>
    <p class="mt-3 text-2xl font-bold text-ink">{{ value }}</p>
    <p v-if="note" class="mt-2 text-xs text-slate-400">{{ note }}</p>
  </section>
</template>
