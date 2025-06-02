const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin
admin.initializeApp();

// Xendit API configuration
const XENDIT_API_KEY = functions.config().xendit.api_key;
const XENDIT_API_URL = 'https://api.xendit.co/v2';
const FRONTEND_URL = functions.config().frontend.url;


// Create GCash payment link
exports.createGcashPayment = functions.https.onCall(async (data, context) => {
  try {
    // Verify user is authenticated
    if (!context.auth) {
      throw new Error('Unauthorized');
    }

    const { amount, orderCode, customerName, customerEmail } = data;

    // Create payment link using Xendit API
    const response = await axios.post(
      `${XENDIT_API_URL}/invoices`,
      {
        external_id: orderCode,
        amount: amount,
        description: `Payment for order ${orderCode}`,
        invoice_duration: 3600, // 1 hour expiry
        customer: {
          given_names: customerName,
          email: customerEmail
        },
        success_redirect_url: `${FRONTEND_URL}/payment/success?order=${orderCode}`,
        failure_redirect_url: `${FRONTEND_URL}/payment/failed?order=${orderCode}`,
        payment_methods: ['GCASH'],
        currency: 'PHP'
      },
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(XENDIT_API_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Update order with payment information
    const orderRef = admin.firestore().collection('orders').doc(orderCode);
    await orderRef.update({
      paymentLink: response.data.invoice_url,
      paymentId: response.data.id,
      paymentStatus: 'pending'
    });

    return {
      success: true,
      paymentUrl: response.data.invoice_url,
      paymentId: response.data.id
    };

  } catch (error) {
    console.error('Error creating GCash payment:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Webhook handler for Xendit payment notifications
exports.xenditWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const webhookToken = req.headers['x-callback-token'];
    
    // Verify webhook token
    if (webhookToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
      throw new Error('Invalid webhook token');
    }

    const { external_id, status, payment_method } = req.body;

    // Update order status based on payment status
    const orderRef = admin.firestore().collection('orders').doc(external_id);
    await orderRef.update({
      paymentStatus: status === 'PAID' ? 'paid' : 'failed',
      paymentMethod: payment_method,
      paymentUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(400).send('Error processing webhook');
  }
}); 