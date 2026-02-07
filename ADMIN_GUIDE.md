# TRIPLY Admin Guide

This guide provides comprehensive instructions for administrators managing the TRIPLY platform.

## Table of Contents
1. [Admin Dashboard](#admin-dashboard)
2. [Managing Bookings](#managing-bookings)
3. [Managing Destinations](#managing-destinations)
4. [Managing Activities](#managing-activities)
5. [Managing Availability](#managing-availability)
6. [Managing Affiliates](#managing-affiliates)
7. [Admin Invitations](#admin-invitations)
8. [System Overview](#system-overview)

---

## Admin Dashboard

### Accessing the Dashboard

1. Log in with admin credentials
2. You'll be automatically redirected to `/admin/dashboard`
3. Or click **"Dashboard"** in the admin sidebar

### Dashboard Overview

The admin dashboard displays:

**Overview Cards:**
- **Total Bookings:** All bookings across the platform
- **Total Revenue:** Total revenue generated
- **Total Users:** Number of registered users
- **Total Affiliates:** Number of active affiliates

**Booking Statistics:**
- Pending bookings
- Deposit paid bookings
- Dates selected bookings
- Confirmed bookings
- Rejected bookings
- Cancelled bookings

**Commission Statistics:**
- Pending commissions
- Paid commissions
- Total commissions

**Quick Actions:**
- View all bookings
- Manage destinations
- Manage activities
- View affiliates

---

## Managing Bookings

### Viewing All Bookings

1. Go to **"Bookings"** in the admin sidebar
2. View all bookings with filters:
   - Status filter
   - Date range filter
   - Search by booking reference

### Booking Details

Click on any booking to view:
- Customer information
- Destination/Activity details
- Travel dates
- Payment information
- Booking status
- Linked activities (if any)

### Booking Actions

**Confirm Booking:**
1. Review booking details
2. Verify payment status
3. Check availability
4. Click **"Confirm Booking"**
5. Customer will be notified

**Reject Booking:**
1. Review booking details
2. Click **"Reject Booking"**
3. Provide reason (optional)
4. Customer will be notified

**View Booking:**
- Click on booking to see full details
- View payment history
- Check linked activities

### Booking Statuses

- **Pending Payment:** Customer hasn't paid deposit
- **Deposit Paid:** Deposit received, waiting for date selection
- **Dates Selected:** Customer selected dates, awaiting confirmation
- **Confirmed:** Booking confirmed and active
- **Rejected:** Booking was rejected
- **Cancelled:** Booking was cancelled

---

## Managing Destinations

### Viewing Destinations

1. Go to **"Destinations"** in the admin sidebar
2. View all destinations in a table
3. See status, location, and pricing

### Creating a Destination

1. Click **"Add Destination"** button
2. Fill in destination details:
   - Name (in multiple languages)
   - Description
   - Location (country, region, city)
   - Images (upload multiple)
   - Pricing information
   - Currency
3. Click **"Create Destination"**

### Editing a Destination

1. Find the destination in the list
2. Click **"Edit"** button
3. Update any fields
4. Click **"Save Changes"**

### Managing Destination Availability

See [Managing Availability](#managing-availability) section below.

---

## Managing Activities

### Viewing Activities

1. Go to **"Activities"** in the admin sidebar
2. Use tabs to filter:
   - **Pending:** Activities awaiting approval
   - **Approved:** Approved activities

### Activity Details

For each activity, you can see:
- Activity title and description
- Location
- Merchant information
- Pricing
- Status
- Images

### Approving Activities

1. Go to **"Activities"** → **"Pending"** tab
2. Review activity details
3. Click **"View Details"** to see full information
4. Click **"Approve"** to approve the activity
5. Activity becomes visible to users

### Rejecting Activities

1. Go to **"Activities"** → **"Pending"** tab
2. Review activity details
3. Click **"Reject"** button
4. Provide rejection reason (optional)
5. Merchant will be notified

### Managing Activity Availability

Merchants manage their own activity availability, but admins can:
- View activity availability
- Monitor booking patterns
- Review activity performance

---

## Managing Availability

### Destination Availability

1. Go to **"Availability"** in the admin sidebar
2. Select a destination from the dropdown
3. View the calendar for that destination

### Calendar Features

- **Available Dates:** White background - dates with availability
- **Selected Dates:** Orange highlight - dates you've selected
- **Fully Booked:** Red background - no slots available
- **Blocked Dates:** Dates manually blocked

### Updating Slots

1. Select dates on the calendar (click to select multiple)
2. Choose slot count (5, 10, 20, 50) or enter custom number
3. Click **"Update Slots"**
4. Slots are updated for selected dates

### Blocking/Unblocking Dates

1. Select dates on the calendar
2. Click **"Block Dates"** to block selected dates
3. Click **"Unblock Dates"** to make dates available again
4. Blocked dates won't appear as available to users

### Bulk Operations

- Select multiple dates at once
- Apply slot updates to multiple dates
- Block/unblock multiple dates simultaneously

---

## Managing Affiliates

### Viewing Affiliates

1. Go to **"Affiliates"** in the admin sidebar
2. View all affiliates with:
   - Name and email
   - Total referrals
   - Total commissions
   - Status

### Affiliate Details

Click on an affiliate to see:
- Referral statistics
- Commission history
- Booking referrals
- Payment status

### Managing Affiliate Commissions

- View pending commissions
- Process commission payments
- Track commission history
- Generate reports

---

## Admin Invitations

### Sending Admin Invitations

1. Go to **"Invitations"** in the admin sidebar
2. Click **"Send Invitation"**
3. Enter email address
4. Select role (Admin)
5. Send invitation

### Managing Invitations

- View pending invitations
- Resend invitations
- Cancel invitations
- Track invitation status

---

## System Overview

### User Roles

**Admin:**
- Full system access
- Manage all bookings, destinations, activities
- Manage affiliates
- System configuration

**Merchant:**
- Add and manage activities
- Manage activity availability
- View activity bookings and earnings

**Affiliate:**
- Refer users
- Earn commissions
- Track referrals

**User:**
- Book destinations and activities
- Manage bookings
- Update profile

### Key Features

**Booking System:**
- Deposit-based booking model
- 1-year calendar unlock
- Combined destination + activities booking
- Multiple payment options

**Activity System:**
- Merchant-submitted activities
- Admin approval workflow
- Activity availability management
- Standalone and combined bookings

**Availability Management:**
- Calendar-based availability
- Slot management
- Date blocking/unblocking
- Bulk operations

**Payment System:**
- Stripe integration
- Secure payment processing
- Multiple currency support
- Deposit and full payment options

---

## Best Practices

### Booking Management

1. **Review Regularly:** Check pending bookings daily
2. **Confirm Promptly:** Confirm bookings as soon as dates are selected
3. **Communicate:** Notify customers of status changes
4. **Verify Payments:** Always verify payment before confirming

### Destination Management

1. **Complete Information:** Add all required details and images
2. **Accurate Pricing:** Keep pricing up to date
3. **Update Availability:** Regularly update availability calendar
4. **Quality Images:** Use high-quality destination images

### Activity Management

1. **Review Thoroughly:** Check all activity details before approval
2. **Verify Merchant:** Ensure merchant information is correct
3. **Monitor Performance:** Track activity booking patterns
4. **Maintain Quality:** Reject low-quality or inappropriate activities

### Availability Management

1. **Regular Updates:** Update availability frequently
2. **Block Early:** Block dates that are unavailable
3. **Monitor Capacity:** Track booking capacity
4. **Bulk Operations:** Use bulk operations for efficiency

---

## Troubleshooting

### Common Issues

**Booking Not Showing:**
- Check filters
- Verify booking status
- Refresh the page

**Availability Not Updating:**
- Clear browser cache
- Verify destination selection
- Check for errors in console

**Payment Issues:**
- Verify Stripe configuration
- Check payment logs
- Contact payment provider support

**User Access Issues:**
- Verify user role
- Check authentication status
- Review user permissions

---

## Security Best Practices

1. **Strong Passwords:** Use strong, unique passwords
2. **Regular Updates:** Keep system updated
3. **Access Control:** Limit admin access appropriately
4. **Monitor Activity:** Regularly review system logs
5. **Data Protection:** Follow data protection regulations

---

## Support

### Getting Help

- **Technical Issues:** Contact development team
- **Feature Requests:** Submit through proper channels
- **System Updates:** Check release notes regularly

---

**Last Updated:** February 2026
