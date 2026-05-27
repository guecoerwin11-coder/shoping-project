const express = require('express')
const router = express.Router()
const protect = require('../middleware/protect')
const {getCart, addToCart, updateCartItem, removeFromCart, clearCart} = require('../controllers/Carts')

router.get('/', protect, getCart)
router.post('/', protect, addToCart)
router.put('/:productId', protect, updateCartItem)
router.delete('/:productId', protect, removeFromCart)
router.delete('/', protect, clearCart)

module.exports = router