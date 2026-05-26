<script setup lang="ts">
defineProps<{
  columns: string[]
}>()
</script>

<template>
  <div class="surface overflow-hidden rounded-xl">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-line">
        <thead class="bg-white/[0.045]">
          <tr>
            <th v-for="column in columns" :key="column" class="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
              {{ column }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <slot />
        </tbody>
      </table>
    </div>
  </div>
</template>
