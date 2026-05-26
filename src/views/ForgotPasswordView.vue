<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { authApi } from '@/api'

const target = ref('')
const code = ref('')
const newPassword = ref('')
const sent = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)

const sendOtp = async (): Promise<void> => {
  error.value = null
  await authApi.sendOtp(target.value, 'RESET_PASSWORD')
  sent.value = true
  message.value = '驗證碼已送出'
}

const reset = async (): Promise<void> => {
  error.value = null
  try {
    await authApi.resetPassword({ target: target.value, code: code.value, newPassword: newPassword.value })
    message.value = '密碼已更新，請重新登入'
  } catch (err) {
    error.value = err instanceof Error ? err.message : '重設密碼失敗'
  }
}
</script>

<template>
  <form class="surface space-y-4 rounded-lg p-6" @submit.prevent="reset">
    <div>
      <label class="label">Email 或手機</label>
      <input v-model="target" class="field mt-2" required />
    </div>
    <button class="btn-secondary w-full" type="button" @click="sendOtp">送出重設驗證碼</button>
    <template v-if="sent">
      <input v-model="code" class="field" placeholder="驗證碼" required />
      <input v-model="newPassword" class="field" type="password" placeholder="新密碼" required />
      <button class="btn-primary w-full">重設密碼</button>
    </template>
    <p v-if="message" class="text-sm text-mint">{{ message }}</p>
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>
    <RouterLink class="block text-center text-sm font-semibold text-accent" to="/auth/login">返回登入</RouterLink>
  </form>
</template>
