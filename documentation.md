# TRIPLY - Complete Technical Documentation

## Project Overview
A travel booking platform with deposit-based reservations, admin-controlled availability, affiliate referral system, and automated communications.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API + React Query
- **Form Handling**: React Hook Form + Zod validation
- **API Communication**: Axios
- **Internationalization**: next-intl

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Access + Refresh tokens)
- **File Upload**: Multer + Cloudinary/AWS S3
- **Email Service**: Nodemailer + SendGrid/AWS SES
- **Payment Gateway**: Stripe/PayPal (AED 199 deposit)
- **Validation**: Express Validator / Joi

---

## Database Schema Design

### 1. Users Collection
```
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  firstName: String (required),
  lastName: String (required),
  phoneNumber: String,
  role: String (enum: ['user', 'admin', 'affiliate']),
  isEmailVerified: Boolean (default: false),
  profileImage: String (URL),
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

### 2. Destinations Collection
```
{
  _id: ObjectId,
  name: String (required),
  slug: String (unique, required),
  description: String,
  shortDescription: String,
  images: [String] (array of URLs),
  thumbnailImage: String,
  country: String,
  region: String,
  depositAmount: Number (default: 199),
  currency: String (default: 'AED'),
  highlights: [String],
  inclusions: [String],
  exclusions: [String],
  duration: {
    days: Number,
    nights: Number
  },
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Bookings Collection
```
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  destinationId: ObjectId (ref: Destinations),
  bookingReference: String (unique, auto-generated),
  status: String (enum: ['pending_deposit', 'deposit_paid', 'dates_selected', 'confirmed', 'rejected', 'cancelled']),
  
  depositPayment: {
    amount: Number,
    currency: String,
    paymentMethod: String,
    transactionId: String,
    paidAt: Date,
    paymentStatus: String (enum: ['pending', 'completed', 'failed', 'refunded'])
  },
  
  travelDates: {
    startDate: Date,
    endDate: Date,
    isFlexible: Boolean
  },
  
  numberOfTravellers: Number,
  specialRequests: String,
  
  affiliateCode: String,
  affiliateId: ObjectId (ref: Users),
  
  adminNotes: String,
  rejectionReason: String,
  
  calendarUnlockedUntil: Date (1 year from deposit payment),
  
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Availability Collection
```
{
  _id: ObjectId,
  destinationId: ObjectId (ref: Destinations),
  date: Date (required),
  availableSlots: Number (required),
  bookedSlots: Number (default: 0),
  isBlocked: Boolean (default: false),
  blockReason: String,
  priceOverride: Number (optional, if different from base price),
  createdAt: Date,
  updatedAt: Date
}
```
**Indexes**: Compound index on (destinationId, date)

### 5. AffiliateCodes Collection
```
{
  _id: ObjectId,
  affiliateId: ObjectId (ref: Users),
  code: String (unique, required),
  commissionRate: Number (percentage, e.g., 10 for 10%),
  commissionType: String (enum: ['percentage', 'fixed']),
  fixedAmount: Number (if commissionType is 'fixed'),
  isActive: Boolean (default: true),
  usageCount: Number (default: 0),
  totalEarnings: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

### 6. Commissions Collection
```
{
  _id: ObjectId,
  affiliateId: ObjectId (ref: Users),
  bookingId: ObjectId (ref: Bookings),
  affiliateCode: String,
  bookingAmount: Number,
  commissionAmount: Number,
  commissionRate: Number,
  status: String (enum: ['pending', 'approved', 'paid']),
  paidAt: Date,
  paymentReference: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 7. Messages Collection
```
{
  _id: ObjectId,
  bookingId: ObjectId (ref: Bookings),
  senderId: ObjectId (ref: Users),
  receiverId: ObjectId (ref: Users),
  message: String (required),
  isRead: Boolean (default: false),
  attachments: [String] (URLs),
  createdAt: Date
}
```

### 8. EmailLogs Collection
```
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  emailType: String (enum: ['deposit_confirmation', 'booking_confirmed', 'booking_rejected', 'date_reminder', 'password_reset']),
  recipient: String,
  subject: String,
  status: String (enum: ['sent', 'failed', 'pending']),
  errorMessage: String,
  sentAt: Date,
  createdAt: Date
}
```

### 9. Translations Collection (for multi-language)
```
{
  _id: ObjectId,
  key: String (unique, required), // e.g., 'homepage.hero.title'
  translations: {
    en: String,
    ar: String,
    // ... other languages
  },
  category: String (e.g., 'homepage', 'booking', 'common'),
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Architecture

### Base URL Structure
```
Production: https://api.triply.com/api/v1
Development: http://localhost:5000/api/v1
```

### Authentication Flow
- **Registration**: POST `/auth/register` - creates user, sends verification email
- **Email Verification**: GET `/auth/verify-email/:token`
- **Login**: POST `/auth/login` - returns access token + refresh token
- **Refresh Token**: POST `/auth/refresh` - gets new access token
- **Logout**: POST `/auth/logout` - invalidates refresh token
- **Password Reset Request**: POST `/auth/forgot-password`
- **Password Reset**: POST `/auth/reset-password/:token`

---

## API Endpoints Documentation

### 1. Authentication Routes (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/logout` | User logout | Yes |
| POST | `/refresh` | Refresh access token | Yes |
| GET | `/verify-email/:token` | Verify email address | No |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password/:token` | Reset password | No |
| GET | `/me` | Get current user profile | Yes |
| PUT | `/update-profile` | Update user profile | Yes |

---

### 2. Destinations Routes (`/api/v1/destinations`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | Get all active destinations (with filters) | No | - |
| GET | `/:slug` | Get destination by slug | No | - |
| POST | `/` | Create new destination | Yes | Admin |
| PUT | `/:id` | Update destination | Yes | Admin |
| DELETE | `/:id` | Delete/deactivate destination | Yes | Admin |
| GET | `/:id/availability` | Get availability calendar | No | - |

**Query Parameters for GET /**:
- `page` (default: 1)
- `limit` (default: 10)
- `country`
- `region`
- `search` (searches name and description)

---

### 3. Bookings Routes (`/api/v1/bookings`)

#### User Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create new booking (deposit) | Yes |
| GET | `/my-bookings` | Get current user's bookings | Yes |
| GET | `/:id` | Get booking details | Yes |
| PUT | `/:id/select-dates` | Select travel dates | Yes |
| PUT | `/:id/cancel` | Cancel booking | Yes |

#### Admin Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/all` | Get all bookings (with filters) | Yes (Admin) |
| PUT | `/admin/:id/confirm` | Confirm booking | Yes (Admin) |
| PUT | `/admin/:id/reject` | Reject booking | Yes (Admin) |
| PUT | `/admin/:id/update-dates` | Admin changes dates | Yes (Admin) |
| PUT | `/admin/:id/notes` | Add admin notes | Yes (Admin) |
| GET | `/admin/export` | Export bookings CSV/Excel | Yes (Admin) |

**Query Parameters for GET /admin/all**:
- `page`, `limit`
- `status`
- `destinationId`
- `userId`
- `dateFrom`, `dateTo`
- `affiliateCode`

---

### 4. Availability Routes (`/api/v1/availability`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/destination/:destinationId` | Get availability for destination | No |
| POST | `/` | Create/update availability slots | Yes (Admin) |
| PUT | `/:id/block` | Block specific date | Yes (Admin) |
| PUT | `/:id/unblock` | Unblock specific date | Yes (Admin) |
| POST | `/bulk-update` | Bulk update availability | Yes (Admin) |

**Request Body for Bulk Update**:
```json
{
  "destinationId": "destination_id",
  "dateRange": {
    "startDate": "2025-06-01",
    "endDate": "2025-08-31"
  },
  "availableSlots": 20,
  "isBlocked": false
}
```

---

### 5. Affiliate Routes (`/api/v1/affiliates`)

#### Affiliate Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register as affiliate | Yes |
| GET | `/dashboard` | Affiliate dashboard data | Yes (Affiliate) |
| GET | `/my-codes` | Get affiliate's codes | Yes (Affiliate) |
| POST | `/generate-code` | Generate new code | Yes (Affiliate/Admin) |
| GET | `/validate/:code` | Validate affiliate code | No |
| GET | `/bookings` | Get bookings using affiliate code | Yes (Affiliate) |
| GET | `/commissions` | Get commission history | Yes (Affiliate) |

#### Admin Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/all` | Get all affiliates | Yes (Admin) |
| PUT | `/admin/:id/approve` | Approve affiliate | Yes (Admin) |
| PUT | `/admin/:id/commission-rate` | Update commission rate | Yes (Admin) |
| PUT | `/admin/:id/activate` | Activate/deactivate | Yes (Admin) |
| GET | `/admin/export` | Export affiliate data | Yes (Admin) |

---

### 6. Payment Routes (`/api/v1/payments`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/create-intent` | Create payment intent | Yes |
| POST | `/confirm` | Confirm payment | Yes |
| POST | `/webhook` | Payment gateway webhook | No (Verified) |
| GET | `/booking/:bookingId` | Get payment details | Yes |

---

### 7. Messages Routes (`/api/v1/messages`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Send message | Yes |
| GET | `/booking/:bookingId` | Get messages for booking | Yes |
| PUT | `/:id/read` | Mark as read | Yes |
| DELETE | `/:id` | Delete message | Yes |

---

### 8. Admin Dashboard Routes (`/api/v1/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/stats` | Dashboard statistics | Yes (Admin) |
| GET | `/recent-bookings` | Recent bookings | Yes (Admin) |
| GET | `/revenue` | Revenue analytics | Yes (Admin) |
| GET | `/popular-destinations` | Popular destinations | Yes (Admin) |

**Stats Response Example**:
```json
{
  "totalBookings": 150,
  "totalRevenue": 29850,
  "pendingBookings": 12,
  "confirmedBookings": 120,
  "activeAffiliates": 25,
  "totalCommissionsPaid": 4500
}
```

---

### 9. Translations Routes (`/api/v1/translations`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all translations for language | No |
| POST | `/` | Create translation | Yes (Admin) |
| PUT | `/:id` | Update translation | Yes (Admin) |
| DELETE | `/:id` | Delete translation | Yes (Admin) |
| GET | `/export/:language` | Export language file | Yes (Admin) |
| POST | `/import` | Import language file | Yes (Admin) |

---

## Frontend Structure (Next.js)

```
triply-frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (user)/
│   │   │   ├── dashboard/
│   │   │   ├── bookings/
│   │   │   │   ├── [id]/
│   │   │   │   └── new/
│   │   │   └── profile/
│   │   ├── (affiliate)/
│   │   │   └── affiliate/
│   │   │       ├── dashboard/
│   │   │       ├── bookings/
│   │   │       └── commissions/
│   │   ├── (admin)/
│   │   │   └── admin/
│   │   │       ├── dashboard/
│   │   │       ├── bookings/
│   │   │       ├── destinations/
│   │   │       ├── availability/
│   │   │       ├── affiliates/
│   │   │       └── messages/
│   │   ├── destinations/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   ├── layout.tsx
│   │   ├── page.tsx (Homepage)
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── destinations/
│   │   │   ├── DestinationCard.tsx
│   │   │   ├── DestinationGrid.tsx
│   │   │   └── DestinationDetail.tsx
│   │   ├── booking/
│   │   │   ├── BookingForm.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── PaymentForm.tsx
│   │   │   └── BookingStatus.tsx
│   │   ├── admin/
│   │   │   ├── BookingTable.tsx
│   │   │   ├── AvailabilityCalendar.tsx
│   │   │   └── StatsCard.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── Modal.tsx
│   │       └── Toast.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── auth.ts
│   │   │   ├── bookings.ts
│   │   │   ├── destinations.ts
│   │   │   ├── affiliates.ts
│   │   │   └── admin.ts
│   │   ├── utils/
│   │   │   ├── axios.ts
│   │   │   ├── formatters.ts
│   │   │   └── validators.ts
│   │   └── hooks/
│   │       ├── useAuth.ts
│   │       ├── useBookings.ts
│   │       └── useDestinations.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── LanguageContext.tsx
│   ├── types/
│   │   ├── user.ts
│   │   ├── booking.ts
│   │   ├── destination.ts
│   │   └── api.ts
│   └── styles/
│       └── globals.css
├── public/
│   ├── images/
│   └── locales/
│       ├── en.json
│       └── ar.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Backend Structure (Express + MongoDB)

```
triply-backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── environment.ts
│   │   ├── email.ts
│   │   └── payment.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Destination.ts
│   │   ├── Booking.ts
│   │   ├── Availability.ts
│   │   ├── AffiliateCode.ts
│   │   ├── Commission.ts
│   │   ├── Message.ts
│   │   ├── EmailLog.ts
│   │   └── Translation.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── bookingController.ts
│   │   ├── destinationController.ts
│   │   ├── availabilityController.ts
│   │   ├── affiliateController.ts
│   │   ├── paymentController.ts
│   │   ├── messageController.ts
│   │   └── adminController.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── bookingRoutes.ts
│   │   ├── destinationRoutes.ts
│   │   ├── availabilityRoutes.ts
│   │   ├── affiliateRoutes.ts
│   │   ├── paymentRoutes.ts
│   │   ├── messageRoutes.ts
│   │   └── adminRoutes.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── roleCheck.ts
│   │   ├── validation.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── services/
│   │   ├── emailService.ts
│   │   ├── paymentService.ts
│   │   ├── notificationService.ts
│   │   └── reportService.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── logger.ts
│   │   └── generateReference.ts
│   ├── types/
│   │   ├── express.d.ts
│   │   └── custom.ts
│   ├── validators/
│   │   ├── authValidator.ts
│   │   ├── bookingValidator.ts
│   │   └── destinationValidator.ts
│   └── app.ts
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CURRENCY=AED
NEXT_PUBLIC_DEPOSIT_AMOUNT=199
```

### Backend (.env)
```
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/triply
MONGODB_TEST_URI=mongodb://localhost:27017/triply_test

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@triply.com

# Payment Gateway
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
PAYMENT_SUCCESS_URL=http://localhost:3000/booking/success
PAYMENT_CANCEL_URL=http://localhost:3000/booking/cancel

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Default Settings
DEFAULT_DEPOSIT_AMOUNT=199
DEFAULT_CURRENCY=AED
CALENDAR_UNLOCK_DURATION_DAYS=365
```

---

## Key Features Implementation Details

### 1. Deposit-Based Booking Flow

**Step 1: User selects destination**
- Browse destinations page
- Click on destination card
- View destination details

**Step 2: Initiate booking**
- POST `/api/v1/bookings` with `destinationId`
- System creates booking with status `pending_deposit`
- Returns booking ID and payment intent

**Step 3: Payment**
- Frontend redirects to payment form (Stripe)
- User pays AED 199 deposit
- Webhook updates booking to `deposit_paid`
- Email sent: "Deposit Confirmed"
- Calendar unlocked for 1 year (`calendarUnlockedUntil` field)

**Step 4: Date selection (within 1 year)**
- User accesses booking dashboard
- Views availability calendar for destination
- Selects preferred dates
- PUT `/api/v1/bookings/:id/select-dates`
- Status changes to `dates_selected`
- Email sent to admin: "New Date Selection"

**Step 5: Admin confirmation**
- Admin reviews booking
- PUT `/api/v1/bookings/admin/:id/confirm` OR `/reject`
- Status changes to `confirmed` or `rejected`
- Email sent to user: "Booking Confirmed" or "Booking Rejected"

---

### 2. Availability Management

**Admin creates availability slots**:
```
POST /api/v1/availability/bulk-update
{
  "destinationId": "dest_123",
  "dateRange": {
    "startDate": "2025-06-01",
    "endDate": "2025-08-31"
  },
  "availableSlots": 20
}
```

**System checks availability**:
- When user selects dates, frontend calls `GET /api/v1/availability/destination/:id?startDate=X&endDate=Y`
- Backend checks if `availableSlots > bookedSlots` for all dates
- Returns available/unavailable status

**On booking confirmation**:
- System increments `bookedSlots` for selected dates
- If `bookedSlots === availableSlots`, date becomes fully booked

---

### 3. Affiliate System

**Affiliate registration**:
- User signs up and selects affiliate role
- Admin approves affiliate
- System generates unique coupon code

**Using affiliate code**:
- User enters code during booking
- System validates: `GET /api/v1/affiliates/validate/:code`
- If valid, saves `affiliateCode` and `affiliateId` in booking
- Creates commission record when deposit is paid

**Commission calculation**:
- On `deposit_paid` event:
  ```javascript
  commissionAmount = depositAmount * (commissionRate / 100)
  ```
- Creates entry in Commissions collection with status `pending`
- Admin can approve and mark as `paid`

**Affiliate dashboard**:
- Shows total bookings, earnings, pending commissions
- Lists all bookings using their code
- Downloadable reports

---

### 4. Email Automation

**Transactional emails triggered by**:

1. **Deposit Paid**
   - Template: "deposit_confirmation"
   - To: User
   - Content: Booking reference, deposit amount, next steps

2. **Dates Selected**
   - Template: "dates_selected_user"
   - To: User (confirmation)
   - Template: "dates_selected_admin"
   - To: Admin (notification)

3. **Booking Confirmed**
   - Template: "booking_confirmed"
   - To: User
   - Content: Travel dates, itinerary, payment details

4. **Booking Rejected**
   - Template: "booking_rejected"
   - To: User
   - Content: Rejection reason, refund process

5. **Calendar Expiry Reminder**
   - Template: "calendar_expiring"
   - To: User
   - Sent 30 days before expiry

**Email Service Implementation**:
```javascript
// emailService.ts
async function sendEmail(to, template, data) {
  const emailContent = renderTemplate(template, data);
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: emailContent.subject,
    html: emailContent.html
  });
  // Log in EmailLogs collection
}
```

---

### 5. Multi-Language Support

**Implementation approach**:

**Frontend (Next.js with next-intl)**:
- Translations stored in `/public/locales/{language}.json`
- User selects language from dropdown
- Language preference stored in cookie/localStorage
- All text wrapped with translation function:
  ```javascript
  import {useTranslations} from 'next-intl';
  const t = useTranslations('HomePage');
  <h1>{t('hero.title')}</h1>
  ```

**Backend**:
- API endpoints accept `Accept-Language` header
- Email templates use translations
- Database stores translatable content in nested object:
  ```javascript
  destination: {
    name: {
      en: "Dubai Adventure",
      ar: "مغامرة دبي"
    },
    description: {
      en: "...",
      ar: "..."
    }
  }
  ```

**Admin panel**:
- Manage translations via UI
- Add new language keys
- Export/import translation files

---

## Security Considerations

### 1. Authentication & Authorization
- JWT tokens with short expiry (15 min access, 7 day refresh)
- Refresh tokens stored in httpOnly cookies
- Password hashing with bcrypt (salt rounds: 10)
- Role-based access control middleware
- Email verification required

### 2. Data Validation
- Input validation on both frontend (Zod) and backend (Joi/Express Validator)
- SQL injection prevention (using Mongoose ODM)
- XSS prevention (sanitize inputs)
- CSRF tokens for state-changing operations

### 3. Rate Limiting
- Login attempts: 5 per 15 minutes per IP
- API requests: 100 per 15 minutes per user
- Payment endpoints: 3 per minute

### 4. Payment Security
- Never store card details
- Use Stripe's PCI-compliant system
- Verify webhook signatures
- Log all payment transactions

### 5. File Uploads
- Validate file types and sizes
- Scan for malware
- Store in cloud (Cloudinary/S3), not server
- Generate signed URLs for access

---

## Deployment Architecture

### Production Setup

**Frontend (Next.js)**:
- Platform: Vercel / AWS Amplify / Netlify
- CDN: Cloudflare
- Environment variables configured in platform

**Backend (Node.js/Express)**:
- Platform: AWS EC2 / DigitalOcean / Railway
- Process manager: PM2
- Reverse proxy: Nginx
- SSL: Let's Encrypt

**Database (MongoDB)**:
- Platform: MongoDB Atlas (recommended)
- Backup: Automated daily backups
- Replica set for high availability

**File Storage**:
- Cloudinary or AWS S3
- CDN for image delivery

**Email Service**:
- SendGrid or AWS SES
- Dedicated IP for better deliverability

---

## Performance Optimization

### Frontend
- Image optimization with Next.js Image component
- Lazy loading for destinations list
- Code splitting per route
- Caching with React Query (staleTime: 5 minutes)
- Static generation for destination pages

### Backend
- Database indexing on frequently queried fields
- Response caching for public endpoints (Redis)
- Pagination for all list endpoints
- Aggregation pipelines for complex queries
- Connection pooling for database

### Database Indexes
```javascript
// Critical indexes
Bookings: {bookingReference: 1}, {userId: 1}, {affiliateCode: 1}
Availability: {destinationId: 1, date: 1} (compound)
Users: {email: 1}
Destinations: {slug: 1}
```

---

## Testing Strategy

### Frontend
- Unit tests: Jest + React Testing Library
- Component tests for booking flow
- E2E tests: Playwright/Cypress
- Test payment flow with Stripe test mode

### Backend
- Unit tests: Jest
- Integration tests for API endpoints
- Test database: Separate MongoDB instance
- Mock external services (email, payment)

### Key Test Scenarios
1. Complete booking flow (deposit → dates → confirmation)
2. Affiliate code validation and commission calculation
3. Availability checks and slot management
4. Email triggers
5. Authentication flows
6. Admin operations

---

## Monitoring & Logging

### Application Monitoring
- Error tracking: Sentry
- Performance monitoring: New Relic / DataDog
- Uptime monitoring: Pingdom / UptimeRobot

### Logging
- Winston logger for backend
- Log levels: error, warn, info, debug
- Centralized logging: CloudWatch / Papertrail
- Log rotation and retention policies

### Metrics to Track
- Booking conversion rate
- Payment success rate
- Average response times
- Error rates per endpoint
- Affiliate performance
- User retention

---

## Development Workflow

### 1. Setup
```bash
# Clone repositories
git clone <frontend-repo>
git clone <backend-repo>

# Install dependencies
cd triply-frontend && npm install
cd triply-backend && npm install

# Setup environment variables
cp .env.example .env

# Run database
docker-compose up -d mongodb


