const express = require('express')
const router = express.Router()
const { getAllProducts, getProduct, createProduct, updateProduct, delProduct} = require('../controllers/Products')
const { createProductSchema, updateProductSchema} = require('../schema/productSchema')
const adminOnly = require('../middleware/adminMiddleware')
const protect = require('../middleware/protect')
const cached = require('../middleware/cache')
const validate = require('../middleware/validate')
const upload = require('../middleware/upload')


router.get('/', cached('products'), getAllProducts)
router.get('/:id', getProduct)
router.post('/', protect, adminOnly, upload.single('image'), validate(createProductSchema), createProduct)
router.put('/:id', protect, adminOnly, upload.single('image'), validate(updateProductSchema), updateProduct)
router.delete('/:id', protect, adminOnly, delProduct)

module.exports = router