const Order = require('../models/orders')
const Cart = require('../models/carts')
const Product = require('../models/Products')
const User = require('../models/auth')
const { sendOrderConfirmation } = require('../services/emailServices')
const mongoose = require('mongoose')

//kunin ang mga orders
const getOrders = async (req, res) => {
  try { 

    const orders = await Order.find({ user: req.user.id })//user id na may order
      .sort({ createdAt: -1 })

    res.status(200).json(orders)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getOrder = async (req, res) => {
  try {
    //if walang product id na nasa order
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const order = await Order.findOne({
      _id: req.params.id, //hanapin ang product id
      user: req.user.id //user id
    })

    //if walang order na nakita
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    res.status(200).json(order)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const placeOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body //adress na ilagagay ng customer

    // kunin sa cart ang order
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product')

    //if ang cart ay walang laman mag re return 
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty!' })
    }

    // check stock for all items 
    for (const item of cart.items) { //loop to  na ang nasa cart ay may stocks paba 
      if (item.product.stock < item.quantity) { //if ang quantity ay mas mataas oa sa stock mag rereturn an wlaang stock para product nayun
        return res.status(400).json({
          message: `Not enough stock for ${item.product.name}!`
        })
      }
    }

    // build order items with product item, name, price,at quatity
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity
    }))

    // calculate total ng order using price * quantity
    const total = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity, 0
    )

    // create order 
    const order = await Order.create({
      user: req.user.id, //user id
      items: orderItems, //product item
      total, //total order
      shippingAddress, //address
      status: 'pending' //status
    })

    // reduce stock for each product
    for (const item of cart.items) { //babawas nag stock na nasa database
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }//$inc menaing ay nag dadag pero if may negative mag babawas ito
      )
    }

    // clear cart after order
    await Cart.findOneAndDelete({ user: req.user.id }) //deleet ang nasa order 

    // send confirmation email
    const user = await User.findById(req.user.id)
    await sendOrderConfirmation(user.email, user.name, order) //serd ng notification using gmail

    res.status(201).json({
      message: 'Order placed successfully! 🎉',
      data: order
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const updateOrderStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const { status } = req.body //status anong process ng na order

    const order = await Order.findByIdAndUpdate(
      req.params.id, //order id
      { status }, //if pending or shipped
      { new: true }
    )

    //order id if not existed
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // send status update email
    const user = await User.findById(order.user)
    await sendOrderStatusUpdate(user.email, user.name, status, order._id)

    res.status(200).json({ message: 'Order status updated!', data: order })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { getOrders, getOrder, placeOrder, updateOrderStatus }