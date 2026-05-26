import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      { path: 'login', name: 'login', component: () => import('@/views/LoginView.vue') },
      { path: 'register', name: 'register', component: () => import('@/views/RegisterView.vue') },
      { path: 'forgot-password', name: 'forgot-password', component: () => import('@/views/ForgotPasswordView.vue') },
    ],
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      { path: '', redirect: '/home' },
      { path: 'home', component: () => import('@/views/customer/HomeView.vue'), meta: { requiresAuth: true, requiresCustomer: true, showBrandFooter: true } },
      { path: 'dashboard', component: () => import('@/views/customer/DashboardView.vue'), meta: { requiresAuth: true, requiresCustomer: true } },
      { path: 'catalog', component: () => import('@/views/customer/CatalogView.vue'), meta: { showBrandFooter: true } },
      { path: 'products/:id', component: () => import('@/views/customer/ProductDetailView.vue'), meta: { showBrandFooter: true } },
      { path: 'cart', component: () => import('@/views/customer/CartCheckoutView.vue'), meta: { requiresAuth: true, requiresCustomer: true, showBrandFooter: true } },
      { path: 'orders', component: () => import('@/views/customer/OrdersView.vue'), meta: { requiresAuth: true, requiresCustomer: true } },
      { path: 'orders/:id', component: () => import('@/views/customer/OrderDetailView.vue'), meta: { requiresAuth: true } },
      { path: 'warranties', component: () => import('@/views/customer/WarrantiesView.vue'), meta: { requiresAuth: true, requiresCustomer: true } },
      { path: 'warranties/:id', component: () => import('@/views/customer/WarrantyDetailView.vue'), meta: { requiresAuth: true } },
      { path: 'vehicles', component: () => import('@/views/customer/VehiclesView.vue'), meta: { requiresAuth: true, requiresCustomer: true } },
      { path: 'services', component: () => import('@/views/customer/ServicesView.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'membership', component: () => import('@/views/customer/MembershipRewardsView.vue'), meta: { requiresAuth: true, requiresCustomer: true, showBrandFooter: true } },
      { path: 'notifications', component: () => import('@/views/customer/NotificationsView.vue'), meta: { requiresAuth: true } },
      { path: 'chat', component: () => import('@/views/customer/ChatView.vue'), meta: { requiresAuth: true } },
      { path: 'qr', component: () => import('@/views/customer/QrView.vue'), meta: { requiresAuth: true } },
      { path: 'news', component: () => import('@/views/customer/NewsView.vue'), meta: { showBrandFooter: true } },
      { path: 'profile', component: () => import('@/views/customer/ProfileView.vue'), meta: { requiresAuth: true } },
      {
        path: 'admin',
        meta: { requiresAdmin: true },
        children: [
          { path: '', redirect: '/admin/dashboard' },
          { path: 'dashboard', component: () => import('@/views/admin/AdminDashboardView.vue') },
          { path: 'orders', component: () => import('@/views/admin/AdminOrdersView.vue') },
          { path: 'commerce', component: () => import('@/views/admin/AdminCommerceView.vue') },
          { path: 'warranties', component: () => import('@/views/admin/AdminWarrantiesView.vue') },
          { path: 'customers', component: () => import('@/views/admin/AdminCustomersView.vue') },
          { path: 'content', component: () => import('@/views/admin/AdminContentView.vue') },
          { path: 'engagement', component: () => import('@/views/admin/AdminEngagementView.vue') },
          { path: 'chat', component: () => import('@/views/customer/ChatView.vue') },
          { path: 'qr', component: () => import('@/views/customer/QrView.vue') },
        ],
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/home' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.user) await auth.hydrate()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return '/dashboard'
  }

  if (to.meta.requiresCustomer && auth.isAdmin) {
    return '/admin/dashboard'
  }

  if ((to.path === '/dashboard' || to.path === '/home') && auth.isAdmin) {
    return '/admin/dashboard'
  }

  if ((to.name === 'login' || to.name === 'register') && auth.isAuthenticated) {
    return auth.isAdmin ? '/admin/dashboard' : '/home'
  }

  return true
})

export default router
