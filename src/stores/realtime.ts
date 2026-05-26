import { ref } from 'vue'
import { defineStore } from 'pinia'
import { createRealtimeSocket, notificationsApi } from '@/api'
import type { NotificationItem } from '@/types/backend'

export const useRealtimeStore = defineStore('realtime', () => {
  const socket = ref<ReturnType<typeof createRealtimeSocket> | null>(null)
  const notifications = ref<NotificationItem[]>([])
  const unread = ref(0)

  const refreshNotifications = async (): Promise<void> => {
    notifications.value = await notificationsApi.list()
    const payload = await notificationsApi.unreadCount()
    unread.value = typeof payload === 'number' ? payload : payload.count
  }

  const connect = (): void => {
    if (socket.value?.connected) return
    socket.value = createRealtimeSocket()
    socket.value.on('notification', (payload: NotificationItem) => {
      notifications.value = [payload, ...notifications.value]
      unread.value += 1
    })
    socket.value.connect()
  }

  const disconnect = (): void => {
    socket.value?.disconnect()
    socket.value = null
  }

  const markRead = async (id: string): Promise<void> => {
    await notificationsApi.markRead(id)
    const notification = notifications.value.find((item) => item.id === id)
    if (notification && !notification.isRead) unread.value = Math.max(0, unread.value - 1)
    if (notification) notification.isRead = true
  }

  return { notifications, unread, refreshNotifications, connect, disconnect, markRead }
})
