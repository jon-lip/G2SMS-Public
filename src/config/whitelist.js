/**
 * Email Filtering Configuration
 * 
 * This file defines the filtering rules for processing emails.
 * An email will be processed if it matches ANY of these criteria:
 * 1. Sender's email matches emailWhitelist (exact match)
 * 2. Sender's domain matches domainWhitelist (partial match)
 * 3. Subject contains any subjectWhitelist keywords
 * 4. Content contains any contentWhitelist keywords
 * 
 * However, if the sender matches ANY blacklist entry, the email
 * will be ignored regardless of other matches.
 * 
 * All matches are case-insensitive.
 * 
 * Example: An email from updates@company.com with subject "Important Update"
 * would be processed because:
 * - The domain "company.com" matches domainWhitelist
 * - The subject contains "important" from subjectWhitelist
 */

export const emailWhitelist = [
  // Add specific email addresses to always process
  'example@domain.com',
  'notifications@service.com'
];

export const domainWhitelist = [
  // Add trusted domains to process
  'company.com',
  'school.edu',
  'notifications.service.com'
];

export const subjectWhitelist = [
  // Add subject keywords to match
  'important',
  'urgent',
  'notification'
];

export const contentWhitelist = [
  // Add content keywords to match
  'critical',
  'action required'
];

// Add any emails, domains, or keywords to block
export const blacklist = [
  'spam@example.com',
  'unwanted.domain.com'
]; 