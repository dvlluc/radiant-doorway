# Platform Naming Conventions

This document defines how user names should be displayed across different parts of the platform.

## Individual Users

### Display Name (Screen Name)
**Used for:**
- Social posts and comments
- Messaging conversations
- Profile dropdown menu
- Community interactions
- Social feed
- Event RSVPs (social context)

**Implementation:**
- Field: `profiles.display_name`
- Fallback: `profiles.first_name` if display_name is not set
- Component logic: Use `profile.display_name || profile.first_name`

### Real Name (First + Last Name)
**Used for:**
- Booking appointments
- Purchasing event tickets
- Applying for jobs
- Payment/billing information
- Professional interactions
- Legal/transactional contexts

**Implementation:**
- Fields: `profiles.first_name` + `profiles.last_name`
- Format: `${first_name} ${last_name}`
- **Always required** for transactions

## Business Accounts (Brand/Business/Charitable Partner)

### Organization Name
**Used for:**
- **ALL interactions** (no exceptions)
- Social posts and comments
- Messaging
- Profile dropdown
- Bookings and appointments
- Event tickets
- Job postings
- All transactional contexts

**Implementation:**
- Fields:
  - `brand_profiles.brand_name`
  - `business_profiles.business_name`
  - `charitable_profiles.organization_name`

### Contact Person Name
**Never displayed publicly**
- Stored in: `first_name` and `last_name` in respective profile tables
- Used only for: Internal admin purposes, account recovery
- **MUST NOT** be shown in any public-facing UI

## Implementation Checklist

### Components Using Display Names (Social Context)
- [ ] FeedPost component
- [ ] CommentDialog component
- [ ] MessagesPage component
- [ ] NotificationsDropdown
- [ ] Header (profile dropdown)
- [ ] ShareDialog
- [ ] TrendPostDialog

### Components Using Real Names (Transactional Context)
- [ ] Booking forms (BookingDateTime, BookingPayment)
- [ ] Event ticket purchases
- [ ] Job application forms
- [ ] Payment forms
- [ ] Receipt/confirmation emails

### Database Functions to Update
- [ ] `handle_new_user` - Ensure display_name is saved
- [ ] `handle_confirmed_user` - Properly set display_name for individual users

## Code Examples

### Social Context (Use Display Name)
```typescript
// For individual users
const displayName = profile.display_name || profile.first_name || "User";

// For business accounts
const displayName = accountType === "brand" ? brandProfile.brand_name :
                   accountType === "business" ? businessProfile.business_name :
                   accountType === "charitable_partner" ? charityProfile.organization_name :
                   profile.display_name || profile.first_name || "User";
```

### Transactional Context (Use Real Name or Business Name)
```typescript
// For individual users - always use real name
const fullName = `${profile.first_name} ${profile.last_name}`;

// For business accounts - use business name
const transactionName = accountType === "brand" ? brandProfile.brand_name :
                       accountType === "business" ? businessProfile.business_name :
                       accountType === "charitable_partner" ? charityProfile.organization_name :
                       `${profile.first_name} ${profile.last_name}`;
```

## Registration Flow

### Individual Users
1. Required fields: `first_name`, `last_name`, `email`, `password`
2. Optional field: `display_name` (screen name)
3. If `display_name` is not provided, use `first_name` as fallback

### Business Accounts
1. Required fields:
   - Contact: `first_name`, `last_name`, `email`, `password`, `telephone`
   - Business: `brand_name` OR `business_name` OR `organization_name`
   - Additional: `address`
2. Business name is **always** used for public display
3. Contact person info stored but **never** displayed publicly
