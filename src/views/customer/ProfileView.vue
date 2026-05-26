<script setup lang="ts">
import { ref } from 'vue'
import { uploadApi, usersApi } from '@/api'
import PageHeader from '@/components/PageHeader.vue'
import SectionCard from '@/components/SectionCard.vue'
import FieldGrid from '@/components/FieldGrid.vue'
import UploadButton from '@/components/UploadButton.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const name = ref(auth.user?.name ?? '')
const phone = ref(auth.user?.phone ?? '')
const message = ref<string | null>(null)
const oldPassword = ref('')
const newPassword = ref('')
const passwordMessage = ref<string | null>(null)

const save = async (): Promise<void> => {
  auth.user = await usersApi.updateProfile({ name: name.value, phone: phone.value })
  message.value = '個人資料已更新'
}

const uploadAvatar = async (event: Event): Promise<void> => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const result = await uploadApi.single(file)
  auth.user = await usersApi.updateAvatar(result.url)
}

const setAvatar = async (url: string): Promise<void> => {
  auth.user = await usersApi.updateAvatar(url)
}

const changePassword = async (): Promise<void> => {
  await usersApi.changePassword({ oldPassword: oldPassword.value, newPassword: newPassword.value })
  oldPassword.value = ''
  newPassword.value = ''
  passwordMessage.value = '密碼已更新'
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="個人資料" />
    <SectionCard title="帳號資料">
      <div class="flex flex-col gap-5 md:flex-row md:items-center">
        <img v-if="auth.user?.avatarUrl" :src="auth.user.avatarUrl" alt="大頭照" class="h-24 w-24 rounded-full object-cover" />
        <div v-else class="grid h-24 w-24 place-items-center rounded-full bg-white/[0.06] text-2xl font-bold text-white">{{ auth.user?.name?.slice(0, 1) }}</div>
        <div class="space-y-2">
          <UploadButton @uploaded="setAvatar" />
          <label class="btn-secondary cursor-pointer">
            傳統上傳
            <input class="hidden" type="file" accept="image/*" @change="uploadAvatar" />
          </label>
        </div>
      </div>
      <FieldGrid class="mt-5" :items="[
        { label: '會員 ID', value: auth.user?.id },
        { label: '角色', value: auth.user?.role === 'ADMIN' ? '後台管理員' : '一般會員' },
        { label: 'Email', value: auth.user?.email },
        { label: '手機', value: auth.user?.phone },
      ]" />
    </SectionCard>
    <form class="surface max-w-2xl space-y-4 rounded-lg p-5" @submit.prevent="save">
      <h2 class="text-lg font-bold text-white">基本資料</h2>
      <input v-model="name" class="field" placeholder="姓名" />
      <input v-model="phone" class="field" placeholder="手機" />
      <p v-if="message" class="text-sm text-mint">{{ message }}</p>
      <button class="btn-primary">儲存資料</button>
    </form>
    <form class="surface max-w-2xl space-y-4 rounded-lg p-5" @submit.prevent="changePassword">
      <h2 class="text-lg font-bold text-white">密碼</h2>
      <input v-model="oldPassword" class="field" type="password" placeholder="目前密碼" required />
      <input v-model="newPassword" class="field" type="password" placeholder="新密碼" required />
      <p v-if="passwordMessage" class="text-sm text-mint">{{ passwordMessage }}</p>
      <button class="btn-secondary">變更密碼</button>
    </form>
  </div>
</template>
