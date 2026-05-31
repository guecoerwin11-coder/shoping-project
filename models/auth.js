const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, trim: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' }, //who's user if yung user di sya nag lagay ng role dito automatic na default sya na customer
    address: {
        street: String,
        city: String,
        country: String,
        zipCode: String
    },

    //password reset
    resetPasswordToken: { type: String, default: null }, //ito yung nilalagyan ng random characters na ginagamit for authentication
    resetPasswordExpiry: { type: Date, default: null }, //ito yung nilalagyan ng expiration date na ginagamit for authentication

    //email verification
    isVerified: { type: Boolean, dafault: null },
    verificationtoken: { type: String, default: null },
    verificationExpiry: { type: String, default: null },

    //token refresh
    refreshToken: [{ type: String }],

    //2FA
    twoFactorSecret: { type: String, default: null }, //ito yung nilalagyan ng secret key na ginagamit for authentication
    twoFactorEnabled: { type: Boolean, default: false }, //ito yung nilalagyan ng true o false na ginagamit for authentication


}, { timestamps: true })

const User = mongoose.model('User', userSchema)

module.exports = User;