<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
}>()

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[60] grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
      <section class="surface w-full max-w-md rounded-lg p-5">
        <h2 class="text-lg font-bold text-slate-100">{{ title }}</h2>
        <p class="mt-3 text-sm leading-6 text-slate-500">{{ message }}</p>
        <div class="mt-5 flex justify-end gap-3">
          <button class="btn-secondary" @click="emit('cancel')">取消</button>
          <button :class="tone === 'danger' ? 'btn-danger' : 'btn-primary'" @click="emit('confirm')">
            {{ confirmLabel ?? '確認' }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
