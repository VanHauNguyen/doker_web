<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  value: string | number
  note?: string
  icon?: Component
  tone?: 'blue' | 'green' | 'gold' | 'rose' | 'slate'
}>()

const toneClass = {
  blue: 'from-sky-400/18 to-white/[0.045] text-sky-200',
  green: 'from-emerald-400/18 to-white/[0.045] text-emerald-200',
  gold: 'from-amber-300/22 to-white/[0.045] text-amber-100',
  rose: 'from-rose-400/18 to-white/[0.045] text-rose-200',
  slate: 'from-slate-300/14 to-white/[0.045] text-slate-200',
}
</script>

<template>
  <section class="relative overflow-hidden rounded-xl border border-line bg-gradient-to-br p-5 shadow-premium transition hover:-translate-y-1 hover:border-amber-500/30" :class="toneClass[tone ?? 'blue']">
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ label }}</p>
        <p class="mt-3 text-3xl font-black text-slate-100">{{ value }}</p>
      </div>
      <div v-if="icon" class="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.08] shadow-sm">
        <component :is="icon" class="h-5 w-5" />
      </div>
    </div>
    <p v-if="note" class="mt-3 text-xs leading-5 text-slate-400">{{ note }}</p>
  </section>
</template>
