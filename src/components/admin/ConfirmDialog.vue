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
    <div v-if="open" class="fixed inset-0 z-[60] grid place-items-center bg-black/55 p-3 backdrop-blur-sm sm:p-4">
      <section class="surface max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-lg p-4 sm:p-5">
        <h2 class="break-words text-lg font-bold text-slate-100">{{ title }}</h2>
        <p class="mt-3 break-words text-sm leading-6 text-slate-500">{{ message }}</p>
        <div class="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button class="btn-secondary w-full sm:w-auto" @click="emit('cancel')">取消</button>
          <button class="w-full sm:w-auto" :class="tone === 'danger' ? 'btn-danger' : 'btn-primary'" @click="emit('confirm')">
            {{ confirmLabel ?? '確認' }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
