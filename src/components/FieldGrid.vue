<script setup lang="ts">
defineProps<{
  items: Array<{ label: string; value?: unknown }>
}>()
</script>

<template>
  <dl class="grid gap-3 text-sm sm:grid-cols-2">
    <div v-for="item in items" :key="item.label" class="rounded-md border border-line bg-white/[0.03] p-3">
      <dt class="text-xs font-semibold uppercase text-slate-500">{{ item.label }}</dt>
      <dd class="mt-1 break-words text-slate-100">{{ item.value ?? '-' }}</dd>
    </div>
  </dl>
</template>
