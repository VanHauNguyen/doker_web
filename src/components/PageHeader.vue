<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  description?: string
}>()
</script>

<template>
  <header class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <p v-if="eyebrow" class="label text-accent">{{ eyebrow }}</p>
      <h1 class="gradient-title mt-1 break-words text-2xl font-black sm:text-3xl">{{ title }}</h1>
      <p v-if="description" class="mt-2 max-w-3xl break-words text-sm text-slate-400">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
      <slot name="actions" />
    </div>
  </header>
</template>
