/**
 * SMS Service using TextBelt API
 * 
 * This service handles sending SMS notifications via TextBelt's API.
 * You could modify this service to use any SMS API provider by:
 * 1. Updating the API endpoint
 * 2. Modifying the payload structure
 * 3. Adjusting the response handling
 * 
 * Required environment variables:
 * - TEXTBELT_API_KEY_NEW: Your TextBelt API key
 * - PHONE_NUMBER: Primary phone number to receive SMS
 * - PHONE_NUMBER_2: Secondary phone number (optional)
 * 
 * TextBelt API documentation: https://textbelt.com/
 */

class SMSService {
  /**
   * Send SMS message to configured phone numbers
   * @param {string} message - The message content to send
   * @param {string} from - The email sender's address (for prefixing messages)
   * @returns {Promise<Array>} Array of API responses
   * @throws {Error} If required environment variables are missing or API calls fail
   */
  async sendSMS(message, from) {
    try {
      // Extract sender name from email address (e.g., "John Doe <john@example.com>" -> "John Doe")
      const senderName = from.split('<')[0].trim();
      console.log('\n=== SMS Service Debug ===');
      
      // Validate environment variables
      this.validateConfig();

      // Get configured phone numbers (filters out undefined/null values)
      const phoneNumbers = this.getConfiguredPhoneNumbers();
      
      // Send SMS to all configured numbers
      const results = await this.sendToAllNumbers(phoneNumbers, senderName, message);

      // Log responses for debugging
      console.log('TextBelt API Responses:', results);
      
      // Check for any failed sends
      this.checkForErrors(results);

      return results;
    } catch (error) {
      console.error('SMS Service Error:', error);
      throw error;
    }
  }

  /**
   * Validate required environment variables
   * @private
   */
  validateConfig() {
    if (!process.env.TEXTBELT_API_KEY_NEW || !process.env.PHONE_NUMBER) {
      throw new Error('Required environment variables are missing');
    }
  }

  /**
   * Get array of configured phone numbers
   * @private
   * @returns {Array<string>} Array of phone numbers
   */
  getConfiguredPhoneNumbers() {
    return [
      process.env.PHONE_NUMBER,
      process.env.PHONE_NUMBER_2
    ].filter(Boolean); // Remove any undefined numbers
  }

  /**
   * Send SMS to all configured numbers
   * @private
   * @param {Array<string>} phoneNumbers - Array of phone numbers to send to
   * @param {string} senderName - Name to prefix message with
   * @param {string} message - Message content
   * @returns {Promise<Array>} Array of API responses
   */
  async sendToAllNumbers(phoneNumbers, senderName, message) {
    return Promise.all(phoneNumbers.map(phone => 
      this.sendToSingleNumber(phone, senderName, message)
    ));
  }

  /**
   * Send SMS to a single number
   * @private
   * @param {string} phone - Phone number to send to
   * @param {string} senderName - Name to prefix message with
   * @param {string} message - Message content
   * @returns {Promise<Object>} API response
   */
  async sendToSingleNumber(phone, senderName, message) {
    const payload = {
      phone: phone,
      message: `[${senderName}] ${message}`,
      key: process.env.TEXTBELT_API_KEY_NEW,
    };

    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.json();
  }

  /**
   * Check API responses for errors
   * @private
   * @param {Array<Object>} results - Array of API responses
   * @throws {Error} If any sends failed
   */
  checkForErrors(results) {
    const errors = results.filter(r => !r.success);
    if (errors.length > 0) {
      throw new Error(`TextBelt API errors: ${errors.map(e => e.error).join(', ')}`);
    }
  }
}

export default new SMSService();