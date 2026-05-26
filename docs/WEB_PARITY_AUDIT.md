# Web Parity Audit

This file is a working parity checklist for `doker_web`.

Sources:
- Backend: `backend/motorcycle-backend/src`, `backend/motorcycle-backend/prisma/schema.prisma`
- Mobile app: `frontend/motorcycle-app/src/api`, `src/types`, `src/app/screens`, `src/navigation/NavigationRoot.tsx`, `src/utils`
- Vue web: `doker_web/src/api`, `src/types`, `src/stores`, `src/views`, `src/router`

Legend:
- Yes = endpoint/screen/mapping exists and is wired.
- Partial = exists but missing fields, states, or business behavior.
- No = not currently implemented in Vue.

| Module | Backend endpoint exists? | Mobile app uses it? | Vue web currently mapped? | Missing fields/data? | Missing UI states? | Missing admin/customer behavior? | Action needed |
|---|---:|---:|---:|---|---|---|---|
| Auth | Yes: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, OTP, captcha, reset, delete, change email | Yes: login/register/forgot/reset/verify flows, session hydrate, socket reset | Partial | Forgot/reset/change email/delete-account screens incomplete; login does not refetch `/users/me` after token like mobile | Loading/error present only on login/register | Guest/public routing now partial; auth-checked state needs shell treatment | Add forgot/reset/change email/delete account UI; hydrate user after login; stronger auth states |
| User profile | Yes: `/users/me`, profile, avatar, password, fcm token, admin customers | Yes: profile, avatar upload, password, delete account, admin customer list | Partial | `currentPoints`, `membershipTier`, `lifetimeSpending`, upload count absent from profile type/display | Sparse save/upload states | Customer profile only; admin customer detail not available in backend | Improve profile cards, password/delete account disabled where incomplete, avatar upload errors |
| Vehicles | Yes: create/list/update image/update/delete | Yes: list/add/edit/image; admin sees all | Partial | `mileage`, `note`, `verified`, owner fields not fully rendered | No per-card loading/error/empty sophistication | Admin update/delete differs from customer create/image | Add edit/delete panels, full fields, admin/customer action gating |
| Services | Yes: public list/detail; admin create/update/delete | Yes: service list admin-only create/manage; customer legacy booking disabled | Partial | Description, warranty duration, active state partially displayed | No disabled legacy customer state | Customer must not book legacy service; admin manages services | Convert services page to admin management; expose customer-disabled state/TODO |
| Orders | Yes: create/list/detail/active warranty/pending warranty/confirm/quick-create/fulfillment | Yes: list filters, detail timeline, review composer, admin next actions | Partial | `items`, `payments`, delivery fields, vehicle snapshots, review flags partial | List/detail empty/loading minimal | Admin next-actions partial; customer/admin list scoping via backend role | Add filters, lifecycle timeline, detail sections, quick-create admin panel |
| Checkout/payment | Yes: checkout preview/create-order; payment session/webhook/list/detail | Yes: cart checkout delivery/payment rules, coupon validation, vehicle/manual snapshot, payment result | Partial | `requiresVehicleInfo`, `itemCount`, payment session response, payment result fields partial | Error/preview states basic | Admin blocked from cart/checkout now | Add payment result panel, preview summary, disabled unsupported providers |
| Warranties | Yes: list/admin/dashboard/detail/create/log CRUD | Yes: warranty list/detail, QR, logs | Partial | Metadata product/variant/vehicle images, computed status, order item link incomplete | Detail loading/error limited; no separate detail route | Admin/customer role split partial | Add warranty detail panel, logs per warranty, QR/action display |
| Warranty logs | Yes: add/update/delete/list | Yes: admin add/update/delete, customer read logs | Partial | Update/delete controls minimal | Missing confirmation/error | Admin only enforced by route/page not per action | Add log CRUD states and customer read-only detail |
| QR | Yes: user QR, admin scan, warranty QR, reward redemption scan via rewards | Yes: user QR, admin scan/result, reward QR parsing | Partial | QR image rendering not implemented; raw payload shown | Scan error/result states basic | Admin-only scan; customer can generate own QR | Add parsed result cards, admin-only scanner UI, disabled camera note for web |
| Notifications | Yes: list, unread count, mark read, admin test push, Socket.IO | Yes: unread store, push navigation, notification screen | Partial | `data` routing/action links not rendered | No empty/error/loading polish | Admin test push exists only in content page | Add route links from notification data; better unread sync |
| Chat | Yes: room/users/room by user/messages/send + Socket.IO | Yes: admin user list, customer room, sorted messages, unread store | Partial | User list normalization, last message, unread data partial | Basic state only | Admin user selection; customer own room | Add sorted messages, empty/error/loading, admin list fields |
| News | Yes: public/admin/create/update/delete/publish | Yes: public content and admin news management | Partial | `type`, `imageUrl`, publish state partial | No image upload state | Admin-only management | Add image upload, edit/delete, publish state |
| Shop/products | Yes: products/categories/reviews/images/inventory | Yes: shop home/list/detail/reviews/admin product/category/inventory | Partial | Variants/options/reviews/images/inventory logs partial | Product skeleton/errors sparse | Admin management separate; customer add cart only | Add reviews, variant option display, admin image/category/inventory controls |
| Cart | Yes: get/add/update/remove/clear | Yes: customer-only cart, quantities, subtotal | Partial | `selectedOptions`, unit price, variant snapshots partial | Basic empty/loading | Admin blocked now | Add selected options, totals, clear-cart, error states |
| Coupons | Yes: mine/validate/apply/admin CRUD/usages | Yes: coupon availability, checkout application, admin coupon manager | Partial | Assignments, applicability metadata, usage status partial | Basic | Customer-only mine/apply; admin CRUD | Add admin assignments/usages table, checkout validation feedback |
| Rewards | Yes: public/tasks/complete/history/redeem/redemptions/QR/admin CRUD/redemptions | Yes: rewards/task center/history/redemptions/admin scans | Partial | `qrPayload`, redemption states, history partial | Basic | Customer-only redeem/tasks; admin redemptions | Add redemptions/history/admin redemption actions |
| Membership | Yes: me/tiers/admin tier CRUD | Yes: membership progress, tier benefits, admin tier manager | Partial | `tier`, `nextTier`, `progress`, benefits not fully rendered | Basic | Customer membership, admin tier CRUD | Add progress/tier benefit UI; admin tier edit/delete |
| Admin dashboard | Yes through many admin endpoints; no single dashboard endpoint | Yes: AdminDataScreen aggregates | Partial | Counts/revenue/warranty/points summaries partial | Basic | Admin-only route exists | Aggregate orders/payments/warranties/customers/points with cards/tables |
| Admin order management | Yes: orders, confirm, fulfillment, quick-create, pending warranty | Yes: next-step action logic, quick create | Partial | Quick-create absent; next action partial | Basic | Admin-only | Add quick-create form and next-action cards |
| Admin warranty management | Yes: warranty dashboard/list/log CRUD/create | Yes: admin warranty/log management | Partial | Dashboard pending orders not shown; create warranty absent | Basic | Admin-only | Add dashboard summary, pending orders, logs detail |
| Admin service/product/news management | Yes: services/products/categories/news CRUD; upload images | Yes: full management screens | Partial | Edit/delete/image/category fields incomplete | Basic | Admin-only | Add CRUD dialogs/panels and image upload |
| Upload/avatar/image flows | Yes: `/upload/single`, `/upload/multiple`, user avatar, vehicle image, product/news images via uploaded URL | Yes: image picker/upload normalization | Partial | Multi upload not used; publicId not surfaced | Upload states basic | Protected upload only | Add reusable upload control and use in avatar/vehicle/product/news |

## Immediate implementation priorities in this pass

1. Add reusable page state, upload, detail panel, form controls, and table polish.
2. Expand API layer/types to include missing backend endpoints and real Prisma fields.
3. Improve customer pages for cart/checkout/orders/warranties/vehicles/profile/membership.
4. Improve admin pages for dashboard/orders/warranties/commerce/content/engagement.
5. Keep unsupported backend gaps explicit with disabled UI rather than fake data.

## UX/product quality overhaul notes

Completed in this pass:
- Added premium design-system primitives: `PremiumHero`, `KpiCard`, `TimelineRail`, `FilterBar`, `ToastHost`, richer `PageState`, `SectionCard`, `FieldGrid`, and reusable upload controls.
- Upgraded global shell with branded glass sidebar, active navigation hierarchy, breadcrumb context, responsive top bar, and global toast host.
- Upgraded customer dashboard into a member portal with real order, warranty, points, lifetime spend, lifecycle, and news data.
- Upgraded admin dashboard into an operations command center with real orders, customers, payments, warranties, and points aggregates.
- Upgraded order list/detail with filters, lifecycle labels, timeline visualization, payments, delivery destination, and item detail.
- Upgraded checkout, catalog, membership, warranties, and admin management pages to use richer cards, visual hierarchy, and real backend fields.
- Rechecked stale generated JS/d.ts artifacts: none should exist under `src`.

Remaining quality gaps:
- Full modal CRUD editors and side drawers are still lighter than the React Native admin management flows.
- Web camera scanning is not implemented; QR scan remains token/payload input because no browser camera scanner has been added.
- No dedicated backend analytics endpoint exists, so dashboard analytics remain client-side aggregations.

## Traditional Chinese UX and Home parity pass - 2026-05-26

| Area | Current finding | Mobile reference | Action |
| --- | --- | --- | --- |
| Global language | Many visible labels remained English across navigation, auth, customer pages, admin pages, buttons, empty states, and status badges. | Mobile app already uses Taiwan Traditional Chinese for Home, news, QR, membership, profile, and operational copy. | Convert user-facing Vue text to natural Traditional Chinese and keep technical product/API names only where appropriate. |
| Home | Vue first screen was a dashboard-style member portal, not the mobile `HomeScreen` experience. | `HomeScreen.tsx`, `YouTubeSection.tsx`, `NotificationHeader.tsx` use banners, announcement cards, YouTube, contact shortcuts, quick actions, and premium service entry points. | Add a customer-facing `/home` route with greeting, member points, warranty/order summaries, quick actions, news/promos, video cards, recommendations, QR/notification entries, and contact shortcuts. |
| Status labels | `StatusBadge` rendered raw backend enums. | Mobile screens render localized status and lifecycle language. | Map real backend enum values to Traditional Chinese labels while preserving enum-driven colors. |
| Customer experience | Several pages still felt like CRUD panels and used generic English labels. | Shop, warranty, service, membership, QR, notification, and profile screens use card-based mobile-first flows. | Polish labels, empty states, filter bars, lifecycle cards, product/service cards, and checkout wording for Taiwan service/ecommerce context. |
| Admin experience | Admin labels and table headings were still English. | Mobile admin screens use role-specific management flows for news, tiers, services, and orders. | Convert admin navigation/pages to Traditional Chinese and retain role-gated management behavior. |
| Data mapping | Home did not aggregate all available backend sources. | Home pulls news and video content and provides entries into app flows. | Home aggregates orders, warranties, membership, news, products, vehicles, notifications, and YouTube where backend endpoints exist. |
