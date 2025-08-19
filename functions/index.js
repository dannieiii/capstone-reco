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
// IMPORTANT: FRONTEND_URL is used for Xendit redirect URLs
// Priority: environment variable -> Firebase runtime config (functions:config:set app.frontend_url=...) -> localhost
const FRONTEND_URL = process.env.FRONTEND_URL || (functions.config().app && functions.config().app.frontend_url) || 'http://localhost:8080';

// Create GCash payment function (using onCall for better integration with Vue)
exports.createGcashPayment = functions.https.onCall({
  secrets: [xenditApiKey]
}, async (data, context) => {
    try {
      console.log('=== GCASH PAYMENT CREATION START ===');
      console.log('Request data:', { ...data, customerEmail: 'REDACTED' });
      
      // Allow bypass for development/testing
      const isAuthenticated = context.auth || data.bypassAuth;
      if (!isAuthenticated) {
        console.error('Authentication failed - no context.auth and no bypassAuth');
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }

  const { amount, orderCode, customerName, customerEmail, paymentType, metadata } = data;

      // Validate required fields
      if (!amount || !orderCode || !customerName || !customerEmail) {
        console.error('Missing required fields:', { amount: !!amount, orderCode: !!orderCode, customerName: !!customerName, customerEmail: !!customerEmail });
        throw new functions.https.HttpsError('invalid-argument', 'Missing required payment information');
      }

      console.log('Creating GCash payment for:', { amount, orderCode, customerName });

      // Check if we have the API key
  const apiKey = (xenditApiKey.value() || '').trim();
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
  // Success/Failure redirect URLs consumed by router to show details based on orderCode
  success_redirect_url: `${FRONTEND_URL}/payment/success?order=${orderCode}`,
  failure_redirect_url: `${FRONTEND_URL}/payment/failed?order=${orderCode}`,
        payment_methods: ['GCASH'],
        currency: 'PHP',
        notification_preference: {
          invoice_created: ['email'],
          invoice_reminder: ['email'],
          invoice_paid: ['email'],
          invoice_expired: ['email']
        },
        metadata: {
          ...(metadata || {}),
          ...(paymentType ? { paymentType } : {})
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
exports.createGcashPaymentHttp = functions.https.onRequest({
  secrets: [xenditApiKey],
  invoker: 'public'
}, (req, res) => {
    return cors(req, res, async () => {
      try {
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

  const { amount, orderCode, customerName, customerEmail, paymentType, metadata } = req.body;

        // Validate required fields
        if (!amount || !orderCode || !customerName || !customerEmail) {
          return res.status(400).json({ error: 'Missing required payment information' });
        }

        console.log('HTTP: Creating GCash payment for:', { amount, orderCode, customerName });

        // Check if we have the API key
  const apiKey = (xenditApiKey.value() || '').trim();
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
          currency: 'PHP',
          metadata: {
            ...(metadata || {}),
            ...(paymentType ? { paymentType } : {})
          }
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
exports.xenditWebhook = functions.https.onRequest({
  secrets: [webhookToken],
  invoker: 'public'
}, async (req, res) => {
    try {
      console.log('Received webhook:', req.body);
      
  const expectedToken = webhookToken.value();
      // Accept token via header (preferred) or query string fallback (?token=...)
  const headerToken = req.headers['x-callback-token'];
  const queryToken = req.query.token || req.query['x-callback-token'];
  const receivedTokenRaw = headerToken || queryToken;
  const normalize = (s) => (s ?? '').toString().trim();
  const receivedToken = normalize(receivedTokenRaw);
  const expectedTokenNorm = normalize(expectedToken);

      // Verify webhook token (recommended for production)
      if (expectedTokenNorm) {
        if (!receivedToken) {
          console.error('Missing webhook token');
          return res.status(401).send('Unauthorized');
        }
        if (receivedToken !== expectedTokenNorm) {
          console.error('Invalid webhook token');
          return res.status(401).send('Unauthorized');
        }
      }

      // If this is a simple GET ping from a dashboard test, return 200 OK after token check
      if (req.method !== 'POST') {
        return res.status(200).send('Webhook OK');
      }

  const { external_id, status, payment_method, paid_amount, payment_channel, metadata } = req.body;

  if (!external_id) {
        return res.status(400).send('Missing external_id');
      }

      // external_id corresponds to our groupOrderCode
      // Update all orders where groupOrderCode == external_id OR orderCode == external_id (fallback)
      const ordersRef = admin.firestore().collection('orders');
      let orderSnapshot = await ordersRef.where('groupOrderCode', '==', external_id).get();
      if (orderSnapshot.empty) {
        orderSnapshot = await ordersRef.where('orderCode', '==', external_id).get();
      }

      if (orderSnapshot.empty) {
        console.log(`No orders found with order code: ${external_id}`);
        // For dashboard tests or unmatched external_id, acknowledge with 200 to avoid failing webhook setup
        return res.status(200).send('No matching order; acknowledged');
      }

  const batch = admin.firestore().batch();
  const isPreorderDeposit = metadata && (metadata.paymentType === 'preorder_deposit' || metadata.type === 'preorder_deposit');
      
      orderSnapshot.docs.forEach(orderDoc => {
        const order = orderDoc.data();
        const updateData = {};
        const common = {
          paymentMethod: payment_channel || payment_method || 'gcash',
          paymentUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (isPreorderDeposit) {
          // For deposit payments, only update deposit-related fields
          updateData.depositStatus = status === 'PAID' ? 'paid' : status.toLowerCase();
          if (status === 'PAID') {
            updateData.depositPaidAmount = paid_amount;
            updateData.depositPaidAt = admin.firestore.FieldValue.serverTimestamp();
          }
          // If the order is marked as pre-order, keep main payment fields untouched
          // Mark order status to Reserved upon deposit payment
          if (order.isPreOrder === true && status === 'PAID') {
            updateData.status = order.status && order.status !== 'Cancelled' ? 'Reserved' : order.status;
          }
        } else {
          // Regular full payment update
          updateData.paymentStatus = status === 'PAID' ? 'paid' : status.toLowerCase();
          if (status === 'PAID') {
            updateData.payStatus = 'paid';
            updateData.paidAmount = paid_amount;
            updateData.paidAt = admin.firestore.FieldValue.serverTimestamp();
          }
        }

        batch.update(orderDoc.ref, { ...common, ...updateData });
      });

      // Also update sales records linked by groupOrderCode or orderCode
      const salesRef = admin.firestore().collection('sales');
      let salesSnapshot = await salesRef.where('groupOrderCode', '==', external_id).get();
      if (salesSnapshot.empty) {
        salesSnapshot = await salesRef.where('orderCode', '==', external_id).get();
      }
      
      salesSnapshot.docs.forEach(saleDoc => {
        const updateData = {
          paymentUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (isPreorderDeposit) {
          updateData.depositStatus = status === 'PAID' ? 'paid' : status.toLowerCase();
        } else {
          updateData.paymentStatus = status === 'PAID' ? 'paid' : status.toLowerCase();
        }
        batch.update(saleDoc.ref, updateData);
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
exports.createMultiSellerPayment = functions.https.onCall({
  secrets: [xenditApiKey]
}, async (data, context) => {
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
  const apiKey = (xenditApiKey.value() || '').trim();
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

// Simple test payment endpoint without authentication
exports.testGcashPayment = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      console.log('=== TEST GCASH PAYMENT START ===');
      console.log('Request body:', req.body);
      console.log('Request method:', req.method);
      
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { amount, orderCode, customerName, customerEmail } = req.body;

      // Validate required fields
      if (!amount || !orderCode || !customerName || !customerEmail) {
        return res.status(400).json({ error: 'Missing required payment information' });
      }

      // For testing - return a mock payment URL
      const mockPaymentResponse = {
        success: true,
        paymentUrl: `https://checkout.xendit.co/web/655d3bc5e2b2a7e5e5e5e5e5?for=${orderCode}`,
        paymentId: `test_${orderCode}_${Date.now()}`,
        expiryDate: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      };

      console.log('Test payment response:', mockPaymentResponse);
      return res.json(mockPaymentResponse);

    } catch (error) {
      console.error('Test payment error:', error);
      return res.status(500).json({ 
        error: 'Failed to create test payment',
        message: error.message 
      });
    }
  });
});

// Public GCash payment endpoint without authentication - REAL Xendit integration
exports.createGcashPaymentPublic = functions.https.onRequest({
  secrets: [xenditApiKey]
}, (req, res) => {
  return cors(req, res, async () => {
    try {
      console.log('=== PUBLIC GCASH PAYMENT START ===');
      console.log('Request body:', req.body);
      console.log('Request method:', req.method);
      
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

  const { amount, orderCode, customerName, customerEmail, items = [], paymentType, metadata } = req.body;

      // Validate required fields
      if (!amount || !orderCode || !customerName || !customerEmail) {
        return res.status(400).json({ error: 'Missing required payment information' });
      }

      // Validate amount
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Invalid payment amount' });
      }

      // Get API key
  const apiKey = (xenditApiKey.value() || '').trim();
      if (!apiKey) {
        console.error('Xendit API key not configured');
        return res.status(500).json({ error: 'Payment service not configured' });
      }

      console.log(`Creating GCash payment: ${numAmount} PHP for order ${orderCode}`);

      // Create Xendit invoice
      const xenditData = {
        external_id: orderCode,
        amount: numAmount,
        description: `FarmXpress Order ${orderCode}`,
        invoice_duration: 3600, // 1 hour
        customer: {
          given_names: customerName,
          email: customerEmail
        },
        customer_notification_preference: {
          invoice_created: ['email'],
          invoice_reminder: ['email'],
          invoice_paid: ['email']
        },
        payment_methods: ['GCASH'],
        currency: 'PHP',
        items: items.map(item => ({
          name: item.name || item.productName || 'Product',
          quantity: item.quantity || 1,
          price: item.price || 0,
          category: item.category || 'General'
        })),
        metadata: {
          ...(metadata || {}),
          ...(paymentType ? { paymentType } : {})
        }
      };

      console.log('Sending to Xendit:', JSON.stringify(xenditData, null, 2));

      const xenditResponse = await fetch('https://api.xendit.co/v2/invoices', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(xenditData)
      });

      const responseData = await xenditResponse.json();
      
      if (!xenditResponse.ok) {
        console.error('Xendit API error:', responseData);
        
        // For development: provide a fallback mock response if API key is invalid
        if (responseData.message && responseData.message.includes('API key')) {
          console.log('API key invalid, providing development mock response');
          
          // Check if request includes simulate flag
          const shouldSimulate = req.body.simulate === true;
          
          if (shouldSimulate) {
            // Return immediate success for simulation
            return res.json({
              success: true,
              paymentUrl: null, // No redirect needed
              paymentId: `simulated_${orderCode}_${Date.now()}`,
              expiryDate: new Date(Date.now() + 3600000).toISOString(),
              status: 'PAID',
              isDevelopmentMode: true,
              isSimulated: true,
              message: 'Development mode: Payment simulated successfully'
            });
          } else {
            // Return demo page URL
            return res.json({
              success: true,
              paymentUrl: `${FRONTEND_URL}/payment/demo?order=${orderCode}&amount=${numAmount}&mode=development`,
              paymentId: `mock_${orderCode}_${Date.now()}`,
              expiryDate: new Date(Date.now() + 3600000).toISOString(),
              status: 'PENDING',
              isDevelopmentMode: true,
              message: 'Development mode: Redirecting to demo payment page. In production, get a valid Xendit API key from https://dashboard.xendit.co'
            });
          }
        }
        
        return res.status(400).json({ 
          error: 'Failed to create payment',
          details: responseData.message || 'Payment service error'
        });
      }

      console.log('Xendit response:', responseData);

      const paymentResponse = {
        success: true,
        paymentUrl: responseData.invoice_url,
        paymentId: responseData.id,
        expiryDate: responseData.expiry_date,
        status: responseData.status
      };

      console.log('Public payment response:', paymentResponse);
      return res.json(paymentResponse);

    } catch (error) {
      console.error('Public GCash payment error:', error);
      return res.status(500).json({ 
        error: 'Failed to create payment',
        message: error.message 
      });
    }
  });
});
