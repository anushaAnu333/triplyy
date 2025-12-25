# TRIPLY Frontend

Travel booking platform frontend built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Modern UI**: Beautiful, responsive design with shadcn/ui components
- **Authentication**: User registration, login, and profile management
- **Destinations**: Browse and search travel destinations
- **Bookings**: Create bookings with deposit payments
- **Dashboard**: User dashboard with booking management
- **Affiliate System**: Affiliate registration and code validation

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: React Query + Context API
- **Forms**: React Hook Form + Zod
- **Payment**: Stripe.js

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` file:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
   NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_xxx
   NEXT_PUBLIC_DEPOSIT_AMOUNT=199
   NEXT_PUBLIC_CURRENCY=AED
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (user)/            # User pages (dashboard, bookings)
│   ├── destinations/      # Destination pages
│   └── page.tsx           # Homepage
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components
│   ├── destinations/      # Destination components
│   ├── booking/           # Booking components
│   └── common/            # Common components
├── lib/
│   ├── api/               # API client functions
│   ├── utils/             # Utility functions
│   └── hooks/             # Custom React hooks
├── context/               # React Context providers
├── types/                 # TypeScript types
└── styles/                # Global styles
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_DEPOSIT_AMOUNT` | Default deposit amount |
| `NEXT_PUBLIC_CURRENCY` | Default currency code |

## Features Overview

### Homepage
- Hero section with CTA
- Features showcase
- How it works section
- Popular destinations

### Destinations
- Grid view with cards
- Search functionality
- Filters (country, region)
- Pagination

### Authentication
- User registration with validation
- Email/password login
- Password reset flow
- Protected routes

### User Dashboard
- Booking overview
- Quick actions
- Recent bookings list
- Profile management

### Booking Flow
1. Select destination
2. Pay deposit (Stripe)
3. Select travel dates
4. Admin confirmation

## License

MIT

