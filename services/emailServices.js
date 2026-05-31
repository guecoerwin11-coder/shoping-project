const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

// welcome email
const sendWelcomeEmail = async (toEmail, name) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: '🎉 Welcome to our store!',
        html: `
      <h1>Welcome ${name}! 🎉</h1>
      <p>Your account has been created successfully.</p>
    `
    })
}

// email verification
const sendVerificationEmail = async (toEmail, name, verificationLink) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: '✅ Verify your email',
        html: `
      <h1>Hi ${name}!</h1>
      <p>Please verify your email address:</p>
      <a href="${verificationLink}" style="
        background: #4CAF50;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        display: inline-block;
        margin: 20px 0;
      ">Verify Email</a>
      <p>This link expires in <strong>24 hours</strong>.</p>
    `
    })
}

// password reset
const sendPasswordResetEmail = async (toEmail, name, resetLink) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: '🔐 Password Reset Request',
        html: `
      <h1>Hi ${name}!</h1>
      <p>You requested a password reset.</p>
      <a href="${resetLink}" style="
        background: #f44336;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        display: inline-block;
        margin: 20px 0;
      ">Reset Password</a>
      <p>This link expires in <strong>15 minutes</strong>.</p>
      <p>If you didn't request this, ignore this email.</p>
    `
    })
}

// order confirmation
const sendOrderConfirmation = async (toEmail, name, order) => {
    const itemsList = order.items
        .map(item => `<li>${item.name} x${item.quantity} - $${item.price}</li>`)
        .join('')

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: '🛍️ Order Confirmation!',
        html: `
      <h1>Thank you for your order, ${name}! 🎉</h1>
      <ul>${itemsList}</ul>
      <h3>Total: $${order.total}</h3>
      <p>Status: ${order.status}</p>
    `
    })
}

// order status update
const sendOrderStatusUpdate = async (toEmail, name, status, orderId) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: `📦 Order Update — ${status}`,
        html: `
      <h1>Hi ${name}!</h1>
      <p>Your order <strong>#${orderId}</strong> 
      status: <strong>${status}</strong></p>
    `
    })
}

module.exports = {
    sendWelcomeEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendOrderConfirmation,
    sendOrderStatusUpdate
}