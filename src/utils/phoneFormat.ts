/**
 * Phone number formatting utilities for Twilio E.164 format
 * E.164 format: +[country code][number] (e.g., +13025389413)
 */

/**
 * Formats a phone number to E.164 format for Twilio
 * @param phoneNumber - The phone number to format
 * @param defaultCountryCode - Default country code (default: "1" for US)
 * @returns Formatted phone number in E.164 format or empty string if invalid
 */
export function formatPhoneForTwilio(phoneNumber: string, defaultCountryCode: string = "1"): string {
  if (!phoneNumber) return "";
  
  // Remove all non-numeric characters
  const digitsOnly = phoneNumber.replace(/\D/g, "");
  
  // If number is empty after cleaning, return empty
  if (!digitsOnly) return "";
  
  // If number already starts with country code
  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    return `+${digitsOnly}`;
  }
  
  // If number is 10 digits (standard US format), add country code
  if (digitsOnly.length === 10) {
    return `+${defaultCountryCode}${digitsOnly}`;
  }
  
  // If number has country code but without +
  if (digitsOnly.length > 10) {
    return `+${digitsOnly}`;
  }
  
  // Invalid length
  return "";
}

/**
 * Formats a phone number for display (user-friendly format)
 * Converts +13025389413 to (302) 538-9413
 * @param phoneNumber - The phone number in E.164 format
 * @returns Formatted phone number for display
 */
export function formatPhoneForDisplay(phoneNumber: string): string {
  if (!phoneNumber) return "";
  
  // Remove all non-numeric characters
  const digitsOnly = phoneNumber.replace(/\D/g, "");
  
  // Handle US numbers (11 digits starting with 1, or 10 digits)
  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    const areaCode = digitsOnly.slice(1, 4);
    const firstPart = digitsOnly.slice(4, 7);
    const lastPart = digitsOnly.slice(7, 11);
    return `(${areaCode}) ${firstPart}-${lastPart}`;
  }
  
  if (digitsOnly.length === 10) {
    const areaCode = digitsOnly.slice(0, 3);
    const firstPart = digitsOnly.slice(3, 6);
    const lastPart = digitsOnly.slice(6, 10);
    return `(${areaCode}) ${firstPart}-${lastPart}`;
  }
  
  // Return original if format not recognized
  return phoneNumber;
}

/**
 * Validates if a phone number is in valid E.164 format
 * @param phoneNumber - The phone number to validate
 * @returns true if valid E.164 format
 */
export function isValidE164(phoneNumber: string): boolean {
  if (!phoneNumber) return false;
  
  // E.164 format: + followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Formats phone number as user types (for input field)
 * Applies (XXX) XXX-XXXX format automatically
 * @param value - Current input value
 * @returns Formatted value for display
 */
export function formatPhoneInput(value: string): string {
  if (!value) return "";
  
  // Remove all non-numeric characters
  const digitsOnly = value.replace(/\D/g, "");
  
  // Apply formatting based on length
  if (digitsOnly.length <= 3) {
    return digitsOnly;
  } else if (digitsOnly.length <= 6) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
  } else {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
  }
}
