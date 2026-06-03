import { nanoid } from 'nanoid';

/**
 * Generates a random 6-character alphanumeric short code
 * Uses nanoid with a custom alphabet for URL-safe codes
 */
export const generateShortCode = () => {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  return nanoid(6);
};

/**
 * Detects device type from user agent string
 */
export const detectDevice = (userAgent = '') => {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return 'Mobile';
  return 'Desktop';
};

/**
 * Detects browser from user agent string
 */
export const detectBrowser = (userAgent = '') => {
  if (/edg/i.test(userAgent)) return 'Edge';
  if (/chrome/i.test(userAgent) && !/chromium/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'Safari';
  if (/opera|opr/i.test(userAgent)) return 'Opera';
  if (/msie|trident/i.test(userAgent)) return 'Internet Explorer';
  return 'Unknown';
};
