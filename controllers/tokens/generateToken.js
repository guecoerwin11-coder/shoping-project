const jwt = require('jsonwebtoken')

//ito yung para sa refresh token
const generateRefreshToken = (user) => {
    return jwt.sign({ id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

module.exports = generateRefreshToken