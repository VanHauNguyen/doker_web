<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { authApi } from '@/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const identifier = ref('')
const password = ref('')
const captcha = ref('')
const captchaKey = ref(crypto.randomUUID())
const error = ref<string | null>(null)

const captchaUrl = computed(() => authApi.captchaUrl(captchaKey.value))

const refreshCaptcha = (): void => {
  captchaKey.value = crypto.randomUUID()
  captcha.value = ''
}

const submit = async (): Promise<void> => {
  error.value = null
  try {
    await auth.login({
      identifier: identifier.value,
      password: password.value,
      captcha: captcha.value,
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
  <form class="surface space-y-4 rounded-lg p-6" @submit.prevent="submit">
    <div>
      <label class="label">Email 或手機</label>
      <input v-model="identifier" class="field mt-2" autocomplete="username" required />
    </div>
    <div>
      <label class="label">密碼</label>
      <input v-model="password" class="field mt-2" type="password" autocomplete="current-password" required />
    </div>
    <div>
      <label class="label">驗證碼</label>
      <div class="mt-2 grid grid-cols-[1fr_auto] gap-2">
        <input v-model="captcha" class="field" required />
        <button class="overflow-hidden rounded-md border border-line bg-white" type="button" @click="refreshCaptcha">
          <img :src="captchaUrl" alt="驗證碼" class="h-10 w-28 object-cover" />
        </button>
      </div>
    </div>
    <p v-if="error" class="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-rose-200">{{ error }}</p>
    <button class="btn-primary w-full" :disabled="auth.loading">登入</button>
    <p class="text-center text-sm text-slate-400">
      還沒有帳號？
      <RouterLink class="font-semibold text-accent" to="/auth/register">立即註冊</RouterLink>
    </p>
    <RouterLink class="block text-center text-sm font-semibold text-accent" to="/auth/forgot-password">忘記密碼？</RouterLink>
  </form>
</template>
