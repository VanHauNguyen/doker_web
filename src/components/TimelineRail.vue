<script setup lang="ts">
defineProps<{
  steps: Array<{ key: string; label: string; state?: 'completed' | 'current' | 'pending' | 'failed' | 'canceled'; value?: string | null }>
}>()
</script>

<template>
  <div class="space-y-0">
    <div v-for="(step, index) in steps" :key="step.key" class="grid grid-cols-[28px_1fr] gap-3">
      <div class="flex flex-col items-center">
        <div
          class="h-3.5 w-3.5 rounded-full border"
          :class="{
            'border-emerald-300 bg-emerald-300 shadow-lg shadow-emerald-400/30': step.state === 'completed',
            'border-accent bg-accent shadow-lg shadow-amber-400/30': step.state === 'current',
            'border-rose-300 bg-rose-300': step.state === 'failed' || step.state === 'canceled',
            'border-slate-300 bg-white': !step.state || step.state === 'pending',
          }"
        />
        <div v-if="index < steps.length - 1" class="h-10 w-px bg-line" />
      </div>
      <div class="-mt-1 pb-4">
        <p class="text-sm font-semibold text-ink">{{ step.label }}</p>
        <p v-if="step.value" class="mt-1 text-xs text-slate-500">{{ step.value }}</p>
      </div>
    </div>
  </div>
</template>
