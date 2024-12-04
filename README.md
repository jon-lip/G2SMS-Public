# Gmail-to-SMS Notification System

A practical solution for managing email overload by converting important emails to SMS notifications. I built this because I was getting overwhelmed with 100+ school emails a day for my son, and needed a cheap, reliable way to get only the important updates.

## Why This Exists

- **The Problem**: Too many emails, but can't ignore them because some are important
- **The Solution**: Filter important emails and get them as SMS notifications
- **Why This Approach**:
  - GitHub Actions are free and reliable for automation
  - TextBelt offers cheap SMS ($0.01/message, or ~$30/month for 100 messages/day)
  - Gmail API is free and well-documented
  - Cohere AI provides good email summarization (free tier available)

## How It Works

1. Every 15 minutes, GitHub Actions checks your Gmail
2. Filters emails based on your whitelist rules (sender, domain, subject, content)
3. Uses Cohere AI to create a concise summary
4. Sends the summary via SMS using TextBelt
5. Marks the email as processed (adds Gmail label)

## Setup Guide

### 1. Gmail API Setup

1. **Google Cloud Console Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or select existing)
   - Note your project name and ID

2. **Enable Gmail API**
   - In the left sidebar, go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Select "External" user type
   - Fill in required fields (app name, user support email, developer contact)
   - Add your email as a test user
   - Required scopes:
     - `https://www.googleapis.com/auth/gmail.modify`
     - `https://www.googleapis.com/auth/gmail.labels`
     - `https://www.googleapis.com/auth/gmail.readonly`

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Desktop app" as application type
   - Name your client
   - Download the client configuration JSON file
   - Rename it to `oauth2.json` and place in `credentials/` folder

5. **Get Refresh Token**
   - Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
   - Click the settings icon (⚙️) in the top right
   - Check "Use your own OAuth credentials"
   - Enter your OAuth client ID and secret from the downloaded JSON
   - In the left sidebar, find "Gmail API v1"
   - Select these scopes:
     ```
     https://www.googleapis.com/auth/gmail.modify
     https://www.googleapis.com/auth/gmail.labels
     https://www.googleapis.com/auth/gmail.readonly
     ```
   - Click "Authorize APIs"
   - Sign in with your Google account
   - Click "Exchange authorization code for tokens"
   - Copy the refresh token

6. **Set Up Credentials Folder**
   ```bash
   mkdir -p credentials
   ```
   
   You'll need two files in your credentials folder:
   
   1. `credentials/oauth2.json` (from step 4):
   ```json
   {
     "installed": {
       "client_id": "your-client-id",
       "client_secret": "your-client-secret",
       "redirect_uris": ["http://localhost"]
     }
   }
   ```

   2. `credentials/token.json` (from step 5):
   ```json
   {
     "refresh_token": "your-refresh-token",
     "token_type": "Bearer"
   }
   ```

7. **Verify Setup**
   - Add both files to your `.gitignore`:
     ```
     credentials/oauth2.json
     credentials/token.json
     ```
   - Add the credentials as GitHub secrets (from step 4 & 5):
     - `GMAIL_CLIENT_ID`
     - `GMAIL_CLIENT_SECRET`
     - `GMAIL_REFRESH_TOKEN`

Common Issues:
- If you get "invalid_grant", your refresh token has expired. Repeat step 5
- If you get "access denied", check your OAuth consent screen configuration
- Make sure all required scopes are enabled in both OAuth consent screen and OAuth playground

### 2. TextBelt Setup
1. Go to [TextBelt](https://textbelt.com/)
2. Purchase credits or subscribe
3. Get your API key

### 3. Cohere Setup
1. Sign up at [Cohere](https://cohere.ai/)
2. Get your API key

### 4. Repository Setup & GitHub Actions Configuration

1. **Fork & Clone Repository**
   - Fork this repository to your GitHub account
   - Clone your forked repository:
     ```bash
     git clone https://github.com/your-username/G2SMS-Public.git
     cd G2SMS-Public
     ```

2. **Configure GitHub Secrets**
   - Go to your forked repository on GitHub
   - Navigate to Settings > Secrets and Variables > Actions
   - Click "New repository secret"
   - Add each of these secrets:
     ```
     GMAIL_CLIENT_ID         # From Gmail OAuth setup
     GMAIL_CLIENT_SECRET     # From Gmail OAuth setup
     GMAIL_REFRESH_TOKEN     # From OAuth Playground
     COHERE_API_KEY         # From Cohere dashboard
     TEXTBELT_API_KEY_NEW   # From TextBelt dashboard
     PHONE_NUMBER           # Your phone number in format: +1234567890
     PHONE_NUMBER_2         # (Optional) Additional phone number
     ```

3. **Verify GitHub Actions Workflow**
   - Go to the "Actions" tab in your repository
   - If prompted, enable GitHub Actions
   - You should see the "Check Emails" workflow
   - The workflow file is located at `.github/workflows/check-emails.yml`
   - Default schedule is every 15 minutes:
     ```yaml
     schedule:
       - cron: '*/15 * * * *'
     ```

4. **Test the Setup**
   - Go to Actions > Check Emails workflow
   - Click "Run workflow" > "Run workflow"
   - Monitor the execution in the Actions tab
   - Check logs for any errors
   - Verify you receive a test SMS

5. **Customize Action Schedule** (Optional)
   Edit `.github/workflows/check-emails.yml`:
   ```yaml
   # Run more/less frequently (default: every 15 minutes)
   schedule:
     - cron: '*/15 * * * *'   # Every 15 minutes
     # - cron: '0 * * * *'    # Every hour
     # - cron: '0 */2 * * *'  # Every 2 hours
   ```

6. **Monitor Usage**
   - Check GitHub Actions minutes in your repository's Settings > Actions
   - Monitor TextBelt credit usage at textbelt.com
   - Watch for any error notifications in Actions logs

Common GitHub Actions Issues:
- If workflows aren't running, check:
  - Repository Actions permissions (Settings > Actions > General)
  - Workflow permissions (Settings > Actions > General > Workflow permissions)
  - Secret names match exactly with workflow file
- If you hit GitHub Actions limits:
  - Adjust schedule to run less frequently
  - Consider upgrading GitHub plan for more minutes
- If workflow succeeds but no SMS:
  - Check TextBelt credit balance
  - Verify phone number format in secrets
  - Look for SMS API errors in workflow logs

### 5. Configure Filtering
Edit `src/config/whitelist.js` to set your rules:

```javascript
// Specific email addresses to process
export const emailWhitelist = [
    'teacher@school.edu',
    'principal@school.edu'
];

// Domains to process all emails from
export const domainWhitelist = [
    'school.edu',
    'district.edu'
];

// Subject keywords to match
export const subjectWhitelist = [
    'important',
    'urgent',
    'attendance'
];

// Content keywords to match
export const contentWhitelist = [
    'field trip',
    'emergency'
];

// Emails or domains to always ignore
export const blacklist = [
    'spam@school.edu',
    'newsletter@district.edu'
];
```

## Usage

The system runs automatically every 15 minutes. You can also:
- Trigger manually from GitHub Actions tab
- Test SMS sending with the test workflow
- Monitor runs in GitHub Actions

## Cost Breakdown

- GitHub Actions: Free (within monthly limits)
- TextBelt: ~$0.01 per message
- Gmail API: Free
- Cohere AI: Free tier available

Example: Processing 100 emails/day = ~$30/month

## Troubleshooting

### Common Issues
1. **No SMS Received**
   - Check TextBelt API key
   - Verify phone number format
   - Check GitHub Actions logs

2. **Not Processing Emails**
   - Verify Gmail credentials
   - Check whitelist configuration
   - Look for errors in Actions logs

3. **Rate Limiting**
   - TextBelt: Check your credit balance
   - GitHub Actions: Review usage limits

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - See LICENSE file

## Acknowledgments

- TextBelt for affordable SMS API
- Cohere for email summarization
- GitHub Actions for reliable automation