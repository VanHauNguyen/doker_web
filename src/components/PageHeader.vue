<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  description?: string
}>()
</script>

<template>
  <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p v-if="eyebrow" class="label">{{ eyebrow }}</p>
      <h1 class="mt-1 text-2xl font-bold text-slate-100 sm:text-3xl">{{ title }}</h1>
      <p v-if="description" class="mt-2 max-w-3xl text-sm text-slate-400">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
