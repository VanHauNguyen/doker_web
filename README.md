# DOKER Warranty Service Platform

DOKER Web is a Vue 3 production web client for a premium motorcycle warranty, service, ecommerce, and membership ecosystem. It connects customer storefront flows, warranty ownership, QR verification, rewards, coupons, and an operations-grade admin console to the same backend used by the mobile app.

The project is designed as a backend-driven SaaS/ecommerce interface: Vue renders real API data, respects role guards, and follows the business contracts implemented by the NestJS backend and React Native mobile application.

## Screenshots

Add product screenshots in this section when preparing a public portfolio or client delivery package:

- Customer home, catalog, and checkout
- Membership, rewards, coupons, and QR wallet
- Premium login, registration, and password recovery
- Vehicle garage with uploaded images and warranty/order image reuse
- Admin dashboard and engagement management
- Warranty, order, product, service, and support operations

## Tech Stack

- Vue 3 with Composition API
- Vite
- TypeScript
- Pinia
- Vue Router
- Tailwind CSS with a custom dark luxury design system
- Axios API client with token refresh
- Socket.IO client for realtime chat
- `qrcode` for scannable QR rendering
- Lucide Vue icons

## Architecture

The web app is organized around a customer platform and an admin platform:

- `src/api`: typed API adapters for backend modules
- `src/stores`: Pinia stores for authentication, cart, and shared state
- `src/router`: route guards, role restrictions, and route metadata
- `src/views/customer`: customer commerce, warranty, membership, QR, chat, and profile flows
- `src/views/admin`: admin operations modules
- `src/components`: reusable layout, state, admin, QR, and dashboard components
- `src/utils`: normalization, formatting, status, membership/reward/coupon, and order helpers
- `src/config`: centralized external platform links

## Features

- Customer authentication with JWT refresh
- Premium auth onboarding with captcha, OTP registration, reset-password OTP, password visibility, validation, and loading states
- Product catalog, product detail, cart, checkout, payment handoff, and Shopee fallback links
- Vehicle profile with image upload/resolution and warranty/order ownership flows
- Real scannable QR codes for member and supported redemption/warranty flows
- Membership tier progress, benefits, reward tasks, reward redemption, and coupon wallet
- Production order detail, warranty certificate detail, and notification deep-link navigation
- Admin dashboard and management modules for commerce, service, warranty, users, engagement, content, chat, and QR lookup
- Realtime chat support through Socket.IO
- Route-aware branded footer and smooth production animation utilities

## Customer Platform Features

- Home experience with curated local banners and official platform links
- Catalog and product detail shopping flows
- Checkout with delivery/payment rules and backend coupon validation
- Orders with lifecycle timeline, payment records, logistics, vehicle installation data, linked warranties, and support actions
- Warranty certificate detail with coverage, lifecycle timeline, logs, QR credential, linked vehicle, and linked order
- Vehicle cards and order/warranty vehicle sections resolve images from vehicle records, order snapshots, uploaded image arrays, and relative backend URLs
- Notifications with unread state, type grouping, realtime updates, and deep links into orders, warranties, membership, coupons, chat, news, QR, or fallback system views
- Vehicles, profile, notifications, and support chat
- Membership center with tier progress, points, benefits, coupons, reward tasks, and redemption history
- QR wallet for member tokens and supported backend QR payloads

## Admin Platform Features

- Operations dashboard with real backend aggregation where available
- Order lifecycle management using backend-supported status actions
- Warranty management with lifecycle logs
- Product, service, category, news, coupon, reward, and membership tier management
- Customer lookup and support chat workflows
- Reward redemption scan, confirm, and cancel actions
- Upload-driven image workflows where backend upload support is available

## Order Lifecycle

Order detail is driven by `GET /orders/:id` and payment records from `GET /payments/order/:orderId`. The page maps request id, order/payment/fulfillment status, delivery method, recipient data, CVS/store pickup details, logistics provider, tracking number, coupon code/id, discount, subtotal, shipping fee, total, items, vehicle snapshot, vehicle images, linked warranties, customer data for admins, and backend timestamps.

Admins can execute only backend-supported operational actions from the detail view: `POST /orders/:id/confirm` for pending orders and `PATCH /orders/:id/fulfillment` for the next valid fulfillment status. Unsupported transitions are not invented client-side.

## Warranty Lifecycle

Warranty detail is driven by `GET /warranties/:id` plus `GET /warranties/:id/logs`. It renders a certificate-style view with warranty type, status, start/end dates, source product/service/order item, selected options, vehicle data, vehicle images, linked order, lifecycle timeline, and service logs. Warranty QR credentials use the backend warranty QR endpoint and are rendered as scannable QR images in the web client.

Admin log create/update/delete support exists in the backend through `/warranties/log` and `/warranties/log/:id`; the web detail page currently focuses on rendering the full log lifecycle while admin management remains available from the warranty admin module.

## Notification Deep Links

Notification routing is centralized in `src/utils/notificationNavigation.ts`. It parses backend payload fields such as `screen`, `entityType`, `entityId`, `orderId`, `warrantyId`, `couponId`, `rewardId`, `rewardRedemptionId`, `roomId`, `newsId`, and QR-related metadata. When backend payloads are partial, it infers navigation from notification type and joined entities returned by `/notifications`.

Mapped destinations include:

- order/payment notifications to `/orders/:id`
- warranty notifications to `/warranties/:id`
- reward, coupon, membership, and points notifications to membership or admin engagement
- chat notifications to `/chat`
- vehicle notifications to `/vehicles`
- news notifications to `/news`
- QR notifications to `/qr` or the related warranty detail
- unknown system notifications remain in `/notifications`

## Backend Integration

The default backend points to the deployed Render service:

```text
https://motorcycle-backend-21r0.onrender.com
```

Set `VITE_API_BASE_URL` to target another backend environment. The web client uses backend response structures directly and normalizes only presentation-level differences.

## Authentication And Roles

The app stores access and refresh tokens in browser storage, attaches bearer tokens through Axios interceptors, and refreshes sessions on `401` responses when possible. Routes use metadata for:

- authenticated customer pages
- admin-only pages
- public commerce pages
- branded footer visibility

## Realtime, Chat, And QR

Realtime chat and notifications use Socket.IO with the current access token. Incoming notifications are prepended into the notification center and update unread counts immediately. QR flows use backend tokens and render scannable QR images/canvas through the Vue QR component stack. Admin QR and reward redemption workflows keep manual token input as a fallback when camera scanning is not available.

## Membership, Reward, And Coupon System

The engagement layer is backend-driven and mirrors the mobile app business flow:

- membership tiers, thresholds, point earn rates, and benefit JSON
- current tier, next tier, remaining spend, and progress
- reward listing, detail, redemption state, stock/date/point validation, and QR redemption display
- reward tasks with manual completion only for backend-supported task keys
- coupon wallet with active, used, expired, unavailable, minimum spend, member tier, assignment, usage limit, and applicability states
- checkout coupon selection by coupon id with backend revalidation
- admin CRUD for tiers, rewards, and coupons where endpoints support it

## Build And Setup

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Environment Variables

Create `.env` from `.env.example`:

```bash
VITE_API_BASE_URL=https://motorcycle-backend-21r0.onrender.com
VITE_SOCKET_URL=https://motorcycle-backend-21r0.onrender.com
```

`VITE_SOCKET_URL` may be omitted when the realtime socket shares the same backend host.

## Deployment

The app builds to static assets through Vite and can be deployed to Render Static Sites, Netlify, Vercel, Cloudflare Pages, or any static hosting provider. Configure environment variables for the target backend before building.

## Folder Structure

```text
src/
  api/           Backend API adapters and socket factory
  assets/        Local brand and banner assets
  components/    Shared UI, admin, QR, and dashboard components
  config/        External links and platform config
  directives/    Reveal and interaction directives
  layouts/       App shell and footer
  router/        Route definitions, guards, and metadata
  stores/        Pinia state stores
  types/         Backend-facing TypeScript interfaces
  utils/         Formatting, status, engagement, and order helpers
  views/         Customer and admin pages
```

## Design System And Theme

The current theme is a balanced premium dark luxury system: deep navy and charcoal surfaces, champagne gold accents, soft glass cards, refined status colors, and subtle production animations. The UI is tuned for an automotive service and membership platform rather than a generic admin template.

Auth screens use the same production visual language: cinematic split layout, glass forms, floating-style fields with icons, focus glow, password visibility controls, progress feedback, OTP states, and responsive mobile/desktop composition. Vehicle imagery is normalized through `src/utils/vehicleImage.ts` so backend uploads, relative URLs, vehicle images, and order/warranty snapshots render consistently.

## API Architecture

API access is centralized through `src/api/client.ts` and `src/api/index.ts`. The Axios client handles base URL configuration, authorization headers, refresh-token retry, friendly Traditional Chinese error messages, and typed module adapters.

## Admin Operations Flow

Admin screens are backend-capability driven. Order detail exposes confirm and fulfillment transitions only where the order module supports them. Warranty operations use the backend warranty detail/log endpoints. Engagement operations use membership tier, reward, redemption, and coupon endpoints without client-side fake state. Notifications route admins to the correct management context when payload type indicates admin work.

## Future Improvements

- Camera-based web scanner for admin QR workflows
- More granular admin analytics if backend aggregate endpoints are added
- Dedicated public screenshot and case-study package
- Expanded automated E2E coverage for checkout, QR, and admin engagement flows

## License And Contact

This project is part of the DOKER motorcycle warranty system portfolio. Confirm licensing and client distribution terms with the project owner before publishing or reuse.
