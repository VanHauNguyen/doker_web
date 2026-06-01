<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { CheckCircle2, KeyRound, LockKeyhole, Mail } from 'lucide-vue-next'
import { authApi } from '@/api'
import AuthField from '@/components/auth/AuthField.vue'

const target = ref('')
const code = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const sent = ref(false)
const sending = ref(false)
const resetting = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)
const countdown = ref(0)

const canReset = computed(() => target.value.trim() && code.value.trim().length >= 4 && newPassword.value.length >= 8 && newPassword.value === confirmPassword.value)

const startCountdown = (): void => {
  countdown.value = 60
  const timer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) window.clearInterval(timer)
  }, 1000)
}

const sendOtp = async (): Promise<void> => {
  error.value = null
  if (!target.value.trim()) {
    error.value = '請輸入 Email 或手機'
    return
  }
  sending.value = true
  try {
    await authApi.sendOtp(target.value.trim(), 'RESET_PASSWORD')
    sent.value = true
    message.value = '重設驗證碼已送出，請查看手機或 Email。'
    startCountdown()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '驗證碼送出失敗'
  } finally {
    sending.value = false
  }
}

const reset = async (): Promise<void> => {
  error.value = null
  if (!canReset.value) {
    error.value = '請確認驗證碼與新密碼，兩次密碼需一致且至少 8 碼'
    return
  }
  resetting.value = true
  try {
    await authApi.resetPassword({ target: target.value.trim(), code: code.value.trim(), newPassword: newPassword.value })
    message.value = '密碼已更新，請返回登入。'
  } catch (err) {
    error.value = err instanceof Error ? err.message : '重設密碼失敗'
  } finally {
    resetting.value = false
  }
}
</script>

<template>
  <form class="animate-scale-in w-full max-w-full rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6" @submit.prevent="reset">
    <div class="mb-6">
      <p class="text-xs font-black text-amber-100">帳號安全</p>
      <h2 class="mt-3 text-2xl font-black text-white sm:text-3xl">重設登入密碼</h2>
      <p class="mt-2 text-sm leading-6 text-slate-400">透過後端 OTP 驗證碼確認身份，再設定新的會員密碼。</p>
    </div>

    <div class="space-y-4">
      <AuthField v-model="target" label="Email 或手機" :icon="Mail" required />
      <button class="btn-secondary h-12 w-full" type="button" :disabled="sending || countdown > 0" @click="sendOtp">
        {{ sending ? '送出中...' : countdown > 0 ? `${countdown}s 後可重發` : sent ? '重新發送驗證碼' : '送出重設驗證碼' }}
      </button>
      <Transition name="page-fade">
        <div v-if="sent" class="space-y-4">
          <AuthField v-model="code" label="OTP 驗證碼" :icon="KeyRound" required />
          <AuthField v-model="newPassword" label="新密碼" type="password" :icon="LockKeyhole" autocomplete="new-password" required />
          <AuthField v-model="confirmPassword" label="確認新密碼" type="password" :icon="LockKeyhole" autocomplete="new-password" required :error="confirmPassword && newPassword !== confirmPassword ? '兩次密碼不一致' : null" />
          <button class="btn-primary h-12 w-full" :disabled="resetting">{{ resetting ? '更新中...' : '重設密碼' }}</button>
        </div>
      </Transition>
    </div>

    <p v-if="message" class="mt-4 inline-flex max-w-full items-center gap-2 break-words text-sm font-semibold text-emerald-100"><CheckCircle2 class="h-4 w-4 shrink-0" /> {{ message }}</p>
    <p v-if="error" class="mt-4 rounded-2xl border border-rose-300/25 bg-rose-300/10 p-3 text-sm font-semibold text-rose-100">{{ error }}</p>
    <RouterLink class="mt-5 block text-center text-sm font-black text-accent" to="/auth/login">返回登入</RouterLink>
  </form>
</template>
