import gmailService from '../services/gmail.js';
import cohereService from '../services/cohere.js';
import smsService from '../services/sms.js';
import { emailWhitelist, domainWhitelist, subjectWhitelist, contentWhitelist, blacklist } from '../config/whitelist.js';

// Label used to mark processed emails
const PROCESSED_LABEL = 'G2SMS';

/**
 * Creates or finds the Gmail label used to mark processed emails
 * @returns {Promise<string>} The label ID
 */
async function ensureLabel() {
  try {
    const response = await gmailService.gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: PROCESSED_LABEL,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show'
      }
    });
    return response.data.id;
  } catch (error) {
    // Label might already exist, try to find it
    const labels = await gmailService.gmail.users.labels.list({ userId: 'me' });
    const label = labels.data.labels.find(l => l.name === PROCESSED_LABEL);
    return label ? label.id : null;
  }
}

/**
 * Main function to process emails:
 * 1. Gets recent unprocessed emails
 * 2. Filters them based on whitelist/blacklist
 * 3. Summarizes content using Cohere AI
 * 4. Sends SMS notifications
 * 5. Marks emails as processed
 */
async function processEmails() {
  try {
    console.log('Initializing Gmail service...');
    console.log('Script environment check:');
    console.log('TEXTBELT_API_KEY_NEW:', process.env.TEXTBELT_API_KEY_NEW ? 'set' : 'not set');
    console.log('PHONE_NUMBER:', process.env.PHONE_NUMBER ? 'set' : 'not set');
    
    await gmailService.loadCredentials();
    await gmailService.initialize();

    const labelId = await ensureLabel();
    if (!labelId) {
      throw new Error('Could not create or find the processed label');
    }

    // Get unprocessed emails
    const emails = await gmailService.getRecentEmails(10, {
      q: `-label:${PROCESSED_LABEL}`
    });
    
    // Filter emails using whitelist
    const filteredEmails = await gmailService.filterEmails(emails, {
      emailWhitelist,
      domainWhitelist,
      subjectWhitelist,
      contentWhitelist,
      blacklist
    });
    
    console.log(`Found ${filteredEmails.length} emails to process`);

    // Process each email automatically
    for (const email of filteredEmails) {
      try {
        const headers = email.payload.headers;
        const from = headers.find(h => h.name === 'From').value;
        const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
        const content = await gmailService.getEmailContent(email);

        console.log(`\nProcessing email from: ${from}`);
        console.log(`Subject: ${subject}`);

        // Generate summary using AI
        const summary = await cohereService.summarizeEmail(content, from);
        console.log('Summary generated');

        // Send SMS notification
        await smsService.sendSMS(summary, from);
        console.log('SMS sent successfully');

        // Mark as processed
        await gmailService.gmail.users.messages.modify({
          userId: 'me',
          id: email.id,
          requestBody: {
            addLabelIds: [labelId]
          }
        });
        console.log('Email marked as processed');

      } catch (error) {
        console.error('Error processing email:', error);
        // Continue with next email even if one fails
        continue;
      }
    }

    console.log('\nEmail processing complete');

  } catch (error) {
    console.error('Error in email processing:', error);
    throw error;
  }
}

// Run the process
processEmails().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});