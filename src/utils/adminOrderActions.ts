import type { FulfillmentStatus, Order } from '@/types/backend'
import { getNextFulfillmentStatus, isInstallationOrder } from './orderFulfillment'

export type AdminOrderAction =
  | { kind: 'CONFIRM_ORDER'; label: string }
  | { kind: 'UPDATE_FULFILLMENT'; label: string; fulfillmentStatus: FulfillmentStatus }
  | { kind: 'VIEW_WARRANTY'; label: string; warrantyId: string }

const terminalStatuses = ['CANCELED', 'CANCELLED', 'FAILED', 'EXPIRED']

export const getAdminOrderActions = (order: Order): AdminOrderAction[] => {
  if (terminalStatuses.includes(order.status)) return []
  const warranty = order.warranties?.[0]
  if ((order.status === 'COMPLETED' || order.fulfillmentStatus === 'COMPLETED') && warranty?.id) {
    return [{ kind: 'VIEW_WARRANTY', label: '查看保固', warrantyId: warranty.id }]
  }
  if (order.status === 'PENDING') return [{ kind: 'CONFIRM_ORDER', label: order.orderType === 'SERVICE' ? '確認舊服務訂單' : '確認訂單' }]
  const next = getNextFulfillmentStatus(order)
  if (!next) return []
  return [{ kind: 'UPDATE_FULFILLMENT', label: labelFor(order, next), fulfillmentStatus: next }]
}

const labelFor = (order: Order, status: FulfillmentStatus): string => {
  if (status === 'PREPARING') return isInstallationOrder(order) ? '待施工' : '備貨中'
  if (status === 'READY_FOR_PICKUP') return '可取貨'
  if (status === 'SHIPPED') return '已出貨'
  if (status === 'DELIVERED') return order.deliveryMethod?.startsWith('CVS') ? '已到達超商' : '已送達'
  if (status === 'PICKED_UP') return '已取貨 / 完成訂單'
  if (status === 'CANCELED') return '取消訂單'
  return isInstallationOrder(order) ? '施工完成 / 完成訂單' : '完成訂單'
}
