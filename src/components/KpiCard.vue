<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Component } from 'vue'

const props = defineProps<{
  label: string
  value: string | number
  note?: string
  icon?: Component
  tone?: 'blue' | 'green' | 'gold' | 'rose' | 'slate'
}>()

const displayValue = ref<string | number>(props.value)
const numericValue = computed(() => typeof props.value === 'number' ? props.value : null)

const animateValue = (target: number): void => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    displayValue.value = target
    return
  }
  const start = Number(displayValue.value) || 0
  const startedAt = performance.now()
  const duration = 700
  const tick = (now: number): void => {
    const progress = Math.min((now - startedAt) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    displayValue.value = Math.round(start + (target - start) * eased)
    if (progress < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

watch(() => props.value, (value) => {
  if (typeof value === 'number') animateValue(value)
  else displayValue.value = value
})

onMounted(() => {
  if (numericValue.value !== null) {
    displayValue.value = 0
    animateValue(numericValue.value)
  }
})

const toneClass = {
  blue: 'from-sky-400/18 to-white/[0.045] text-sky-200',
  green: 'from-emerald-400/18 to-white/[0.045] text-emerald-200',
  gold: 'from-amber-300/22 to-white/[0.045] text-amber-100',
  rose: 'from-rose-400/18 to-white/[0.045] text-rose-200',
  slate: 'from-slate-300/14 to-white/[0.045] text-slate-200',
}
</script>

<template>
  <section class="hover-lift relative min-w-0 overflow-hidden rounded-xl border border-line bg-gradient-to-br p-4 shadow-premium transition hover:border-amber-500/30 sm:p-5" :class="toneClass[tone ?? 'blue']">
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
    <div class="flex min-w-0 items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="break-words text-xs font-semibold uppercase tracking-wide text-slate-400">{{ label }}</p>
        <p class="mt-3 break-words text-2xl font-black text-slate-100 sm:text-3xl">{{ displayValue }}</p>
      </div>
      <div v-if="icon" class="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.08] shadow-sm">
        <component :is="icon" class="h-5 w-5" />
      </div>
    </div>
    <p v-if="note" class="mt-3 break-words text-xs leading-5 text-slate-400">{{ note }}</p>
  </section>
</template>
