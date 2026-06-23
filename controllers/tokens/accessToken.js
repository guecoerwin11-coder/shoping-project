const jwt = require('jsonwebtoken')

//eto yung function para sa pag generate ng token
const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' })
}

module.exports = generateAccessToken;