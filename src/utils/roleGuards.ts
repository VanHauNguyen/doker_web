import type { Role } from '@/types/backend'

export const isAdminRole = (role?: Role | string | null): boolean => role === 'ADMIN'
export const isCustomerRole = (role?: Role | string | null): boolean => role === 'CUSTOMER'

export const assertCustomerAction = (role?: Role | string | null, message = 'Admin cannot perform customer action'): void => {
  if (isAdminRole(role)) throw new Error(message)
}
