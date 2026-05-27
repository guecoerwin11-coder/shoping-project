const express = require('express')
const router = express.Router()
const protect = require('../middleware/protect')
const adminOnly = require('../middleware/adminMiddleware')
const validate = require('../middleware/validate')
const { placeOrderSchema } = require('../schema/orderSchema')
const {
  getOrders, getOrder,
  placeOrder, updateOrderStatus
} = require('../controllers/Orders')

router.get('/', protect, getOrders)
router.get('/:id', protect, getOrder)
router.post('/', protect, validate(placeOrderSchema), placeOrder)
router.put('/:id', protect, adminOnly, updateOrderStatus)

module.exports = router