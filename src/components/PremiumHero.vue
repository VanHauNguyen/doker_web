<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  description?: string
}>()
</script>

<template>
  <section class="page-band animate-rise-in">
    <div class="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p v-if="eyebrow" class="label text-accent">{{ eyebrow }}</p>
        <h1 class="mt-2 max-w-4xl text-3xl font-black leading-tight text-slate-100 sm:text-4xl">{{ title }}</h1>
        <p v-if="description" class="mt-3 max-w-3xl text-sm leading-6 text-slate-500">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap gap-2">
        <slot name="actions" />
      </div>
    </div>
    <div v-if="$slots.default" class="relative z-10 mt-6">
      <slot />
    </div>
  </section>
</template>
