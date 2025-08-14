## GCash via Xendit Setup (Quick Guide)

1) Prerequisites
- Xendit account with PHP currency enabled
- Get API Key (Live/Test)
- Frontend URL (local: http://localhost:8080 or your deployed domain)

2) Configure Firebase Functions Secrets
- Set Xendit API key:
   firebase functions:secrets:set XENDIT_API_KEY
- Optionally set webhook verification token:
   firebase functions:secrets:set WEBHOOK_TOKEN

3) Deploy Functions
- Deploy your functions:
   firebase deploy --only functions

4) Webhook
- In Xendit Dashboard, add a Callback URL:
   https://us-central1-<your-project-id>.cloudfunctions.net/xenditWebhook
- If you configured WEBHOOK_TOKEN, add it as the callback token in Xendit settings.

5) Frontend Redirects
- Success: <FRONTEND_URL>/payment/success?order=<groupOrderCode>
- Failed:  <FRONTEND_URL>/payment/failed?order=<groupOrderCode>

6) Flow Summary
- Checkout generates a groupOrderCode and creates one order per seller with that link.
- A single Xendit invoice is created with external_id = groupOrderCode.
- User pays on Xendit; webhook updates all orders/sales with that group code to the new status.
- Success/Failed pages query orders by groupOrderCode or fallback to orderCode.

7) Testing Tips
- Use the createGcashPaymentPublic endpoint for test runs if callable fails due to auth.
- Check Cloud Functions logs for any API errors.

# GCash Integration Setup Guide

## Step 1: Get Xendit API Credentials

1. Go to https://dashboard.xendit.co/
2. Create an account (if you don't have one)
3. Navigate to Settings > API Keys
4. Copy your API Key (use test key for development)

## Step 2: Configure Firebase Functions

### Option A: Using Firebase Config (Recommended for production)
```bash
cd functions
firebase functions:config:set xendit.api_key="YOUR_XENDIT_API_KEY"
firebase functions:config:set xendit.webhook_token="YOUR_WEBHOOK_TOKEN"
firebase functions:config:set frontend.url="http://localhost:8080"
```

### Option B: Using Environment Variables (For local testing)
1. Create a `.env` file in the functions folder:
```
XENDIT_API_KEY=your_xendit_api_key_here
XENDIT_WEBHOOK_TOKEN=your_webhook_token_here
FRONTEND_URL=http://localhost:8080
```

## Step 3: Test Functions Locally

```bash
# Navigate to your project root
cd c:\Users\ACER\capstone\farmcapst

# Start Firebase emulator
firebase emulators:start --only functions

# This will start the functions emulator on http://localhost:5001
```

## Step 4: Deploy Functions to Firebase

```bash
# Deploy functions to production
firebase deploy --only functions
```

## Step 5: Test GCash Payment

1. Make sure your functions are deployed
2. Go to your checkout page
3. Select GCash as payment method
4. Enter a valid GCash number (for testing, use 09123456789)
5. Complete checkout - it should redirect to Xendit payment page

## Step 6: Set up Webhook (Production Only)

1. In Xendit dashboard, go to Settings > Webhooks
2. Add webhook URL: `https://YOUR_PROJECT_ID-default-rtdb.firebaseapp.com/xenditWebhook`
3. Select events: Invoice Paid, Invoice Expired, Invoice Failed

## Testing Notes:

- Use Xendit test mode for development
- Test payment amounts should be small (e.g., ₱10-100)
- Payment success/failure pages are already created
- Check Firebase Functions logs for debugging

## Troubleshooting:

1. If payment creation fails:
   - Check Firebase Functions logs
   - Verify Xendit API key is correct
   - Ensure internet connection

2. If webhook not working:
   - Check webhook URL in Xendit dashboard
   - Verify webhook token matches

3. If redirects fail:
   - Check FRONTEND_URL configuration
   - Ensure routes are properly set up
