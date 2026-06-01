const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  user: {   //customers references sinong nag order
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{ //anong item ang kanyan inorder
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: String, //product name
    price: Number, //mag kano ang product
    quantity: Number  //ilan na inorder ng customer
  }],
  total: { type: Number, required: true }, //mag kano ang total value
  status: {   //status ng kanyan order defeault ay pending 
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },

  // ← add these payment fields
  paymentIntentId: { type: String, default: null },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },


  shippingAddress: {  //shipping kung saan i hahatid
    street: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true }
  }
}, { timestamps: true })

const Order = mongoose.model('Order', orderSchema)
module.exports = Order