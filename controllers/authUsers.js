const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/auth')
const speakeasy = require('speakeasy') //ito yung gagamitin for 2FA
const qrcode = require('qrcode') //ito yung mag gegenerate ng QR code
const { recordFailedAttempts, clearAttempts } = require('../middleware/bruteHelper') //ito yung gagamitin for brute force
const { sendVerificationEmail, sendPasswordResetEmail, } = require('../services/emailServices'); //ito yung gagamitin for email
const crypto = require('crypto') //ito yung gagamitin for crypto

//eto yung function para sa pag generate ng token
const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' })
}

//ito yung para sa refresh token
const generateRefreshToken = (user) => {
    return jwt.sign({ id: user._id, name: user.name, role: user.role }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' })
}


const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const isExist = await User.findOne({ email })

        //if ang email is nagamit na ito ang re return nya
        if (isExist) {
            return res.status(400).json({ message: 'email is already exist' })
        }

        //generate sya ng 10 random characters
        const salt = await bcrypt.genSalt(10);
        //magiging hash or like random text ang password
        const hash = await bcrypt.hash(password, salt)


        const verificationToken = crypto.randomBytes(32).toString('hex')
        const hasshedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

        //mag sa save na sa database 
        const user = await User.create(
            {
                name,
                email,
                password: hash, role: role || 'customer',
                verificationToken: hasshedVerificationToken, //ito yung gagamitin sa pag verify ng email
                isVerified: false, //eto yung nilalagyan ng false or true kapag di pa verified yung email
                verificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) //ito yung nilalagyan ng expiration date na ginagamit for authentication
            }
        )

        const verficationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
        await sendVerificationEmail(user.email, user.name, verficationLink) //send a verification email to the user

        //bibigay ng token for authorization
        const token = jwt.sign(
            { id: user._id, name: user.name, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30m' }
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
    } catch (err) {
        res.status(500).json({ message: err.message })

    }
}

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params; //ito yung gagamitin sa pag verify ng email

        if (!token) {
            return res.status(400).json({ message: 'Token is required!' }) //kapag wala yung token to ang re return nya
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex') //eto yung gagamitin sa pag verify ng email

        //mag s scan na sa database kung meron na ba 
        const user = await User.findOne({
            verificationToken: hashedToken,
            verificationExpiry: { $gt: new Date() }
        }); //ito yung nilalagyan ng true or false na ginagamit for authentication

        //kapag ang token ay hindi mahanap at invalid to ang re return nya
        if (!user) {
            return res.status(401).json({ message: 'Token is invalid or expired!' })
        }

        user.isVerified = true; //ito yung nilalagyan ng true or false na ginagamit for authentication
        user.verificationToken = undefined; //ito yung nilalagyan ng random characters na ginagamit for authentication
        user.verificationExpiry = undefined; //ito yung nilalagyan ng expiration date na ginagamit for authentication
        await user.save(); //mag sa save na to sa database

        res.status(200).json({ message: 'Email verified successfully!' })

    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}


//ito yung para sa resend verification
const resendVerification = async (req, res) => {
    try {

        const { email } = req.body; //eto yung gagamitin sa pag send ng email

        const user = await User.findOne({ email }); //mag s scan na sa database kung meron na ba 

        if (!user) {
            return res.status(401).json({ message: 'User not found!' }) //kapag ang email ay hindi mahanap to ang re return nya
        }

        if (user.isVerified) { //kapag ang email ay verified na to ang re return nya
            return res.status(400).json({ message: 'User is already verified!' })
        }

        const verificationToken = crypto.randomBytes(32).toString('hex'); //eto yung gagamitin sa pag send ng email
        user.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex'); //ito yung gagamitin sa pag verify ng email
        user.verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); //ito yung nilalagyan ng expiration date na ginagamit for authentication
        await user.save(); //mag sa save na to sa database

        const verificationLink = `${process.env.FRONTEND_URL}/api/auth/verify-email?token=${verificationToken}`; //ito yung gagamitin sa pag send ng email
        await sendVerificationEmail(user.email, user.name, verificationLink); //eto yung gagamitin sa pag send ng email

        res.status(200).json({ message: 'Verification email sent successfully!' })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body; //eto yung gagamitin sa pag login
        const { emailKey, ipKey } = req.bruteForce //ito yung gagamitin sa pag login


        const user = await User.findOne({ email }) //mag s scan na sa database kung meron na ba 

        //kapag email na ginamit ay hindi register re return nya
        if (!user) {
            const attempts = await recordFailedAttempts(emailKey, ipKey); //ito yung gagamitin sa pag login
            return res.status(401).json({
                message: 'Invalid Credentials', //kapag maling email ang ginamit to ang re return nya
                attemptLeft: Math.max(0, 5 - attempts.emailAttempt) //eto yung limit na ginagamit sa pag login
            })
        }

        if (!user.isVerified) { //kapag ang email ay hindi pa verified to ang re return nya
            return res.status(401).json({ message: 'Please verify your email first!' })
        }

        //password macthing sa hashed password at input password
        const isMatch = await bcrypt.compare(password, user.password)

        //if hindi nag match to ang re return
        if (!isMatch) {
            const attempt = await recordFailedAttempts(emailKey, ipKey); //ito yung gagamitin sa pag login
            const attemptLeft = Math.max(0, 5 - attempt.emailAttempt); //kada maling attempt nababawas ang usage to login

            return res.status(401).json({
                message: 'Invalid Credentials',
                attemptLeft,
                warning: attemptLeft <= 2 ? `${attemptLeft} attempt before your account locked! ` : undefined
            })
        }

        //ito yung para sa 2FA
        if (user.twoFactorEnabled) {
            if (!twoFactorCode) { //kapag wala pang code to ang re return nya
                return res.status(200).json({
                    message: '2FA enabled',
                    twoFactorEnabled: true
                }) //ito yung nilalagyan ng true or false na ginagamit for authentication
            }

            const isValid = speakeasy.totp.verify({
                secret: user.twoFactorSecret, //ito yung nilalagyan ng secret key na ginagamit for authentication
                encoding: 'base32',
                token: twoFactorCode, //eto yung gagamitin sa pag login
                window: 1 //pwede pa mag error sa 1 minute
            })

            if (!isValid) {
                return res.status(401).json({ message: 'Invalid 2FA code!' }) //kapag mali ang 2FA code to ang re return nya
            }

        }

        //kapag successfull ang login ma erase lahat at back to 0 ang login attempt
        await clearAttempts(emailKey, ipKey); //eto yung gagamitin sa pag login

        //token
        const token = jwt.sign(
            { id: user._id, name: user.name, role: user.role },
            process.env.JWT_SECRET, //ito yung ginagamit sa pag sign in sa JWT
            { expiresIn: '30m' } //eto yung ginagamit sa pag sign in sa JWT
        )

        res.status(200).json({
            message: 'Login Successfully',
            token
        })
    }
    catch (err) {
        res.status(500).json({ message: err.message, data: 'error' })

    }
}

const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) { //kapag ang refreshToken ay hindi valid to ang re return nya
            return res.status(401).json({ message: 'Refresh token is required!' })
        }
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decoded.id) //ito yung gagamitin sa pag refresh ng token

        if (!user || !user.refreshToken.includes(refreshToken)) {
            return res.status(401).json({ message: 'Invalid refresh token!' })
        } //kapag ang user ay hindi valid to ang re return nya


        const newAccessToken = generateAccessToken(user)

        res.status(200).json({
            messagea: 'success',
            accessToken: newAccessToken
        }) //ito yung gagamitin sa pag refresh ng token
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const logout = async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken;

        if (refreshToken) {
            await User.findByIdAndUpdate(req.user.id
                , { $pull: { refreshToken: refreshToken } } //kapag ang refreshToken ay hindi valid to ang re return nya
            )
        }
        res.status(200).json({ message: 'Logout successfully' })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body; //email na gagamitin for reset password if naka register ito

        if (!email) {
            return res.status(400).json({ message: 'email is required' })
        } //kapag walang email na nilagay

        const user = await User.findOne({ email }); //hanapin sa database

        if (!user) { //if ang email ay hindi naman naka register sa system
            return res.status(200).json({
                message: 'if that email is exist you will receive the reset password if not email is not registered'
            })
        }

        const resetToken = crypto.randomBytes(32).toString('hex') //generate a password reset token

        user.resetPasswordToken = crypto //ito yung nilalagay sa database para sa authentication
            .createHash('sha256') //para ma secure yung password reset token 
            .update(resetToken)
            .digest('hex');

        user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000) //ito yung nilalagay sa database para sa expiration date ng password reset token
        await user.save() //save 

        // create reset link
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}` //generate a reset link

        await sendPasswordResetEmail(user.email, user.name, resetLink) //send a password reset email to the user

        res.status(200).json({ message: 'Password reset email sent' }) //send a success message to the user
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const resetPassword = async (req, res) => {
    try {

        const { token, newPassword } = req.body; //yung token at password na gagamitin for reset password

        if (!token || !newPassword) { //kapag walang token o password na nilagay
            return res.status(401).json({ message: 'token and password is required' })
        }

        if (newPassword.length < 6) { //kapag yung password ay less than 6 characters
            return res.status(400).json({ message: 'password must be at least 6 characters' })
        }

        const hashToken = crypto //generate a password reset token
            .createHash('sha256') //para ma secure yung password reset token 
            .update(token) //ito yung nilalagay sa database para sa authentication
            .digest('hex'); //ito yung nilalagay sa database para sa authentication

        const user = await User.findOne({
            resetPasswordToken: hashToken,
            resetPasswordExpiry: { $gt: Date.now() } //not expired
        });

        if (!user) { //kapag yung token ay expired
            return res.status(401).json({ message: 'Invalid or expired token' })
        }

        const salt = await bcrypt.genSalt(10); //generate a salt
        user.password = await bcrypt.hash(newPassword, salt); //hash the new password

        user.resetPasswordToken = null; //clear the reset password token
        user.resetPasswordExpiry = null; //clear the reset password expiration date

        user.refreshToken = [];
        await user.save();

        res.status(200).json({ message: 'Password reset successfully' }) //send a success message to the user
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

//2fa setup 
const setup2FA = async (req, res) => {
    try {
        const user = await User.findById(req.user.id); //ito yung gagamitin para ma verify kung valid user 

        const secret = speakeasy.generateSecret({
            name: `Ecommerce/${user.email}` //ito yung gagamitin para ma verify kung valid user 
        })

        user.twoFactorSecret = secret.base32; //malalagay ito sa twoFactorSecret na ginamit sa pag login
        await user.save(); //mag save ito sa database 

        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url); //gagawa ng QR code para sa 2FA setup rekta sa url

        res.status(200).json({
            message: '2FA setup successfully',
            secret: secret.base32,
            qrCodeUrl
        })
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const enable2FA = async (req, res) => {
    try {
        const { code } = req.body;

        const user = await User.findById(req.user.id);

        if (!user.twoFactorSecret) {
            return res.status(400).json({ message: '2FA is not set up' })
        }

        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code,
            window: 1
        })

        if (!isValid) {
            return res.status(400).json({ message: 'Invalid 2FA code' })
        }

        user.twoFactorEnabled = true;
        await user.save();

        res.status(200).json({ message: '2FA enabled successfully' })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const disable2FA = async (req, res) => {
    try {
        const { code } = req.body;

        const user = await User.findById(req.user.id);

        if (!user.twoFactorEnabled) {
            return res.status(400).json({ message: '2FA is not enabled' })
        }

        // verify code is correct
        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code,
            window: 1 //ang window po dito ay para sa 1 code 
        })

        //kapag mali yung code na nilagay
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid 2FA code' })
        }

        user.twoFactorEnabled = false; //para ma enable ang 2FA 
        user.twoFactorSecret = null; //para ma disable ang 2FA kapag na disabled 
        await user.save(); //mag save ito sa database 

        res.status(200).json({ message: '2FA disabled successfully' })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}



//export sila para magamit at ma import sa ibang file
module.exports = {
    register,
    verifyEmail,
    resendVerification,
    login,
    refreshToken,
    logout,
    forgotPassword,
    resetPassword,
    setup2FA,
    enable2FA,
    disable2FA
}