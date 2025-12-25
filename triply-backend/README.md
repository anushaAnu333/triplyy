# TRIPLY Backend API

Travel booking platform backend built with Express.js, TypeScript, and MongoDB.

## Features

- **Authentication**: JWT-based auth with access/refresh tokens
- **Deposit-Based Bookings**: AED 199 deposit with 1-year calendar unlock
- **Availability Management**: Admin-controlled calendar and slots
- **Affiliate System**: Commission tracking and referral codes
- **Automated Emails**: Transactional emails for booking lifecycle
- **Admin Dashboard**: Statistics, reports, and management tools

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT
- **Payment**: Stripe
- **Email**: Nodemailer

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Stripe account (for payments)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`

5. Start development server:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/update-profile` - Update profile

### Destinations
- `GET /api/v1/destinations` - List destinations
- `GET /api/v1/destinations/:slug` - Get destination by slug
- `POST /api/v1/destinations` - Create destination (Admin)
- `PUT /api/v1/destinations/:id` - Update destination (Admin)
- `DELETE /api/v1/destinations/:id` - Delete destination (Admin)

### Bookings
- `POST /api/v1/bookings` - Create booking
- `GET /api/v1/bookings/my-bookings` - Get user's bookings
- `GET /api/v1/bookings/:id` - Get booking details
- `PUT /api/v1/bookings/:id/select-dates` - Select travel dates
- `PUT /api/v1/bookings/:id/cancel` - Cancel booking

### Admin Bookings
- `GET /api/v1/bookings/admin/all` - Get all bookings
- `PUT /api/v1/bookings/admin/:id/confirm` - Confirm booking
- `PUT /api/v1/bookings/admin/:id/reject` - Reject booking
- `GET /api/v1/bookings/admin/export` - Export bookings

### Availability
- `GET /api/v1/availability/destination/:id` - Get availability
- `POST /api/v1/availability` - Create availability (Admin)
- `POST /api/v1/availability/bulk-update` - Bulk update (Admin)

### Affiliates
- `POST /api/v1/affiliates/register` - Register as affiliate
- `GET /api/v1/affiliates/dashboard` - Affiliate dashboard
- `GET /api/v1/affiliates/validate/:code` - Validate code
- `GET /api/v1/affiliates/commissions` - Get commissions

### Payments
- `POST /api/v1/payments/create-intent` - Create payment intent
- `POST /api/v1/payments/confirm` - Confirm payment
- `POST /api/v1/payments/webhook` - Stripe webhook

### Admin Dashboard
- `GET /api/v1/admin/stats` - Dashboard statistics
- `GET /api/v1/admin/revenue` - Revenue analytics
- `GET /api/v1/admin/popular-destinations` - Popular destinations

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Express middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── validators/     # Request validation
└── app.ts          # Application entry point
```

## Environment Variables

See `.env.example` for all required environment variables.

## License

MIT

