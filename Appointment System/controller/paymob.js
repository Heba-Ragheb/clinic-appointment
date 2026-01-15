// Update your paymob.js controller with this complete code:

import axios from 'axios';
import crypto from 'crypto';
//import Order from '../models/order.js';

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;
const BASE_URL = process.env.PAYMOB_BASE_URL;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Step 1: Authenticate with Paymob
const authenticatePaymob = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/tokens`, {
      api_key: PAYMOB_API_KEY
    });
    return response.data.token;
  } catch (error) {
    console.error('Paymob authentication failed:', error.response?.data);
    throw new Error('Payment authentication failed');
  }
};

// Step 2: Register Order
const registerOrder = async (authToken, orderData) => {
  try {
    const response = await axios.post(`${BASE_URL}/ecommerce/orders`, {
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: orderData.amount * 100,
      currency: "EGP",
      merchant_order_id: orderData.orderId,
      items: orderData.items.map(item => ({
        name: item.name,
        amount_cents: item.price * 100,
        description: item.description || item.name,
        quantity: item.quantity
      }))
    });
    return response.data;
  } catch (error) {
    console.error('Order registration failed:', error.response?.data);
    throw new Error('Order registration failed');
  }
};

// Step 3: Get Payment Key
const getPaymentKey = async (authToken, orderData, paymobOrderId) => {
  try {
    const response = await axios.post(`${BASE_URL}/acceptance/payment_keys`, {
      auth_token: authToken,
      amount_cents: orderData.amount * 100,
      expiration: 3600,
      order_id: paymobOrderId,
      billing_data: {
        apartment: "NA",
        email: orderData.customer.email,
        floor: "NA",
        first_name: orderData.customer.firstName,
        street: "NA",
        building: "NA",
        phone_number: orderData.customer.phone,
        shipping_method: "NA",
        postal_code: "NA",
        city: "NA",
        country: "NA",
        last_name: orderData.customer.lastName,
        state: "NA"
      },
      currency: "EGP",
      integration_id: PAYMOB_INTEGRATION_ID
    });
    return response.data.token;
  } catch (error) {
    console.error('Payment key generation failed:', error.response?.data);
    throw new Error('Payment key generation failed');
  }
};

// Main function: Create Payment
export const createPayment = async (req, res) => {
  try {
    const { amount, orderId, items, customer } = req.body;

    if (!amount || !orderId || !items || !customer) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const authToken = await authenticatePaymob();
    const order = await registerOrder(authToken, { amount, orderId, items });
    const paymentKey = await getPaymentKey(authToken, { amount, customer }, order.id);

    // Build iframe URL with callback
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const iframeUrl = `${BASE_URL}/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

    res.json({
      success: true,
      iframeUrl,
      paymentToken: paymentKey,
      paymobOrderId: order.id,
      // Include callback URL for reference
      callbackUrl: `${backendUrl}/api/payment/callback`
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment initialization failed'
    });
  }
};

// Verify HMAC signature
const verifyHMAC = (data, receivedHmac) => {
  try {
    const concatenatedString = `${data.amount_cents}${data.created_at}${data.currency}${data.error_occured}${data.has_parent_transaction}${data.id}${data.integration_id}${data.is_3d_secure}${data.is_auth}${data.is_capture}${data.is_refunded}${data.is_standalone_payment}${data.is_voided}${data.order.id}${data.owner}${data.pending}${data.source_data.pan}${data.source_data.sub_type}${data.source_data.type}${data.success}`;
    
    const calculatedHmac = crypto
      .createHmac('sha512', PAYMOB_HMAC_SECRET)
      .update(concatenatedString)
      .digest('hex');
    
    return calculatedHmac === receivedHmac;
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
};

// Handle Payment Callback (Server-to-Server Webhook)
export const handleCallback = async (req, res) => {
  try {
    console.log('📥 Paymob callback received');
    
    const receivedHmac = req.query.hmac;
    const callbackData = req.body.obj || req.body;

    console.log('Callback data:', JSON.stringify(callbackData, null, 2));

    // Verify HMAC if provided
    if (receivedHmac && !verifyHMAC(callbackData, receivedHmac)) {
      console.error('❌ HMAC verification failed');
      return res.status(403).send('Invalid signature');
    }

    const {
      success,
      id: transactionId,
      order,
      amount_cents,
      pending
    } = callbackData;

    const merchantOrderId = order?.merchant_order_id || order?.id;

    console.log(`Payment Status: ${success ? '✅ Success' : '❌ Failed'}`);
    console.log(`Transaction ID: ${transactionId}`);
    console.log(`Merchant Order ID: ${merchantOrderId}`);
    console.log(`Amount: ${amount_cents / 100} EGP`);
    console.log(`Pending: ${pending}`);

    // Don't process if payment is still pending
    if (pending) {
      console.log('⏳ Payment is pending, waiting for final status');
      return res.status(200).send('Pending');
    }

    if (success) {
      console.log(`✅ Payment successful - Order: ${merchantOrderId}`);
      
      // Note: We don't update Order here because it doesn't exist yet
      // Order will be created by frontend after redirect
      
    } else {
      console.log(`❌ Payment failed - Order: ${merchantOrderId}`);
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('Callback handling error:', error);
    res.status(500).send('Error processing callback');
  }
};

// Handle Success Redirect (Browser Redirect)
export const handleSuccess = async (req, res) => {
  try {
    console.log('🔄 Redirect received from Paymob');
    console.log('Query params:', req.query);
    
    const success = req.query.success === 'true';
    const transactionId = req.query.id;
    
    if (success) {
      console.log(`✅ Redirecting to frontend with success - Transaction: ${transactionId}`);
      // Redirect to checkout page with success parameter
      res.redirect(`${FRONTEND_URL}/checkout?success=true&transaction=${transactionId}`);
    } else {
      console.log('❌ Redirecting to cart - Payment failed');
      res.redirect(`${FRONTEND_URL}/cart?payment=failed`);
    }
  } catch (error) {
    console.error('Success redirect error:', error);
    res.redirect(`${FRONTEND_URL}/cart?payment=error`);
  }
};