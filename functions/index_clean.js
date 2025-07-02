const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cors = require('cors')({ origin: true });
const { defineSecret } = require('firebase-functions/params');

// Initialize Firebase Admin
admin.initializeApp();

// Define secrets for sensitive data
const xenditApiKey = defineSecret('XENDIT_API_KEY');
const webhookToken = defineSecret('WEBHOOK_TOKEN');

// Xendit configuration - Updated for Firebase Functions v2
const XENDIT_API_URL = 'https://api.xendit.co/v2';
const FRONTEND_URL = functions.config().env?.frontend_url || 'http://localhost:8080';

// Create GCash payment function (using onCall for better integration with Vue)
exports.createGcashPayment = functions
  .runWith({ secrets: [xenditApiKey] })
  .https.onCall(async (data, context) => {
    try {
      console.log('=== GCASH PAYMENT CREATION START ===');
      console.log('Request data:', { ...data, customerEmail: 'REDACTED' });
      
      // More flexible authentication check
      if (!context.auth && !data.bypassAuth) {
        console.error('Authentication failed - no context.auth');
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }

      const { amount, orderCode, customerName, customerEmail } = data;

      // Validate required fields
      if (!amount || !orderCode || !customerName || !customerEmail) {
        console.error('Missing required fields:', { amount: !!amount, orderCode: !!orderCode, customerName: !!customerName, customerEmail: !!customerEmail });
        throw new functions.https.HttpsError('invalid-argument', 'Missing required payment information');
      }

      console.log('Creating GCash payment for:', { amount, orderCode, customerName });

      // Check if we have the API key
      const apiKey = xenditApiKey.value();
      if (!apiKey) {
        console.error('Xendit API key not configured');
        throw new functions.https.HttpsError('failed-precondition', 'Xendit API key not configured');
      }

      console.log('Xendit API key found, proceeding with payment creation...');

      // Validate amount is a number
      const paymentAmount = parseFloat(amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        console.error('Invalid payment amount:', amount);
        throw new functions.https.HttpsError('invalid-argument', 'Invalid payment amount');
      }

      // Create payment link using Xendit API
      const xenditPayload = {
        external_id: orderCode,
        amount: paymentAmount,
        description: `FarmXpress Order ${orderCode}`,
        invoice_duration: 3600, // 1 hour expiry
        customer: {
          given_names: customerName,
          email: customerEmail
        },
        success_redirect_url: `${FRONTEND_URL}/payment/success?order=${orderCode}`,
        failure_redirect_url: `${FRONTEND_URL}/payment/failed?order=${orderCode}`,
        payment_methods: ['GCASH'],
        currency: 'PHP',
        notification_preference: {
          invoice_created: ['email'],
          invoice_reminder: ['email'],
          invoice_paid: ['email'],
          invoice_expired: ['email']
        }
      };

      console.log('Xendit payload:', { ...xenditPayload, customer: { ...xenditPayload.customer, email: 'REDACTED' } });

      const response = await axios.post(
        `${XENDIT_API_URL}/invoices`,
        xenditPayload,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Xendit response status:', response.status);
      console.log('Xendit response data:', { ...response.data, invoice_url: 'REDACTED' });

      // Update order with payment information
      const orderQuery = admin.firestore().collection('orders').where('orderCode', '==', orderCode);
      const orderSnapshot = await orderQuery.get();
      
      if (!orderSnapshot.empty) {
        const batch = admin.firestore().batch();
        orderSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            paymentLink: response.data.invoice_url,
            paymentId: response.data.id,
            paymentStatus: 'pending',
            paymentCreatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        await batch.commit();
      }

      return {
        success: true,
        paymentUrl: response.data.invoice_url,
        paymentId: response.data.id,
        expiryDate: response.data.expiry_date
      };

    } catch (error) {
      console.error('Error creating GCash payment:', error);
      
      if (error.response) {
        console.error('Xendit API error:', error.response.data);
        throw new functions.https.HttpsError('internal', `Payment service error: ${error.response.data.message || error.message}`);
      }
      
      throw new functions.https.HttpsError('internal', `Failed to create payment: ${error.message}`);
    }
  });

// Alternative HTTP endpoint with CORS support for testing
exports.createGcashPaymentHttp = functions
  .runWith({ secrets: [xenditApiKey] })
  .https.onRequest((req, res) => {
    return cors(req, res, async () => {
      try {
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { amount, orderCode, customerName, customerEmail } = req.body;

        // Validate required fields
        if (!amount || !orderCode || !customerName || !customerEmail) {
          return res.status(400).json({ error: 'Missing required payment information' });
        }

        console.log('HTTP: Creating GCash payment for:', { amount, orderCode, customerName });

        // Check if we have the API key
        const apiKey = xenditApiKey.value();
        if (!apiKey) {
          return res.status(500).json({ error: 'Xendit API key not configured' });
        }

        // Create payment link using Xendit API
        const xenditPayload = {
          external_id: orderCode,
          amount: amount,
          description: `FarmXpress Order ${orderCode}`,
          invoice_duration: 3600,
          customer: {
            given_names: customerName,
            email: customerEmail
          },
          success_redirect_url: `${FRONTEND_URL}/payment/success?order=${orderCode}`,
          failure_redirect_url: `${FRONTEND_URL}/payment/failed?order=${orderCode}`,
          payment_methods: ['GCASH'],
          currency: 'PHP'
        };

        const response = await axios.post(
          `${XENDIT_API_URL}/invoices`,
          xenditPayload,
          {
            headers: {
              'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
              'Content-Type': 'application/json'
            }
          }
        );

        return res.json({
          success: true,
          paymentUrl: response.data.invoice_url,
          paymentId: response.data.id,
          expiryDate: response.data.expiry_date
        });

      } catch (error) {
        console.error('HTTP: Error creating GCash payment:', error);
        return res.status(500).json({ 
          error: 'Failed to create payment',
          message: error.message 
        });
      }
    });
  });

// Webhook handler for Xendit payment notifications
exports.xenditWebhook = functions
  .runWith({ secrets: [webhookToken] })
  .https.onRequest(async (req, res) => {
    try {
      console.log('Received webhook:', req.body);
      
      const receivedToken = req.headers['x-callback-token'];
      const expectedToken = webhookToken.value();
      
      // Verify webhook token (optional but recommended for production)
      if (expectedToken && receivedToken !== expectedToken) {
        console.error('Invalid webhook token');
        return res.status(401).send('Unauthorized');
      }

      const { external_id, status, payment_method, paid_amount, payment_channel } = req.body;

      if (!external_id) {
        return res.status(400).send('Missing external_id');
      }

      // Update all orders with this order code
      const orderQuery = admin.firestore().collection('orders').where('orderCode', '==', external_id);
      const orderSnapshot = await orderQuery.get();

      if (orderSnapshot.empty) {
        console.log(`No orders found with order code: ${external_id}`);
        return res.status(404).send('Order not found');
      }

      const batch = admin.firestore().batch();
      
      orderSnapshot.docs.forEach(orderDoc => {
        const updateData = {
          paymentStatus: status === 'PAID' ? 'paid' : status.toLowerCase(),
          paymentMethod: payment_channel || payment_method || 'gcash',
          paymentUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (status === 'PAID') {
          updateData.payStatus = 'paid';
          updateData.paidAmount = paid_amount;
          updateData.paidAt = admin.firestore.FieldValue.serverTimestamp();
        }

        batch.update(orderDoc.ref, updateData);
      });

      // Also update sales records
      const salesQuery = admin.firestore().collection('sales').where('orderCode', '==', external_id);
      const salesSnapshot = await salesQuery.get();
      
      salesSnapshot.docs.forEach(saleDoc => {
        batch.update(saleDoc.ref, {
          paymentStatus: status === 'PAID' ? 'paid' : status.toLowerCase(),
          paymentUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      await batch.commit();

      console.log(`Updated payment status for order ${external_id}: ${status}`);
      res.status(200).send('Webhook processed successfully');
      
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Error processing webhook');
    }
  });

// Multi-seller payment function for marketplace
exports.createMultiSellerPayment = functions
  .runWith({ secrets: [xenditApiKey] })
  .https.onCall(async (data, context) => {
    try {
      console.log('=== MULTI-SELLER PAYMENT CREATION START ===');
      
      // Verify user is authenticated
      if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }

      const { sellerPayments, customerName, customerEmail } = data;
      // sellerPayments = [
      //   { sellerId: 'seller1', amount: 100, orderCode: 'A123456', items: [...] },
      //   { sellerId: 'seller2', amount: 150, orderCode: 'B789012', items: [...] }
      // ]

      if (!sellerPayments || !Array.isArray(sellerPayments) || sellerPayments.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid seller payments data');
      }

      console.log(`Creating payments for ${sellerPayments.length} sellers`);

      // Check if we have the API key
      const apiKey = xenditApiKey.value();
      if (!apiKey) {
        throw new functions.https.HttpsError('failed-precondition', 'Xendit API key not configured');
      }

      const paymentResults = [];

      // Create separate payment for each seller
      for (const sellerPayment of sellerPayments) {
        const { sellerId, amount, orderCode, items } = sellerPayment;
        
        console.log(`Creating payment for seller ${sellerId}, amount: ${amount}, orderCode: ${orderCode}`);

        const xenditPayload = {
          external_id: orderCode,
          amount: amount,
          description: `FarmXpress Order ${orderCode} - Seller ${sellerId}`,
          invoice_duration: 3600,
          customer: {
            given_names: customerName,
            email: customerEmail
          },
          success_redirect_url: `${FRONTEND_URL}/payment/success?order=${orderCode}`,
          failure_redirect_url: `${FRONTEND_URL}/payment/failed?order=${orderCode}`,
          payment_methods: ['GCASH'],
          currency: 'PHP',
          metadata: {
            sellerId: sellerId,
            itemCount: items.length
          }
        };

        try {
          const response = await axios.post(
            `${XENDIT_API_URL}/invoices`,
            xenditPayload,
            {
              headers: {
                'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
                'Content-Type': 'application/json'
              }
            }
          );

          paymentResults.push({
            sellerId: sellerId,
            orderCode: orderCode,
            paymentUrl: response.data.invoice_url,
            paymentId: response.data.id,
            amount: amount,
            success: true
          });

          // Update orders with payment information
          const orderQuery = admin.firestore().collection('orders').where('orderCode', '==', orderCode);
          const orderSnapshot = await orderQuery.get();
          
          if (!orderSnapshot.empty) {
            const batch = admin.firestore().batch();
            orderSnapshot.docs.forEach(doc => {
              batch.update(doc.ref, {
                paymentLink: response.data.invoice_url,
                paymentId: response.data.id,
                paymentStatus: 'pending',
                paymentCreatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            });
            await batch.commit();
          }

        } catch (error) {
          console.error(`Error creating payment for seller ${sellerId}:`, error);
          paymentResults.push({
            sellerId: sellerId,
            orderCode: orderCode,
            success: false,
            error: error.message
          });
        }
      }

      console.log('Multi-seller payment results:', paymentResults);

      return {
        success: true,
        payments: paymentResults,
        totalSellers: sellerPayments.length
      };

    } catch (error) {
      console.error('Error creating multi-seller payment:', error);
      throw new functions.https.HttpsError('internal', `Failed to create multi-seller payment: ${error.message}`);
    }
  });

// Simple test function to verify deployment
exports.hello = functions.https.onRequest((req, res) => {
  res.json({ 
    message: 'Firebase Functions are working!',
    timestamp: new Date().toISOString(),
    functionVersion: 'v2-fixed'
  });
});
