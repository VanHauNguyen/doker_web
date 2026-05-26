# Admin Parity Audit

Last updated: 2026-05-26

This audit maps the Vue admin work to the real Nest backend controllers and the React Native admin/QR flows. Status values reflect this parity pass, not theoretical features.

| Module | Backend endpoint | Method | Role required | Vue implemented? | Missing action | Mobile reference | Final status after this pass |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Admin dashboard | `/orders`, `/users/admin/customers`, `/payments/admin/list`, `/warranties/admin/dashboard`, `/points/admin/summary` | GET | Admin for customers/payments/warranty/points | Yes | No single dashboard aggregate endpoint | `AdminDataScreen.tsx` | Improved operational overview with real queues |
| Order management | `/orders` | GET | User/Admin scoped by backend | Yes | Backend has no generic admin update-status endpoint | `adminOrderActions.ts`, `ScanResultScreen.tsx` | List, filters, detail drawer, confirm, fulfillment actions |
| Order management | `/orders/:id` | GET | Owner/Admin | Yes | None | `OrderDetailScreen.tsx` | Detail drawer shows customer, delivery, payment, items, coupon, warranty links |
| Order management | `/orders/:id/confirm` | POST | Admin | Yes | None | `adminOrderActions.ts` | Confirm action wired with confirmation dialog |
| Order management | `/orders/:id/fulfillment` | PATCH | Admin | Yes | Only fulfillment transitions supported | `adminOrderActions.ts` | Fulfillment actions wired by status |
| Order management | `/orders/quick-create` | POST | Admin | Yes | Legacy service-only quick create | Admin maintenance flow | Maintained as backend-supported utility |
| Warranty management | `/warranties/admin` | GET | Admin | Yes | Backend has no warranty update/delete endpoint | `WarrantyDetailScreen.tsx` | List, detail drawer, lifecycle data |
| Warranty management | `/warranties/admin/dashboard` | GET | Admin | Yes | None | `AdminDataScreen.tsx` | Metrics and pending warranty order queue |
| Warranty management | `/warranties/:id`, `/qr/warranty/:id` | GET | Authenticated | Yes | QR scan is admin-only via `/qr/scan/:token` | `WarrantyDetailScreen.tsx` | Detail + real warranty QR rendering |
| Warranty logs | `/warranties/:id/logs` | GET | Authenticated | Yes | None | `WarrantyDetailScreen.tsx` | Timeline list |
| Warranty logs | `/warranties/log` | POST | Admin | Yes | None | Admin scan/result flow | Create log wired |
| Warranty logs | `/warranties/log/:id` | PATCH/DELETE | Admin | Yes | None | Admin scan/result flow | Edit/delete wired with confirmation |
| Customer/user management | `/users/admin/customers` | GET | Admin | Yes | Backend exposes no admin user update/delete endpoint | `AdminDataScreen.tsx` | Search, detail drawer, points link context |
| Service management | `/services`, `/services/:id` | GET/POST/PUT/DELETE | Admin for mutation | Yes | None | Service/admin forms | CRUD form + delete confirmation |
| Product management | `/products/admin/list`, `/products`, `/products/:id` | GET/POST/PATCH/DELETE | Admin for mutation | Yes | None | Catalog/admin commerce | CRUD form, stock adjust, image upload |
| Product images | `/upload/single`, `/products/:id/images`, `/products/:id/images/:imageId` | POST/DELETE | Auth/Admin | Yes | None | Product image upload flow | Preview upload and image add/delete |
| Product inventory | `/products/:id/inventory/adjust`, `/products/:id/inventory/logs` | POST/GET | Admin | Yes | None | Admin commerce | Quick adjust wired |
| Category management | `/product-categories/admin/list`, `/product-categories`, `/product-categories/:id` | GET/POST/PATCH/DELETE | Admin for mutation | Yes | None | Catalog/admin commerce | CRUD form + delete confirmation |
| News/content management | `/news/admin`, `/news`, `/news/:id`, `/news/:id/publish` | GET/POST/PUT/DELETE/PATCH | Admin | Yes | None | News/admin content | Create/update/delete/publish/unpublish |
| Push notification management | `/notifications/admin/test-push` | POST | Admin | Yes | Backend supports test push only, no campaign CRUD | Push diagnostics in profile | Test push form only |
| Coupon management | `/coupons/admin/list`, `/coupons`, `/coupons/:id`, `/coupons/admin/usages` | GET/POST/PATCH/DELETE | Admin | Yes | None | Membership/rewards screens | CRUD, status toggle, usage list |
| Reward management | `/rewards/admin/list`, `/rewards`, `/rewards/:id` | GET/POST/PATCH/DELETE | Admin | Yes | None | Reward screens | CRUD, active toggle |
| Reward redemption | `/rewards/admin/redemptions`, `/rewards/admin/redemptions/scan`, `/rewards/admin/redemptions/:id/confirm`, `/rewards/admin/redemptions/:id/cancel` | GET/POST | Admin | Yes | None | `ScanResultScreen.tsx` | List, manual scan, confirm/cancel |
| Reward QR | `/rewards/redemptions/:id/qr` | GET | Authenticated | Yes | Regenerate not supported | Reward redemption flow | Real QR rendered when token/image exists |
| Membership tier management | `/membership/tiers`, `/membership/tiers/:id` | GET/POST/PATCH/DELETE | Admin for mutation | Yes | None | Membership screens | CRUD form + delete confirmation |
| Chat/customer support | `/chat/users`, `/chat/room/:userId`, `/chat/messages/:roomId`, `/chat/message` | GET/POST | Authenticated; service scopes admin list | Yes | No REST delete/edit messages | Chat screens | User list, room, messages, send |
| Chat realtime | Socket.IO auth token via `createRealtimeSocket` | socket | Authenticated | Partial | No dedicated admin event contract in controller | Chat screens | Existing socket store left intact; REST flow implemented |
| QR admin lookup | `/qr/scan/:token` | GET | Admin | Yes | Camera scanner not implemented in Vue | `ScanScreen.tsx`, `ScanResultScreen.tsx` | Manual fallback scan with structured result |
| QR member | `/qr/user` | POST | Authenticated | Yes | Forced regenerate not supported; token refreshes after expiry | `QRScreen.tsx` | Real QR image/canvas rendered with token and copy |
| Upload/image management | `/upload/single`, `/upload/multiple` | POST | Authenticated | Yes | No gallery/list/delete upload endpoint | Upload usages in mobile forms | Reusable uploader with preview |
