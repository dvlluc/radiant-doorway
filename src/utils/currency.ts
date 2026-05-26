/**
 * Determines the currency symbol and code based on location
 */
export const getCurrencyFromLocation = (location: string): { symbol: string; code: string } => {
  const locationLower = location.toLowerCase();
  
  // United States
  if (locationLower.includes('usa') || 
      locationLower.includes('united states') || 
      locationLower.includes('us,') ||
      locationLower.includes(', us') ||
      locationLower.match(/\b(california|texas|florida|new york|chicago|los angeles)\b/)) {
    return { symbol: '$', code: 'USD' };
  }
  
  // Eurozone countries
  if (locationLower.includes('germany') || 
      locationLower.includes('france') || 
      locationLower.includes('spain') || 
      locationLower.includes('italy') || 
      locationLower.includes('netherlands') ||
      locationLower.includes('belgium') ||
      locationLower.includes('austria') ||
      locationLower.includes('portugal') ||
      locationLower.includes('ireland') ||
      locationLower.includes('greece') ||
      locationLower.match(/\b(berlin|paris|madrid|rome|amsterdam|brussels)\b/)) {
    return { symbol: '€', code: 'EUR' };
  }
  
  // United Kingdom
  if (locationLower.includes('uk') || 
      locationLower.includes('united kingdom') || 
      locationLower.includes('england') || 
      locationLower.includes('scotland') || 
      locationLower.includes('wales') ||
      locationLower.includes('northern ireland') ||
      locationLower.match(/\b(london|manchester|birmingham|glasgow|edinburgh|liverpool)\b/)) {
    return { symbol: '£', code: 'GBP' };
  }
  
  // Canada
  if (locationLower.includes('canada') || 
      locationLower.match(/\b(toronto|vancouver|montreal|calgary|ottawa)\b/)) {
    return { symbol: 'C$', code: 'CAD' };
  }
  
  // Australia
  if (locationLower.includes('australia') || 
      locationLower.match(/\b(sydney|melbourne|brisbane|perth|adelaide)\b/)) {
    return { symbol: 'A$', code: 'AUD' };
  }
  
  // Japan
  if (locationLower.includes('japan') || 
      locationLower.match(/\b(tokyo|osaka|kyoto|yokohama)\b/)) {
    return { symbol: '¥', code: 'JPY' };
  }
  
  // Switzerland
  if (locationLower.includes('switzerland') || 
      locationLower.match(/\b(zurich|geneva|basel|bern)\b/)) {
    return { symbol: 'CHF', code: 'CHF' };
  }
  
  // Sweden
  if (locationLower.includes('sweden') || 
      locationLower.match(/\b(stockholm|gothenburg|malmo)\b/)) {
    return { symbol: 'kr', code: 'SEK' };
  }
  
  // Norway
  if (locationLower.includes('norway') || 
      locationLower.match(/\b(oslo|bergen|trondheim)\b/)) {
    return { symbol: 'kr', code: 'NOK' };
  }
  
  // Denmark
  if (locationLower.includes('denmark') || 
      locationLower.match(/\b(copenhagen|aarhus)\b/)) {
    return { symbol: 'kr', code: 'DKK' };
  }
  
  // Poland
  if (locationLower.includes('poland') || 
      locationLower.match(/\b(warsaw|krakow|wroclaw)\b/)) {
    return { symbol: 'zł', code: 'PLN' };
  }
  
  // Czech Republic
  if (locationLower.includes('czech') || 
      locationLower.match(/\b(prague|brno)\b/)) {
    return { symbol: 'Kč', code: 'CZK' };
  }
  
  // India
  if (locationLower.includes('india') || 
      locationLower.match(/\b(mumbai|delhi|bangalore|chennai|kolkata)\b/)) {
    return { symbol: '₹', code: 'INR' };
  }
  
  // China
  if (locationLower.includes('china') || 
      locationLower.match(/\b(beijing|shanghai|guangzhou|shenzhen)\b/)) {
    return { symbol: '¥', code: 'CNY' };
  }
  
  // South Korea
  if (locationLower.includes('korea') || 
      locationLower.match(/\b(seoul|busan)\b/)) {
    return { symbol: '₩', code: 'KRW' };
  }
  
  // Brazil
  if (locationLower.includes('brazil') || 
      locationLower.match(/\b(sao paulo|rio de janeiro|brasilia)\b/)) {
    return { symbol: 'R$', code: 'BRL' };
  }
  
  // Mexico
  if (locationLower.includes('mexico') || 
      locationLower.match(/\b(mexico city|guadalajara|monterrey)\b/)) {
    return { symbol: 'MX$', code: 'MXN' };
  }
  
  // South Africa
  if (locationLower.includes('south africa') || 
      locationLower.match(/\b(johannesburg|cape town|durban)\b/)) {
    return { symbol: 'R', code: 'ZAR' };
  }
  
  // Singapore
  if (locationLower.includes('singapore')) {
    return { symbol: 'S$', code: 'SGD' };
  }
  
  // Hong Kong
  if (locationLower.includes('hong kong')) {
    return { symbol: 'HK$', code: 'HKD' };
  }
  
  // New Zealand
  if (locationLower.includes('new zealand') || 
      locationLower.match(/\b(auckland|wellington)\b/)) {
    return { symbol: 'NZ$', code: 'NZD' };
  }
  
  // Default to USD
  return { symbol: '$', code: 'USD' };
};

/**
 * Formats a price with the appropriate currency symbol
 */
export const formatPrice = (amount: number | string, location: string): string => {
  const { symbol } = getCurrencyFromLocation(location);
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Format with commas for thousands
  const formatted = numAmount.toLocaleString('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return `${symbol}${formatted}`;
};

/**
 * Format amount as USD currency
 */
export const formatToUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatCurrency = formatToUSD;

/**
 * List of supported currencies with their codes and symbols
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
] as const;
