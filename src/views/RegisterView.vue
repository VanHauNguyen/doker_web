<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { CheckCircle2, LockKeyhole, Mail, Phone, UserRound } from 'lucide-vue-next'
import { authApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import AuthField from '@/components/auth/AuthField.vue'
import type { OtpType } from '@/types/backend'

const auth = useAuthStore()
const router = useRouter()
const name = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')
const code = ref('')
const terms = ref(false)
const otpSent = ref(false)
const sendingOtp = ref(false)
const status = ref<string | null>(null)
const error = ref<string | null>(null)
const touched = ref(false)

const passwordScore = computed(() => [password.value.length >= 8, /[A-Z]/.test(password.value), /\d/.test(password.value), /[^A-Za-z0-9]/.test(password.value)].filter(Boolean).length)
const progress = computed(() => Math.round(([
  name.value.trim(),
  email.value.trim(),
  password.value.length >= 8,
  password.value === confirmPassword.value && confirmPassword.value,
  code.value.trim(),
  terms.value,
].filter(Boolean).length / 6) * 100))

const sendOtp = async (): Promise<void> => {
  error.value = null
  if (!email.value && !phone.value) {
    error.value = '請先填寫 Email 或手機'
    return
  }
  sendingOtp.value = true
  try {
    await authApi.sendOtp(email.value || phone.value, 'REGISTER' satisfies OtpType)
    otpSent.value = true
    status.value = '驗證碼已送出，請查看手機或 Email。'
  } catch (err) {
    error.value = err instanceof Error ? err.message : '驗證碼送出失敗'
  } finally {
    sendingOtp.value = false
  }
}

const submit = async (): Promise<void> => {
  touched.value = true
  error.value = null
  if (!terms.value) {
    error.value = '請先同意服務條款與隱私政策'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = '兩次輸入的密碼不一致'
    return
  }
  try {
    await auth.register({
      name: name.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim() || undefined,
      password: password.value,
      code: code.value.trim(),
    })
    await router.push('/home')
  } catch (err) {
    error.value = err instanceof Error ? err.message : '註冊失敗，請確認資料是否正確'
  }
}
</script>

<template>
  <form class="animate-scale-in rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl" @submit.prevent="submit">
    <div class="mb-6">
      <p class="text-xs font-black text-amber-100">建立 DOKER 會員</p>
      <h2 class="mt-3 text-3xl font-black text-white">開始保固與會員服務</h2>
      <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-900">
        <div class="h-full rounded-full bg-gradient-to-r from-amber-300 to-sky-300 transition-all" :style="{ width: `${progress}%` }" />
      </div>
      <div class="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-400">
        <span class="text-amber-100">1. 帳號資料</span>
        <span :class="otpSent ? 'text-amber-100' : ''">2. OTP 驗證</span>
        <span :class="terms ? 'text-amber-100' : ''">3. 完成啟用</span>
      </div>
    </div>

    <div class="space-y-4">
      <AuthField v-model="name" label="姓名" :icon="UserRound" required :error="touched && !name.trim() ? '請輸入姓名' : null" />
      <AuthField v-model="email" label="Email" type="email" :icon="Mail" autocomplete="email" required :error="touched && !email.includes('@') ? '請輸入有效 Email' : null" />
      <AuthField v-model="phone" label="手機" :icon="Phone" autocomplete="tel" />
      <AuthField v-model="password" label="密碼" type="password" :icon="LockKeyhole" autocomplete="new-password" required :error="touched && password.length < 8 ? '密碼至少 8 碼' : null" />
      <div>
        <div class="mb-2 flex gap-1">
          <span v-for="index in 4" :key="index" class="h-1.5 flex-1 rounded-full" :class="index <= passwordScore ? 'bg-amber-300' : 'bg-white/10'" />
        </div>
        <p class="text-xs text-slate-500">建議包含大寫字母、數字與符號。</p>
      </div>
      <AuthField v-model="confirmPassword" label="確認密碼" type="password" :icon="LockKeyhole" autocomplete="new-password" required :error="touched && password !== confirmPassword ? '密碼確認不一致' : null" />
      <div>
        <label class="mb-2 block text-xs font-black text-slate-300">Email / 簡訊驗證碼</label>
        <div class="grid grid-cols-[1fr_auto] gap-2">
          <input v-model="code" class="field h-12 rounded-2xl bg-slate-950/35" required />
          <button class="btn-secondary" type="button" :disabled="sendingOtp" @click="sendOtp">{{ sendingOtp ? '送出中' : otpSent ? '重新發送' : '發送 OTP' }}</button>
        </div>
      </div>
    </div>

    <label class="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-slate-300">
      <input v-model="terms" class="mt-1 accent-amber-300" type="checkbox" />
      <span>我同意 DOKER 服務條款與隱私權政策，並了解保固、訂單與會員資料將用於平台服務。</span>
    </label>
    <p v-if="status" class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-100"><CheckCircle2 class="h-4 w-4" /> {{ status }}</p>
    <p v-if="error" class="mt-4 rounded-2xl border border-rose-300/25 bg-rose-300/10 p-3 text-sm font-semibold text-rose-100">{{ error }}</p>
    <button class="btn-primary mt-5 h-12 w-full" :disabled="auth.loading">{{ auth.loading ? '建立中...' : '建立會員帳號' }}</button>
    <RouterLink class="mt-5 block text-center text-sm font-black text-accent" to="/auth/login">已經有帳號，返回登入</RouterLink>
  </form>
</template>
