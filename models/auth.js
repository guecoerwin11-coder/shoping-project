const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {type: String, required: true, trim: true},
    email: {type: String, required: true, unique: true, lowercase: true},
    password: {type: String, required: true,trim: true},
    role: {type: String, enum: ['customer', 'admin'], default: 'customer'}, //who's user if yung user di sya nag lagay ng role dito automatic na default sya na customer
    address:{
        street: String,
        city: String,
        country: String,
        zipCode: String
    }
}, {timestamps: true})

const User = mongoose.model('User', userSchema)

module.exports = User;