/**
 * Gmail Service for Email Processing
 * 
 * This service handles all Gmail API interactions including:
 * - Authentication using OAuth2
 * - Fetching and filtering emails
 * - Processing email content
 * - Managing Gmail labels
 * 
 * Required environment variables:
 * - GMAIL_CLIENT_ID: OAuth client ID
 * - GMAIL_CLIENT_SECRET: OAuth client secret
 * - GMAIL_REFRESH_TOKEN: OAuth refresh token
 * - GMAIL_REDIRECT_URI: OAuth redirect URI (optional)
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Define required Gmail API scopes
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels'
];

export class GmailService {
  constructor() {
    this.gmail = null;
    this.auth = null;
  }

  /**
   * Load OAuth2 credentials and initialize authentication
   * @throws {Error} If required environment variables are missing
   */
  async loadCredentials() {
    try {
      if (!process.env.GMAIL_REFRESH_TOKEN) {
        throw new Error('GMAIL_REFRESH_TOKEN environment variable is not set');
      }

      this.auth = new OAuth2Client(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI
      );

      const credentials = {
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
        scope: GMAIL_SCOPES.join(' '),
        token_type: 'Bearer'
      };

      this.auth.setCredentials(credentials);
      await this.auth.getAccessToken();

    } catch (err) {
      console.error('Error loading credentials:', err);
      throw err;
    }
  }

  /**
   * Initialize Gmail API client
   */
  async initialize() {
    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
  }

  /**
   * Fetch recent unprocessed emails
   * @param {number} maxResults - Maximum number of emails to fetch
   * @returns {Promise<Array>} Array of email objects
   */
  async getRecentEmails(maxResults = 10) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: maxResults,
        q: `in:inbox -from:me -label:G2SMS ${this.options?.q || ''}`,
      });

      if (!response.data.messages) {
        console.log('No messages found');
        return [];
      }

      const emails = await Promise.all(
        response.data.messages.map(async (message) => {
          const email = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
          });
          return email.data;
        })
      );

      return emails;
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  /**
   * Filter emails based on whitelist/blacklist configuration
   * @param {Array} emails - Array of email objects to filter
   * @param {Object} whitelist - Whitelist/blacklist configuration
   * @returns {Array} Filtered email objects
   */
  async filterEmails(emails, whitelist) {
    return emails.filter((email) => {
      const headers = email.payload.headers;
      const from = headers.find((h) => h.name === 'From').value;
      const subject = headers.find((h) => h.name === 'Subject')?.value || '';
      
      console.log('\nFiltering email:');
      console.log('From:', from);
      console.log('Subject:', subject);
      
      // Check blacklist first
      const isBlacklisted = whitelist.blacklist?.some(blocked => 
        from.toLowerCase().includes(blocked.toLowerCase())
      );
      
      if (isBlacklisted) {
        console.log('- Blacklist match: true (rejecting)');
        return false;
      }
      
      // Get email content for keyword search
      const content = this.extractEmailContent(email);

      // Check various whitelist criteria
      const fromDomainMatch = whitelist.domainWhitelist.some(domain => 
        from.toLowerCase().includes(domain.toLowerCase())
      );

      const fromEmailMatch = whitelist.emailWhitelist.some(email => 
        from.toLowerCase() === email.toLowerCase()
      );

      const subjectMatch = whitelist.subjectWhitelist.some(phrase => 
        subject.toLowerCase().includes(phrase.toLowerCase())
      );

      const contentMatch = whitelist.contentWhitelist.some(keyword =>
        content.toLowerCase().includes(keyword.toLowerCase())
      );

      console.log('Match results:');
      console.log('- Domain match:', fromDomainMatch);
      console.log('- Email match:', fromEmailMatch);
      console.log('- Subject match:', subjectMatch);
      console.log('- Content match:', contentMatch);

      return fromDomainMatch || fromEmailMatch || subjectMatch || contentMatch;
    });
  }

  /**
   * Extract plain text content from email
   * @private
   */
  extractEmailContent(email) {
    let content = '';
    if (email.payload.parts) {
      const textPart = email.payload.parts.find(part => part.mimeType === 'text/plain');
      if (textPart?.body.data) {
        content = Buffer.from(textPart.body.data, 'base64').toString();
      }
    } else if (email.payload.body.data) {
      content = Buffer.from(email.payload.body.data, 'base64').toString();
    }
    return content;
  }

  /**
   * Get cleaned email content for processing
   * @param {Object} email - Email object to process
   * @returns {string} Cleaned email content
   */
  async getEmailContent(email) {
    try {
      const content = this.extractEmailContent(email);
      
      return content
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } catch (error) {
      console.error('Error extracting email content:', error);
      return '';
    }
  }
}

export const gmailService = new GmailService();
export default gmailService;