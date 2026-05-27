const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    name: {type: String, required: true, trim: true},
    description: {type: String, required: true },
    price: {type: String, required: true, min: 0},
    category: {type: String, required: true},
    stock:{type: Number, required: true, min: 0, default: 0},
    image: {type: String, default: null},
    createdBy: { //users references its either admin or customer
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {timestamps: true})

const Product =
  mongoose.models.Product ||
  mongoose.model('Product', productSchema)

module.exports = Product