# Credentials Directory

This directory contains template files for Google OAuth2 credentials needed to access Gmail. Setting these up requires a few steps through Google Cloud Console and terminal.

## Required Files
1. `oauth2.json` - Your Google OAuth2 client credentials
2. `token.json` - Your OAuth2 tokens for Gmail API access

## Detailed Setup Guide

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### 2. OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required fields:
   - App name (e.g., "Gmail to SMS")
   - User support email
   - Developer contact email
4. Add your email as a test user
5. Add required scopes:
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.labels`
   - `https://www.googleapis.com/auth/gmail.readonly`

### 3. Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Desktop app" as application type
4. Download the JSON file
5. Rename it to `oauth2.json` and place in this directory

### 4. Get Refresh Token
1. Install Google OAuth library:
   ```bash
   npm install google-auth-library
   ```

2. Run the authentication script (we'll provide this)
3. You'll see a URL in the terminal - copy and paste it into your browser
4. Log in with your Google account
5. After authorization, you'll be redirected to a URL containing a code
6. Copy this code from the URL and paste it back in the terminal
7. The script will generate `token.json` with your refresh token

### 5. Environment Variables
After setup, add these values to your GitHub repository secrets:
```
GMAIL_CLIENT_ID=<from oauth2.json>
GMAIL_CLIENT_SECRET=<from oauth2.json>
GMAIL_REFRESH_TOKEN=<from token.json>
```

## Security Notes
1. Never commit actual credentials to the repository
2. Add both files to .gitignore:
   ```
   credentials/oauth2.json
   credentials/token.json
   ```
3. Keep your credentials secure - they grant access to your Gmail
4. If credentials are ever exposed, immediately:
   - Delete the OAuth client in Google Cloud Console
   - Create new credentials
   - Update GitHub secrets

## Troubleshooting

### Common Issues
1. "Invalid Grant" error:
   - Your refresh token has expired
   - Repeat the authentication process
   - Update the GMAIL_REFRESH_TOKEN secret

2. "Access Denied" error:
   - Check OAuth consent screen configuration
   - Verify all required scopes are enabled
   - Make sure your email is added as a test user

3. "Invalid Client" error:
   - Verify client ID and secret match in GitHub secrets
   - Check oauth2.json is properly formatted
   - Confirm OAuth client is still active in Google Cloud Console

Need help? Open an issue in the repository with any error messages you're seeing.