require('dotenv').config()
const express = require('express')
const app = express()
const database = require('./configs/database')
const cors = require('cors')
const path = require('path')
const rateLimit = require('./middleware/rateLimiter')
const auth = require('./routes/auth')
const products = require('./routes/products')
const orders = require('./routes/orders')
const carts = require('./routes/carts')

database()
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use(rateLimit(5, 60))

app.use('/auth', auth)
app.use('/carts', carts)
app.use('/orders', orders)
app.use('/products', products)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})
