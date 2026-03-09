# TRIPLY - Required Services & Subscriptions

This document outlines all the services and subscriptions required to launch TRIPLY to production.

---

## Required Services

### 1. **Domain Name**
- **Purpose**: Your website address (e.g., triply.com, triply.ae)
- **Where to Purchase**: Namecheap, GoDaddy, or Google Domains
- **Cost**: $10-15/year

---

### 2. **Website Hosting (Frontend)**
- **Purpose**: Host your website
- **Recommended**: Vercel
  - Free tier available (sufficient for MVP)
  - Pro tier: $20/month (if more bandwidth needed)
- **Cost**: $0-20/month

---

### 3. **Server Hosting (Backend)**
- **Purpose**: Host your application server
- **Recommended**: Railway or Render
  - Railway: $5-20/month
  - Render: Free tier available, or $7/month
- **Cost**: $0-20/month

---

### 4. **Database**
- **Purpose**: Store all booking and user data
- **Service**: MongoDB Atlas
  - Free tier available (sufficient for MVP)
  - Paid tier: $9/month (when scaling)
- **Cost**: $0-9/month

---

### 5. **Payment Processing**
- **Purpose**: Accept credit/debit card payments (AED 199 deposits)
- **Service**: Stripe
  - No monthly fee
  - Transaction fee: 2.9% + $0.30 per successful payment
  - Supports AED currency
- **Cost**: Transaction fees only (no monthly fee)

---

### 6. **Image Storage**
- **Purpose**: Store and deliver destination/activity photos
- **Service**: Cloudinary
  - Free tier: 25GB storage (sufficient for MVP)
  - Paid tier: $89/month (when more storage needed)
- **Cost**: $0-89/month

---

### 7. **Email Service**
- **Purpose**: Send booking confirmations and notifications
- **Recommended**: SendGrid
  - Free tier: 100 emails/day
  - Essentials: $15/month (40,000 emails)
- **Cost**: $0-15/month

---

## Optional Services

### 8. **Error Monitoring**
- **Purpose**: Monitor application performance and errors
- **Service**: Sentry
  - Free tier: 5,000 errors/month
  - Paid: $26/month
- **Cost**: $0-26/month

### 9. **Analytics**
- **Purpose**: Track website visitors and conversions
- **Service**: Google Analytics 4
- **Cost**: Free

---

## Cost Summary

### **Minimum Setup (MVP)**
- Domain: $12/year (~$1/month)
- Website Hosting: $0/month
- Server Hosting: $0/month
- Database: $0/month
- Payment Processing: 2.9% + $0.30 per transaction
- Image Storage: $0/month
- Email Service: $0/month

**Total Monthly Cost: ~$1/month + transaction fees**

### **Recommended Production Setup**
- Domain: $12/year (~$1/month)
- Website Hosting: $20/month
- Server Hosting: $20/month
- Database: $9/month
- Payment Processing: 2.9% + $0.30 per transaction
- Image Storage: $0/month
- Email Service: $15/month
- Error Monitoring: $0/month

**Total Monthly Cost: ~$65/month + transaction fees**

---

## Setup Timeline

### Phase 1: Account Setup (Week 1)
1. Purchase domain name
2. Create MongoDB Atlas account
3. Create Stripe account and complete business verification
4. Create Cloudinary account
5. Create SendGrid account

### Phase 2: Deployment (Week 1-2)
6. Deploy website to hosting platform
7. Deploy server to hosting platform
8. Connect domain to hosting
9. Configure all service connections

### Phase 3: Testing (Week 2)
10. Test payment processing
11. Test email delivery
12. Set up analytics
13. Final testing and launch

---

## Next Steps

1. Review and approve this list
2. Purchase domain name
3. Create accounts for all required services
4. Provide API keys and credentials to development team
5. Complete business verification for Stripe
6. Approve deployment timeline

---

**Note**: Most services offer free tiers that are sufficient for initial launch. You can upgrade as your business grows.
