/**
 * Email Summarization Service using Cohere's AI API
 * 
 * This service handles email content summarization using Cohere's API.
 * While this implementation uses Cohere, you could modify this service
 * to use any LLM API (OpenAI, Anthropic, etc.) by:
 * 1. Installing the appropriate API client
 * 2. Modifying the initialize() method for your API
 * 3. Adjusting the summarizeEmail() parameters to match your chosen API
 * 
 * Required environment variable:
 * - COHERE_API_KEY: Your Cohere API key
 */

import { CohereClient } from 'cohere-ai';

class CohereService {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  /**
   * Initialize the Cohere client with API key
   * @throws {Error} If COHERE_API_KEY is not set
   */
  initialize() {
    if (!process.env.COHERE_API_KEY) {
      throw new Error('Cohere API key not found');
    }
    this.client = new CohereClient({
      token: process.env.COHERE_API_KEY
    });
    this.initialized = true;
  }

  /**
   * Summarize email content using Cohere's API
   * @param {string} emailContent - Raw email content to summarize
   * @returns {Promise<string>} Summarized content
   */
  async summarizeEmail(emailContent) {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      // Clean email content by removing common noise
      const cleanedContent = emailContent
        // Remove common email artifacts
        .replace(/On.*wrote:$/gm, '')
        .replace(/^>.*$/gm, '')
        .replace(/\[.*?\]/g, '')
        .replace(/^-{2,}.*$/gm, '')
        // Remove common signatures
        .replace(/Best regards,?.*$/gmi, '')
        .replace(/Thanks,?.*$/gmi, '')
        .replace(/Sincerely,?.*$/gmi, '')
        // Remove excess newlines
        .replace(/\n{3,}/g, '\n\n')
        // Remove email headers
        .split('\n')
        .filter(line => !line.includes('From:') && !line.includes('Sent:') && !line.includes('To:'))
        .join('\n')
        .trim();

      // For short emails, return first two lines instead of summarizing
      if (cleanedContent.length < 250) {
        return this.formatShortContent(cleanedContent);
      }

      // Use Cohere API to summarize longer content
      const response = await this.client.summarize({
        text: cleanedContent,
        length: 'short',
        format: 'paragraph',
        extractiveness: 'high',
        temperature: 0.3,
        additional_command: 'Focus on key actions, dates, amounts, and deadlines. Remove any URLs or contact information.'
      });

      return this.formatSummary(response.summary);

    } catch (error) {
      // Handle case where content is too short for API
      if (error.statusCode === 400 && error.body?.message?.includes('text must be longer')) {
        return this.formatShortContent(cleanedContent);
      }
      console.error('Error summarizing email:', error);
      throw error;
    }
  }

  /**
   * Format short content (used when content is too short to summarize)
   * @private
   */
  formatShortContent(content) {
    return content
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 2)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Format API summary response
   * @private
   */
  formatSummary(summary) {
    return summary
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export default new CohereService();