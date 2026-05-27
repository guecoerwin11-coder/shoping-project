const mongoose = require('mongoose')

//nasa cart
const cartSchema = new mongoose.Schema({
  user: { //customer references 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{ //anong product ang nasa add to cart nya
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: { type: Number, required: true, min: 1, default: 1 } //ilan ang product na kinuha default ito sa 1 dahil kapag 0 ay walang laman ang cart
  }],
  total: { type: Number, default: 0 } //total value nung nasa cart
}, { timestamps: true })

 
const Carts = mongoose.model('Cart', cartSchema)
module.exports = Carts