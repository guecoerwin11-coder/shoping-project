const express = require('express')
const router = express.Router()
const protect = require('../middleware/protect')
const {
    createPaymentIntent,
    handleWebhook,
    getPaymentStatus
} = require('../controllers/paymentController')

// create payment intent
router.post('/create-intent', protect, createPaymentIntent)

// get payment status
router.get('/status/:paymentIntentId', protect, getPaymentStatus)

// webhook - must use raw body!
router.post(
    '/webhook',
    express.raw({ type: 'application/json' }), // ← raw body for Stripe!
    handleWebhook
)

module.exports = router