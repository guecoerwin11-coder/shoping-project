const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/auth')


const register = async (req, res) => {
    try{
        const{ name, email, password, role } = req.body;

        const isExist = await User.findOne({email}) 

        //if ang email is nagamit na ito ang re return nya
        if(isExist){
            return res.status(400).json({message: 'email is already exist'})
        }

        //generate sya ng 10 random characters
        const salt = await bcrypt.genSalt(10);
        //magiging hash or like random text ang password
        const hash = await bcrypt.hash(password, salt)


        //mag sa save na sa database 
        const user = await User.create(
            {
                name, email, password: hash, role: role || 'customer'
            }
        )

        //bibigay ng token for authorization
        const token = jwt.sign(
            {id: user._id, name: user.name, role: user.role},
            process.env.JWT_SECRET,
            {expiresIn: '30m'}
        )

        //ang return kapag success ang iyong register
        res.status(201).json({
            message: 'Register Successfullt',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })
    }catch(err){
        res.status(500).json({message: err.message})

    }
}

const login = async (req, res) => {
    try{
        const {email, password} = req.body


        const user = await User.findOne({email})

        //kapag email na ginamit ay hindi register re return nya
        if(!user) {
            return res.status(404).json({message: 'email is not registered'})
        }

        //password macthing sa hashed password at input password
        const isMatch = await bcrypt.compare(password, user.password)

        //if hindi nag match to ang re return
        if(!isMatch){
            return res.status(401).json({message: 'invalid password credentials'})
        }

        //token
        const token = jwt.sign(
            {id: user._id, name: user.name, role: user.role},
            process.env.JWT_SECRET,
            {expiresIn: '30m'}
        )

        res.status(200).json({
            message: 'Login Successfully',
            token
        })
    }
    catch(err){
        res.status(500).json({message: err.message})

    }
}

//export sila para magamit at ma import
module.exports = {
    register, login
}