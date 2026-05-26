<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { LockKeyhole, Mail, RotateCcw, ShieldCheck } from 'lucide-vue-next'
import { authApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import AuthField from '@/components/auth/AuthField.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const identifier = ref('')
const password = ref('')
const captcha = ref('')
const remember = ref(localStorage.getItem('doker_remember_login') === 'true')
const captchaKey = ref(crypto.randomUUID())
const error = ref<string | null>(null)
const touched = ref(false)

const captchaUrl = computed(() => authApi.captchaUrl(captchaKey.value))
const formValid = computed(() => identifier.value.trim().length >= 3 && password.value.length >= 6 && captcha.value.trim().length >= 3)

const refreshCaptcha = (): void => {
  captchaKey.value = crypto.randomUUID()
  captcha.value = ''
}

const submit = async (): Promise<void> => {
  touched.value = true
  error.value = null
  if (!formValid.value) {
    error.value = '請完整填寫帳號、密碼與驗證碼'
    return
  }
  try {
    localStorage.setItem('doker_remember_login', String(remember.value))
    await auth.login({
      identifier: identifier.value.trim(),
      password: password.value,
      captcha: captcha.value.trim(),
      captchaKey: captchaKey.value,
    })
    await router.push((route.query.redirect as string) || (auth.isAdmin ? '/admin/dashboard' : '/home'))
  } catch (err) {
    error.value = err instanceof Error ? err.message : '登入失敗，請確認帳號、密碼與驗證碼'
    refreshCaptcha()
  }
}
</script>

<template>
  <form class="animate-scale-in rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl" @submit.prevent="submit">
    <div class="mb-6">
      <div class="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-100">
        <ShieldCheck class="h-4 w-4" /> 會員登入
      </div>
      <h2 class="mt-4 text-3xl font-black text-white">歡迎回到 DOKER</h2>
      <p class="mt-2 text-sm leading-6 text-slate-400">登入後同步訂單、保固、點數、優惠券與客服訊息。</p>
    </div>

    <div class="space-y-4">
      <AuthField v-model="identifier" label="Email 或手機" :icon="Mail" autocomplete="username" required :error="touched && identifier.trim().length < 3 ? '請輸入 Email 或手機' : null" />
      <AuthField v-model="password" label="密碼" type="password" :icon="LockKeyhole" autocomplete="current-password" required :error="touched && password.length < 6 ? '密碼至少 6 碼' : null" />
      <div>
        <label class="mb-2 block text-xs font-black text-slate-300">圖形驗證碼</label>
        <div class="grid grid-cols-[1fr_auto] gap-2">
          <input v-model="captcha" class="field h-12 rounded-2xl bg-slate-950/35" required />
          <button class="group overflow-hidden rounded-2xl border border-white/10 bg-white" type="button" @click="refreshCaptcha">
            <img :src="captchaUrl" alt="驗證碼" class="h-12 w-32 object-cover transition group-hover:scale-105" />
          </button>
        </div>
        <button class="mt-2 inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-accent" type="button" @click="refreshCaptcha">
          <RotateCcw class="h-3.5 w-3.5" /> 換一張驗證碼
        </button>
      </div>
    </div>

    <div class="mt-4 flex items-center justify-between gap-3 text-sm">
      <label class="inline-flex items-center gap-2 text-slate-300">
        <input v-model="remember" type="checkbox" class="accent-amber-300" /> 記住登入偏好
      </label>
      <RouterLink class="font-bold text-accent" to="/auth/forgot-password">忘記密碼？</RouterLink>
    </div>

    <p v-if="error" class="mt-4 rounded-2xl border border-rose-300/25 bg-rose-300/10 p-3 text-sm font-semibold text-rose-100">{{ error }}</p>
    <button class="btn-primary mt-5 h-12 w-full" :disabled="auth.loading">{{ auth.loading ? '登入中...' : '登入平台' }}</button>
    <p class="mt-5 text-center text-sm text-slate-400">
      還沒有帳號？
      <RouterLink class="font-black text-accent" to="/auth/register">建立會員帳號</RouterLink>
    </p>
  </form>
</template>
