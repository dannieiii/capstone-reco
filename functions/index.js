const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();

// CORS helpers: add explicit headers and handle OPTIONS preflight
const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '3600');
};

const maybeHandlePreflight = (req, res) => {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(req, res);
    return res.status(204).send('');
  }
  return false;
};

// App configuration
// Priority: environment variable -> Firebase runtime config (functions:config:set app.frontend_url=...) -> localhost
const FRONTEND_URL = process.env.FRONTEND_URL || (functions.config().app && functions.config().app.frontend_url) || 'http://localhost:8080';

// Create GCash payment function (manual flow, no external provider)
exports.createGcashPayment = functions.https.onCall(async (data, context) => {
    try {
  console.log('=== GCASH MANUAL PAYMENT REQUEST ===');
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

  console.log('Creating manual GCash payment for:', { amount, orderCode, customerName });

      // Validate amount is a number
      const paymentAmount = parseFloat(amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        console.error('Invalid payment amount:', amount);
        throw new functions.https.HttpsError('invalid-argument', 'Invalid payment amount');
      }

  // Update orders linked to this checkout (support groupOrderCode or orderCode)
      const ordersRef = admin.firestore().collection('orders');
      const [byGroup, byOrder] = await Promise.all([
        ordersRef.where('groupOrderCode', '==', orderCode).get(),
        ordersRef.where('orderCode', '==', orderCode).get(),
      ]);

      const docsToUpdate = new Map();
      byGroup.forEach(d => docsToUpdate.set(d.id, d));
      byOrder.forEach(d => docsToUpdate.set(d.id, d));

      if (docsToUpdate.size > 0) {
        const batch = admin.firestore().batch();
        docsToUpdate.forEach((doc) => {
          batch.update(doc.ref, {
            paymentLink: null,
            paymentId: null,
            paymentMethod: 'gcash_manual',
            paymentStatus: 'availing',
            paymentCreatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        await batch.commit();
      }

      return {
        success: true,
    paymentUrl: null,
    paymentId: null,
    expiryDate: null,
    mode: 'manual',
    message: 'Manual GCash payment initiated. Please complete the payment offline and mark as paid in the system.'
      };

    } catch (error) {
      console.error('Error creating manual GCash payment:', error);
      throw new functions.https.HttpsError('internal', `Failed to create manual payment: ${error.message}`);
    }
  });

// Alternative HTTP endpoint with CORS support (manual)
exports.createGcashPaymentHttp = functions.https.onRequest({
  invoker: 'public'
}, (req, res) => {
  if (maybeHandlePreflight(req, res)) return;
  setCorsHeaders(req, res);
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

        console.log('HTTP: Creating manual GCash payment for:', { amount, orderCode, customerName });

        // Update orders by groupOrderCode or orderCode
        const ordersRef = admin.firestore().collection('orders');
        const [byGroup, byOrder] = await Promise.all([
          ordersRef.where('groupOrderCode', '==', orderCode).get(),
          ordersRef.where('orderCode', '==', orderCode).get(),
        ]);
        const docsToUpdate = new Map();
        byGroup.forEach(d => docsToUpdate.set(d.id, d));
        byOrder.forEach(d => docsToUpdate.set(d.id, d));
        if (docsToUpdate.size > 0) {
          const batch = admin.firestore().batch();
          docsToUpdate.forEach((doc) => {
            batch.update(doc.ref, {
              paymentLink: null,
              paymentId: null,
              paymentMethod: 'gcash_manual',
              paymentStatus: 'availing',
              paymentCreatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          });
          await batch.commit();
        }

        setCorsHeaders(req, res);
        return res.json({
          success: true,
          paymentUrl: null,
          paymentId: null,
          expiryDate: null,
          mode: 'manual',
          message: 'Manual GCash payment initiated. Please complete payment offline.'
        });

      } catch (error) {
        console.error('HTTP: Error creating manual GCash payment:', error);
  setCorsHeaders(req, res);
  return res.status(500).json({ 
          error: 'Failed to create manual payment',
          message: error.message 
        });
      }
    });
  });
// Removed third-party webhook; manual payments are updated by staff inside the app.

// Multi-seller payment function for marketplace
exports.createMultiSellerPayment = functions.https.onCall(async (data, context) => {
    try {
  console.log('=== MULTI-SELLER MANUAL PAYMENT START ===');
      
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

      const paymentResults = [];

      // Create separate payment for each seller
      for (const sellerPayment of sellerPayments) {
        const { sellerId, amount, orderCode, items } = sellerPayment;
        
        console.log(`Marking manual payment for seller ${sellerId}, amount: ${amount}, orderCode: ${orderCode}`);

        // Update orders by groupOrderCode or orderCode
        const ordersRef = admin.firestore().collection('orders');
        const [byGroup, byOrder] = await Promise.all([
          ordersRef.where('groupOrderCode', '==', orderCode).get(),
          ordersRef.where('orderCode', '==', orderCode).get(),
        ]);
        const docsToUpdate = new Map();
        byGroup.forEach(d => docsToUpdate.set(d.id, d));
        byOrder.forEach(d => docsToUpdate.set(d.id, d));
        if (docsToUpdate.size > 0) {
          const batch = admin.firestore().batch();
          docsToUpdate.forEach((doc) => {
            batch.update(doc.ref, {
              paymentLink: null,
              paymentId: null,
              paymentMethod: 'gcash_manual',
              paymentStatus: 'availing',
              paymentCreatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          });
          await batch.commit();
        }

        paymentResults.push({
          sellerId: sellerId,
          orderCode: orderCode,
          paymentUrl: null,
          paymentId: null,
          amount: amount,
          success: true,
          mode: 'manual'
        });
      }

      console.log('Multi-seller payment results:', paymentResults);

      return {
        success: true,
        payments: paymentResults,
        totalSellers: sellerPayments.length
      };

    } catch (error) {
  console.error('Error handling multi-seller manual payment:', error);
  throw new functions.https.HttpsError('internal', `Failed to create multi-seller manual payment: ${error.message}`);
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

// Simple test payment endpoint without authentication (manual)
exports.testGcashPayment = functions.https.onRequest({
  invoker: 'public'
}, (req, res) => {
  if (maybeHandlePreflight(req, res)) return;
  setCorsHeaders(req, res);
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

      // For testing - return a mock manual payment response
      const mockPaymentResponse = {
        success: true,
        paymentUrl: null,
        paymentId: null,
        expiryDate: null,
        mode: 'manual',
        note: 'This is a test response for manual GCash payments.'
      };

  console.log('Test payment response:', mockPaymentResponse);
  setCorsHeaders(req, res);
  return res.json(mockPaymentResponse);

    } catch (error) {
      console.error('Test manual payment error:', error);
  setCorsHeaders(req, res);
  return res.status(500).json({ 
        error: 'Failed to create test manual payment',
        message: error.message 
      });
    }
  });
});

// Public GCash payment endpoint without authentication (manual)
exports.createGcashPaymentPublic = functions.https.onRequest({
  invoker: 'public'
}, (req, res) => {
  if (maybeHandlePreflight(req, res)) return;
  setCorsHeaders(req, res);
  return cors(req, res, async () => {
    try {
      console.log('=== PUBLIC GCASH PAYMENT START ===');
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

      // Validate amount
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Invalid payment amount' });
      }

      console.log(`Creating manual GCash payment: ${numAmount} PHP for order ${orderCode}`);

      // Update order with manual payment info
      const orderQuery = admin.firestore().collection('orders').where('orderCode', '==', orderCode);
      const orderSnapshot = await orderQuery.get();
      if (!orderSnapshot.empty) {
        const batch = admin.firestore().batch();
        orderSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            paymentLink: null,
            paymentId: null,
            paymentMethod: 'gcash_manual',
            paymentStatus: 'pending',
            paymentCreatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        await batch.commit();
      }

      const paymentResponse = {
        success: true,
        paymentUrl: null,
        paymentId: null,
        expiryDate: null,
        status: 'PENDING',
        mode: 'manual',
        message: 'Manual GCash payment initiated. No redirect required.'
      };

      console.log('Public manual payment response:', paymentResponse);
      setCorsHeaders(req, res);
      return res.json(paymentResponse);

    } catch (error) {
      console.error('Public manual GCash payment error:', error);
    setCorsHeaders(req, res);
    return res.status(500).json({ 
        error: 'Failed to create manual payment',
        message: error.message 
      });
    }
  });
});
