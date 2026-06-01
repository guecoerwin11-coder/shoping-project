const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Order = require('../models/order')
const User = require('../models/auth')
const Cart = require('../models/cart')
const Product = require('../models/products')

const createPaymentIntent = async (req, res) => {
    try {
        const { shippingAddress } = req.body;

        const cart = await Cart.findOne({ user: req.user.id })
            .populate('items.product')

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' })
        }

        for (const item of cart.item) {
            if (item.stock < item.quantity) {
                return res.status(400).json({ message: `Not enough stock for product: ${item.product.name}` })
            }
        }

        const total = cart.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity)
        }, 0)

        const totalCents = Math.round(total * 100)

        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalCents,
            currency: "usd",
            metadata: {
                userId: req.user.id.toString(),
                shippingAddress: JSON.stringify(shippingAddress)
            }
        })

        res.status(200).json({
            message: 'payment successfull',
            clientSecret: paymentIntent.client_secret,
            amount: total,
            currency: 'usd'
        })
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const handleWebhook = async (req, res) => {
    const signature = req.headers['stripe-signature']
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (err) {
        res.status(500).json({ message: err.message })
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object

        try {
            const userId = paymentIntent.metadata.userId
            const shippingAddress = JSON.parse(paymentIntent.metadata.shippingAddress)

            // get cart
            const cart = await Cart.findOne({ user: userId })
                .populate('items.product')

            if (!cart || cart.items.length === 0) {
                return res.status(200).json({ received: true })
            }

            // build order items
            const orderItems = cart.items.map(item => ({
                product: item.product._id,
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity
            }))

            // calculate total
            const total = orderItems.reduce(
                (sum, item) => sum + item.price * item.quantity, 0
            )

            // create order
            const order = await Order.create({
                user: userId,
                items: orderItems,
                total,
                shippingAddress,
                status: 'processing', // ← already paid!
                paymentIntentId: paymentIntent.id,
                paymentStatus: 'paid'
            })

            // reduce stock
            for (const item of cart.items) {
                await Product.findByIdAndUpdate(
                    item.product._id,
                    { $inc: { stock: -item.quantity } }
                )
            }

            // clear cart
            await Cart.findOneAndDelete({ user: userId })

            // send confirmation email
            const user = await User.findById(userId)
            await sendOrderConfirmation(user.email, user.name, order)

            console.log(`✅ Order created for user ${userId}`)
        } catch (err) {
            console.log('Order creation error:', err.message)
        }
    }

    // handle payment failure
    if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object
        console.log(`❌ Payment failed for user ${paymentIntent.metadata.userId}`)
    }

    res.status(200).json({ received: true })
}

// GET PAYMENT STATUS
const getPaymentStatus = async (req, res) => {
    try {
        const { paymentIntentId } = req.params

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

        res.status(200).json({
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

module.exports = { createPaymentIntent, handleWebhook, getPaymentStatus }