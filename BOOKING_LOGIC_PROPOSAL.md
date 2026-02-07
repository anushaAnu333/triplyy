# Booking Logic Proposal - Viator-Style Model

## Current State
- **Destination bookings** and **activity bookings** are completely separate
- Each has its own payment flow
- No linking between them
- Activities shown on destination pages but booked independently

## Proposed Solution (Viator-Style)

### Option 1: Combined Booking with Cart (Recommended)
**How it works:**
1. User books destination (Dubai tour) → Creates destination booking
2. User can add activities to their booking cart
3. User can choose:
   - **Pay Together**: Single payment for destination deposit + all activities
   - **Pay Separately**: Pay destination deposit now, add activities later (pay separately)

### Option 2: Linked Bookings
**How it works:**
1. User books destination → Creates destination booking
2. User adds activities → Creates activity bookings linked to destination booking
3. Payment options:
   - Combined payment at checkout
   - Separate payments (destination first, activities later)

## Recommended Implementation: Option 1 (Cart Model)

### Database Changes Needed:

1. **Update ActivityBooking Model** to link to destination booking:
```typescript
interface IActivityBooking {
  // ... existing fields
  linkedDestinationBookingId?: mongoose.Types.ObjectId; // Optional link
  isAddOn?: boolean; // True if added to destination booking
}
```

2. **Update Booking Model** to track activities:
```typescript
interface IBooking {
  // ... existing fields
  linkedActivityBookings?: mongoose.Types.ObjectId[]; // Array of activity booking IDs
}
```

### User Flow:

#### Scenario A: Pay Together
1. User clicks "Book Now" on destination page
2. Booking modal shows:
   - Destination deposit: AED 199
   - "Add Activities" section with checkboxes
   - Selected activities with prices
   - **Total: AED 199 (deposit) + AED 400 (activities) = AED 599**
3. User proceeds to payment
4. Single payment processes:
   - Destination booking created (status: deposit_paid)
   - Activity bookings created (status: payment_completed)
   - All linked together

#### Scenario B: Pay Separately
1. User books destination → Pays deposit → Booking created
2. Later, user views booking details
3. User can add activities from "Things to Do" section
4. Each activity payment is separate
5. Activities are linked to the destination booking

### Implementation Steps:

1. **Update BookingModal** to include activity selection
2. **Create combined payment endpoint** that handles destination + activities
3. **Update ActivityBooking model** to support linking
4. **Update booking detail page** to show linked activities
5. **Add "Add Activity" feature** to existing bookings

## Benefits:
- ✅ Better user experience (one-stop booking)
- ✅ Higher conversion (add-ons increase revenue)
- ✅ Clear relationship between destination and activities
- ✅ Flexible payment options
- ✅ Similar to industry standard (Viator, GetYourGuide)

## Next Steps:
1. Decide on payment model (combined vs separate)
2. Update database models
3. Create cart functionality
4. Update payment flow
5. Update UI components
