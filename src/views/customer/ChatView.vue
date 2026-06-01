<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { chatApi, createRealtimeSocket } from '@/api'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/PageHeader.vue'
import { dateTime } from '@/utils/format'
import type { ApiRecord, ChatMessage, ChatRoom } from '@/types/backend'

const auth = useAuthStore()
const room = ref<ChatRoom | null>(null)
const messages = ref<ChatMessage[]>([])
const usersPayload = ref<ApiRecord | null>(null)
const content = ref('')
const socket = createRealtimeSocket()
const panel = ref<HTMLDivElement | null>(null)
const sending = ref(false)

const scrollDown = async (): Promise<void> => {
  await nextTick()
  if (panel.value) panel.value.scrollTop = panel.value.scrollHeight
}

const openRoom = async (userId?: string): Promise<void> => {
  room.value = userId ? await chatApi.roomByUser(userId) : await chatApi.myRoom()
  messages.value = await chatApi.messages(room.value.id)
  socket.emit('join_room', room.value.id)
  await scrollDown()
}

const send = async (): Promise<void> => {
  if (!room.value || !content.value.trim()) return
  sending.value = true
  const text = content.value
  content.value = ''
  try {
    if (socket.connected) {
      socket.emit('message:send', { roomId: room.value.id, content: text })
    } else {
      const message = await chatApi.send({ roomId: room.value.id, content: text })
      messages.value.push(message)
      await scrollDown()
    }
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  socket.on('receive_message', (message: ChatMessage) => {
    if (message.roomId === room.value?.id) {
      messages.value.push(message)
      void scrollDown()
    }
  })
  socket.connect()
  await openRoom()
  if (auth.isAdmin) usersPayload.value = await chatApi.users()
})

onBeforeUnmount(() => {
  socket.disconnect()
})
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="客服聊天室" description="使用後端 Socket.IO：join_room、message:send、receive_message。" />
    <div class="grid min-w-0 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside class="surface rounded-lg p-4">
        <button class="btn-secondary w-full" @click="openRoom()">我的聊天室</button>
        <div v-if="auth.isAdmin" class="mt-4 space-y-2">
          <button
            v-for="user in (usersPayload?.data as Array<{ id: string; name?: string; email?: string }> | undefined) ?? []"
            :key="user.id"
            class="w-full rounded-md border border-line p-3 text-left text-sm hover:bg-white/[0.05]"
            @click="openRoom(user.id)"
          >
            <span class="block truncate font-semibold text-white">{{ user.name ?? user.email }}</span>
            <span class="block truncate text-slate-500">{{ user.email }}</span>
          </button>
        </div>
      </aside>
      <section class="surface flex h-[calc(100dvh-13rem)] min-h-[420px] min-w-0 flex-col rounded-lg lg:h-[640px]">
        <div ref="panel" class="flex-1 space-y-3 overflow-y-auto p-4">
          <div v-for="message in messages" :key="message.id" class="max-w-[88%] break-words rounded-lg border border-line p-3 sm:max-w-[78%]" :class="message.senderId === auth.user?.id ? 'ml-auto bg-accent/15' : 'bg-white/[0.04]'">
            <p class="text-sm text-white">{{ message.content }}</p>
            <p class="mt-1 text-[11px] text-slate-500">{{ dateTime(message.createdAt) }}</p>
          </div>
        </div>
        <form class="border-t border-line p-4" @submit.prevent="send">
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input v-model="content" class="field" placeholder="輸入訊息" />
            <button class="btn-primary w-full sm:w-auto" :disabled="sending">{{ sending ? '送出中' : '送出' }}</button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>
