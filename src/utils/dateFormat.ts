/**
 * Format a date string or Date object to US format (Month Day, Year)
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "October 18, 2025")
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format a date string or Date object to short US format (Mon Day, Year)
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "Oct 18, 2025")
 */
export const formatDateShort = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format a date string or Date object to time string
 * @param date - Date string or Date object
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format a date string or Date object to full date and time
 * @param date - Date string or Date object
 * @returns Formatted date and time string (e.g., "October 18, 2025 at 2:30 PM")
 */
export const formatDateTime = (date: string | Date): string => {
  return `${formatDate(date)} at ${formatTime(date)}`;
};
