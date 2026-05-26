<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { newsApi, notificationsApi } from '@/api'
import PremiumHero from '@/components/PremiumHero.vue'
import AdminDetailDrawer from '@/components/admin/AdminDetailDrawer.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import ImageUploader from '@/components/admin/ImageUploader.vue'
import { statusLabel } from '@/utils/status'
import type { NewsItem, NewsType } from '@/types/backend'

const news = ref<NewsItem[]>([])
const title = ref('')
const content = ref('')
const imageUrl = ref('')
const type = ref<NewsType>('NEWS')
const testUserId = ref('')
const testToken = ref('')
const pushResult = ref<unknown>(null)
const selected = ref<NewsItem | null>(null)
const deleteId = ref<string | null>(null)

const load = async (): Promise<void> => {
  news.value = await newsApi.adminList()
}

const create = async (): Promise<void> => {
  await newsApi.create({ title: title.value, content: content.value, imageUrl: imageUrl.value || undefined, type: type.value, isPublished: false })
  title.value = ''
  content.value = ''
  imageUrl.value = ''
  await load()
}

const testPush = async (): Promise<void> => {
  pushResult.value = await notificationsApi.testPush({ userId: testUserId.value || undefined, token: testToken.value || undefined })
}

const save = async (): Promise<void> => {
  if (!selected.value) return
  await newsApi.update(selected.value.id, selected.value)
  selected.value = null
  await load()
}

const remove = async (): Promise<void> => {
  if (!deleteId.value) return
  await newsApi.remove(deleteId.value)
  deleteId.value = null
  await load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <PremiumHero eyebrow="內容中心" title="新聞公告發布與推播測試。" description="透過後端管理端點建立、上傳、發布、下架並測試 FCM 推播。" />
    <div class="grid gap-6 lg:grid-cols-2">
      <form class="surface space-y-3 rounded-lg p-4" @submit.prevent="create">
        <h2 class="font-bold text-white">建立公告</h2>
        <input v-model="title" class="field" placeholder="標題" required />
        <select v-model="type" class="field">
          <option value="NEWS">公告</option>
          <option value="PROMO">優惠</option>
          <option value="TIP">保養知識</option>
        </select>
        <input v-model="imageUrl" class="field" placeholder="圖片 URL" />
        <ImageUploader v-model="imageUrl" />
        <textarea v-model="content" class="field min-h-28" placeholder="內容" required />
        <button class="btn-primary">建立</button>
      </form>
      <form class="surface space-y-3 rounded-lg p-4" @submit.prevent="testPush">
        <h2 class="font-bold text-white">FCM 推播測試</h2>
        <input v-model="testUserId" class="field" placeholder="會員 ID" />
        <input v-model="testToken" class="field" placeholder="直接指定 Token" />
        <button class="btn-primary">送出測試</button>
        <pre v-if="pushResult" class="overflow-auto rounded-md bg-black/30 p-3 text-xs">{{ pushResult }}</pre>
      </form>
    </div>
    <AdminTable :columns="['標題', '類型', '發布', '操作']">
      <tr v-for="item in news" :key="item.id" class="table-row">
        <td class="px-4 py-3 font-semibold text-white">{{ item.title }}</td>
        <td class="px-4 py-3">{{ statusLabel(item.type) }}</td>
        <td class="px-4 py-3">{{ item.isPublished ? '已發布' : '草稿' }}</td>
        <td class="flex flex-wrap gap-2 px-4 py-3">
          <button class="btn-secondary" @click="selected = { ...item }">編輯</button>
          <button class="btn-secondary" @click="newsApi.publish(item.id, !item.isPublished).then(load)">
            {{ item.isPublished ? '下架' : '發布' }}
          </button>
          <button class="btn-danger" @click="deleteId = item.id">刪除</button>
        </td>
      </tr>
    </AdminTable>

    <AdminDetailDrawer :open="Boolean(selected)" :title="selected?.title ?? '公告編輯'" subtitle="內容明細" @close="selected = null">
      <form v-if="selected" class="space-y-4" @submit.prevent="save">
        <input v-model="selected.title" class="field" required />
        <select v-model="selected.type" class="field">
          <option value="NEWS">公告</option>
          <option value="PROMO">優惠</option>
          <option value="TIP">保養知識</option>
        </select>
        <ImageUploader v-model="selected.imageUrl" />
        <textarea v-model="selected.content" class="field min-h-48" required />
        <label class="inline-flex items-center gap-2 text-sm text-slate-300">
          <input v-model="selected.isPublished" type="checkbox" />
          發布
        </label>
        <button class="btn-primary">儲存公告</button>
      </form>
    </AdminDetailDrawer>

    <ConfirmDialog
      :open="Boolean(deleteId)"
      title="刪除公告"
      message="確認刪除此公告？"
      confirm-label="刪除"
      tone="danger"
      @cancel="deleteId = null"
      @confirm="remove"
    />
  </div>
</template>
