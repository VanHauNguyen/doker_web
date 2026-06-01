<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  description?: string
}>()
</script>

<template>
  <section v-reveal class="page-band animate-rise-in">
    <div class="relative z-10 flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div class="min-w-0">
        <p v-if="eyebrow" class="label text-accent">{{ eyebrow }}</p>
        <h1 class="gradient-title mt-2 max-w-4xl break-words text-2xl font-black leading-tight sm:text-4xl">{{ title }}</h1>
        <p v-if="description" class="mt-3 max-w-3xl break-words text-sm leading-6 text-slate-500">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="flex w-full flex-wrap gap-2 sm:w-auto lg:justify-end">
        <slot name="actions" />
      </div>
    </div>
    <div v-if="$slots.default" class="relative z-10 mt-6">
      <slot />
    </div>
  </section>
</template>
