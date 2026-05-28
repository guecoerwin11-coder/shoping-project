const express = require('express')
const router = express.Router()
const validate = require('../middleware/validate')
const { register, login} = require('../controllers/authUsers')
const {registerSchema, loginSchema} = require('../schema/authSchema')
const bruteforce = require('../middleware/bruteforce')

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema),bruteforce, login)


module.exports = router
