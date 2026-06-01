<script setup lang="ts">
import { AlertTriangle, Lock } from 'lucide-vue-next'
import { getCurrentInstance, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyTitle?: string
  emptyDetail?: string
  unauthorized?: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()

const showWakeMessage = ref(false)
let wakeTimer: number | undefined
const instance = getCurrentInstance()

const retry = (): void => {
  emit('retry')
  if (!instance?.vnode.props || !('onRetry' in instance.vnode.props)) window.location.reload()
}

watch(
  () => props.loading,
  (loading) => {
    if (wakeTimer) window.clearTimeout(wakeTimer)
    showWakeMessage.value = false
    if (loading) {
      wakeTimer = window.setTimeout(() => {
        showWakeMessage.value = true
      }, 3500)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (wakeTimer) window.clearTimeout(wakeTimer)
})
</script>

<template>
  <div v-if="loading" class="surface grid min-h-56 place-items-center overflow-hidden rounded-lg p-4 sm:p-6">
    <div class="w-full max-w-md space-y-4 text-center">
      <div class="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-amber-100 border-t-accent" />
      <p class="text-sm text-slate-400">資料載入中</p>
      <div class="space-y-2">
        <div class="shimmer h-3 rounded-full bg-white/[0.08]" />
        <div class="shimmer mx-auto h-3 w-4/5 rounded-full bg-white/[0.08]" />
      </div>
      <div v-if="showWakeMessage" class="mx-auto max-w-sm rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
        伺服器喚醒中，請稍候...
      </div>
    </div>
  </div>
  <div v-else-if="unauthorized" class="surface grid min-h-56 place-items-center overflow-hidden rounded-lg p-4 text-center sm:p-8">
    <Lock class="mx-auto h-9 w-9 text-warn" />
    <p class="mt-3 text-lg font-bold text-ink">沒有權限</p>
    <p class="mt-2 text-sm text-slate-400">此功能不適用於目前帳號角色。</p>
  </div>
  <div v-else-if="error" class="surface grid min-h-44 place-items-center overflow-hidden rounded-lg p-4 text-center sm:p-8">
    <AlertTriangle class="mx-auto h-9 w-9 text-danger" />
    <p class="mt-3 text-lg font-bold text-ink">資料載入失敗</p>
    <p class="mt-2 max-w-full break-words text-sm text-slate-400">{{ error }}</p>
    <button v-if="$slots.action" class="btn-secondary mt-4" type="button">
      <slot name="action" />
    </button>
    <button v-else class="btn-secondary mt-4" type="button" @click="retry">重新整理</button>
  </div>
  <div v-else-if="empty" class="surface overflow-hidden rounded-lg p-4 text-center sm:p-8">
    <p class="text-base font-semibold text-slate-100">{{ emptyTitle ?? '目前沒有資料' }}</p>
    <p v-if="emptyDetail" class="mt-2 break-words text-sm text-slate-400">{{ emptyDetail }}</p>
  </div>
  <slot v-else />
</template>
