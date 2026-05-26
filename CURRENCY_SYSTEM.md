# Currency System Documentation

## Overview
The platform now implements a comprehensive currency detection system that automatically determines the correct currency based on user location data with intelligent fallbacks.

## Priority Order
1. **User Profile Location** (Highest Priority)
   - Checks business_profiles, brand_profiles, and charitable_profiles tables
   - Uses the `address` field to determine currency

2. **IP-Based Geolocation** (Fallback)
   - Uses ipapi.co service for free IP-based location detection
   - Automatically determines currency based on detected country

3. **Default Currency** (Last Resort)
   - Falls back to USD if all other methods fail

## Implementation

### Hook: `useCurrency`
Location: `src/hooks/useCurrency.ts`

```typescript
const { currency, loading } = useCurrency();
// Returns: { symbol: '$', code: 'USD' }
```

This hook can be used in any component that needs to display currency information based on the current user's location.

### Utility Functions
Location: `src/utils/currency.ts`

#### `getCurrencyFromLocation(location: string)`
Determines currency based on a location string. Supports:
- Countries: USA, UK, Germany, France, Spain, Italy, etc.
- Cities: New York, London, Paris, Tokyo, etc.
- Regions: California, Texas, etc.

#### `formatPrice(amount: number | string, location: string)`
Formats a price with the appropriate currency symbol based on location.

#### `formatCurrency(amount: number)` / `formatToUSD(amount: number)`
Formats amounts as USD currency.

## Supported Currencies
- **USD ($)** - United States, Mexico
- **EUR (€)** - Eurozone countries (Germany, France, Spain, Italy, etc.)
- **GBP (£)** - United Kingdom
- **CAD (C$)** - Canada
- **AUD (A$)** - Australia
- **JPY (¥)** - Japan
- **CHF** - Switzerland
- **SEK (kr)** - Sweden
- **NOK (kr)** - Norway
- **DKK (kr)** - Denmark
- **PLN (zł)** - Poland
- **CZK (Kč)** - Czech Republic
- **INR (₹)** - India
- **CNY (¥)** - China
- **KRW (₩)** - South Korea
- **BRL (R$)** - Brazil
- **ZAR (R)** - South Africa
- **SGD (S$)** - Singapore
- **HKD (HK$)** - Hong Kong
- **NZD (NZ$)** - New Zealand
- **MXN (MX$)** - Mexico

## Usage in Components

### For Booking/Service Pages
The system automatically detects currency based on the business's location:

```typescript
const businessLocation = business?.address || "United States";
const currency = getCurrencyFromLocation(businessLocation);
```

### For Event/Job Creation
Currency is determined from the location field entered in the form:

```typescript
const currency = formData.location 
  ? getCurrencyFromLocation(formData.location) 
  : { symbol: '$', code: 'USD' };
```

### For User-Specific Content
Use the `useCurrency` hook to get the user's preferred currency:

```typescript
const { currency, loading } = useCurrency();

if (loading) return <Spinner />;
return <div>{currency.symbol}{price}</div>;
```

## Profile Information
The platform now properly stores and uses location data from user profiles:
- Business profiles store full addresses
- The address is parsed and used for currency detection
- Users can update their location in Account Settings > Personal Information

## IP Geolocation
If no profile location is available, the system automatically:
1. Calls ipapi.co to get the user's country
2. Determines the appropriate currency
3. Caches the result to avoid repeated API calls

## Updates Made
1. Changed default currency from GBP to USD across the platform
2. Implemented `useCurrency` hook for centralized currency management
3. Updated all booking pages to use business location properly
4. Fixed hardcoded "London, UK" defaults to "United States"
5. Enhanced PersonalInformationForm to properly parse and store addresses
6. Added IP-based geolocation fallback

## Future Enhancements
- Currency conversion for displaying prices in user's preferred currency
- Allow users to manually select their preferred currency
- Support for more currencies as needed
- Integration with exchange rate APIs for real-time conversion
