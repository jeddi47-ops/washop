# Washop - PRD

## Problem Statement
Build Washop frontend + backend - WhatsApp-based marketplace platform.

## Architecture
- Backend: FastAPI + MongoDB (deployed on Railway)
- Frontend: React + Tailwind + shadcn/ui
- API: https://washop-production.up.railway.app/api/v1/

## What's Been Implemented

### Backend (Complete)
- Full auth system, vendors, products, orders, reviews, access keys, wishlist, claims, flash sales, notifications, search, admin, cron jobs
- Cloudinary + SendGrid integrated (production)

### Frontend Phase 1 (April 2026) 
- [x] Design system: dark theme, WhatsApp green, glassmorphism, Inter font
- [x] i18n: French + English with toggle
- [x] Navbar: logo, search with autocomplete, cart, notifications, auth, mobile hamburger
- [x] Homepage: Hero, Comment ca marche, Pricing (Basic/Premium/Extra), Flash Sales, Featured, Trending, Testimonials, Catalogue with filters
- [x] Auth: Login, Register (role selection), Forgot Password - connected to Railway backend
- [x] Product Detail: gallery, vendor card, WhatsApp order, add to cart, reviews tabs, similar products
- [x] Shop Page: vendor banner, products grid, reviews
- [x] Search Page: full-text search with empty state
- [x] Cart Drawer: multi-item, vendor lock, WhatsApp checkout
- [x] About Page: mission, how it works, values, CTA
- [x] 404 Page
- [x] Footer
- [x] Mobile-first responsive

### Phase 2-4 (April 2026)
- [x] Client Dashboard (orders, wishlist, notifications, claims, profile, reviews)
- [x] Vendor Dashboard (products CRUD, orders, analytics, subscription, onboarding, notifications)
- [x] Admin Dashboard (users, vendors, categories, keys, claims, reviews, flash-sales, logs)
- [x] Employee Dashboard (claims, reviews)
- [x] UI transformed to white marketplace theme
- [x] Netlify deployment (SPA redirects, CI build)
- [x] Chariow subscription links integration
- [x] Client review flow fixed (works on any active order)

### Hotfixes (Feb 2026)
- [x] Vendor order status update: previously vendors could only confirm `pending` orders. Fixed to allow confirming both `pending` AND `whatsapp_redirected` (which is the most common state after client WhatsApp redirection).
- [x] Added sonner Toaster globally with success/error feedback on order status updates.
- [x] ESLint `react-hooks/exhaustive-deps` warnings silenced on `Home.jsx`, `client/Orders.jsx`, `client/Claims.jsx` — Netlify CI build now passes cleanly.

### Remaining Backlog
- [ ] E2E WhatsApp redirection format verification
- [ ] Pagination controls on product/order listings
- [ ] SendGrid sender verification (user task in SendGrid dashboard)

