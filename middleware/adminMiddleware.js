const User = require('../models/auth')//import users model

const adminOnly = async (req, res, next) => {
    try{
        const user = await User.findById(req.user.id) //find the user id

        //if the user id and role is not a admin it block 
        if(!user || user.role !== 'admin'){
            return res.status(403).json({ message: 'Admin access only!' })
        }

        //next controller
        next()
    }
    catch(err){
        res.status(500).json({message: err.message})
    }
}

module.exports = adminOnly