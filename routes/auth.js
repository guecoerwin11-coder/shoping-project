const express = require('express')
const router = express.Router()
const validate = require('../middleware/validate')
const {
    register,
    resendVerification,
    login,
    refreshToken,
    forgotPassword,
    resetPassword,
    verifyEmail,
    logout,
    setup2FA,
    enable2FA,
    disable2FA } = require('../controllers/authUsers')
const { registerSchema, loginSchema } = require('../schema/authSchema')
const bruteforce = require('../middleware/bruteforce')
const protect = require('../middleware/protect')

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), bruteforce, login)
router.post('/logout', protect, logout)


router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

router.post('/setup-2fa', protect, setup2FA)
router.post('/enable-2fa', protect, enable2FA)
router.post('/disable-2fa', protect, disable2FA)

router.post('/refresh-token', refreshToken)

router.post('/verify-email', verifyEmail)
router.post('/resend-verification', resendVerification)

module.exports = router
