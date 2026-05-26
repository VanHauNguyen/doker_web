<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { authApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import type { OtpType } from '@/types/backend'

const auth = useAuthStore()
const router = useRouter()
const name = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const code = ref('')
const status = ref<string | null>(null)
const error = ref<string | null>(null)

const sendOtp = async (): Promise<void> => {
  error.value = null
  await authApi.sendOtp(email.value || phone.value, 'REGISTER' satisfies OtpType)
  status.value = 'OTP_SENT'
}

const submit = async (): Promise<void> => {
  error.value = null
  try {
    await auth.register({
      name: name.value,
      email: email.value,
      phone: phone.value || undefined,
      password: password.value,
      code: code.value,
    })
    await router.push('/home')
  } catch (err) {
    error.value = err instanceof Error ? err.message : '註冊失敗，請確認資料是否正確'
  }
}
</script>

<template>
  <form class="surface space-y-4 rounded-lg p-6" @submit.prevent="submit">
    <div>
      <label class="label">姓名</label>
      <input v-model="name" class="field mt-2" required />
    </div>
    <div>
      <label class="label">Email</label>
      <input v-model="email" class="field mt-2" type="email" required />
    </div>
    <div>
      <label class="label">手機</label>
      <input v-model="phone" class="field mt-2" />
    </div>
    <div>
      <label class="label">密碼</label>
      <input v-model="password" class="field mt-2" type="password" required />
    </div>
    <div>
      <label class="label">簡訊 / Email 驗證碼</label>
      <div class="mt-2 grid grid-cols-[1fr_auto] gap-2">
        <input v-model="code" class="field" required />
        <button class="btn-secondary" type="button" @click="sendOtp">送出驗證碼</button>
      </div>
    </div>
    <p v-if="status" class="text-sm text-mint">驗證碼已送出，請查看手機或 Email。</p>
    <p v-if="error" class="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-rose-200">{{ error }}</p>
    <button class="btn-primary w-full" :disabled="auth.loading">建立會員帳號</button>
    <RouterLink class="block text-center text-sm font-semibold text-accent" to="/auth/login">返回登入</RouterLink>
  </form>
</template>
