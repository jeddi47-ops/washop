# Washop Backend - PRD

## Problem Statement
Build complete backend for Washop, a global WhatsApp-based marketplace platform. Vendors pay subscription via access keys, clients order via WhatsApp redirect. No payment processing between clients/vendors.

## Architecture
- **Stack**: FastAPI (Python) + MongoDB + Cloudinary + SendGrid
- **API Versioning**: All routes under `/api/v1/`
- **Auth**: JWT custom with bcrypt cost 12
- **Documentation**: Swagger at `/api/docs`

## User Personas
- **Client**: Browse, search, order via WhatsApp, review, wishlist, claims
- **Vendor**: Manage shop/products, view orders/stats, activate access keys
- **Admin**: Full platform management, key generation, moderation, analytics
- **Employee**: Handle assigned claims, moderate reviews

## Core Requirements
- Access key-based subscription system (basic/premium/extra)
- WhatsApp redirect for orders (wa.me deep links)
- Full-text search with vendor ranking (Extra > Premium > Basic)
- Review moderation system
- Claims/customer service system
- Cron jobs for subscription expiry, flash sales, reports

## What's Been Implemented (April 15, 2026)
- [x] Complete auth system (register, login, logout, refresh, forgot/reset password)
- [x] Vendor management with 7-day trial
- [x] Product CRUD with quota enforcement (basic=15 max)
- [x] Category CRUD
- [x] Order system with WhatsApp URL generation + idempotency
- [x] Review system with moderation + auto rating recalculation
- [x] Access key system (bulk generate, activate, blacklist, extension/upgrade)
- [x] Wishlist management
- [x] Claims + threaded messages + assignment
- [x] Flash sales + featured products
- [x] Notification system
- [x] Full-text search with vendor ranking + search miss logging
- [x] Admin dashboard with metrics
- [x] Admin logs + history tracking
- [x] Cron jobs (subscription expiry, flash sales, reports)
- [x] RBAC (client/vendor/admin/employee)
- [x] Soft delete strategy
- [x] Pagination standard on all list endpoints
- [x] Cloudinary infrastructure (MOCKED - awaiting API keys)
- [x] SendGrid infrastructure (MOCKED - awaiting API key)
- [x] Rate limiting (100 req/15min)
- [x] Brute force protection
- [x] Swagger documentation

## Prioritized Backlog
### P0 (Blocking)
- None currently

### P1 (Important)
- Cloudinary activation (add API keys)
- SendGrid activation (add API key)
- Product image upload testing with real Cloudinary

### P2 (Nice to have)
- Email templates beautification
- Admin dashboard frontend
- API rate limiting per user role
- Webhook notifications for order status changes
- Export reports (CSV/PDF)

## Next Tasks
1. Add Cloudinary API keys and test image upload flow
2. Add SendGrid API key and test email sending
3. Consider building admin dashboard frontend
4. Performance optimization for large datasets
