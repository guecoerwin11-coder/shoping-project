const nodemailer = require('nodemailer')

const transport = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOrderConfirmation = async (toEmail, name, order) => {
    try{
        const itemList = order.items
            .map(item => `<li>${item.name} x ${item.quantity} - $${item.price} </li>`)
            .join('')

        const senderMail = {
            from: process.env.EMAIL_USER,
            subject: 'Customers Orders',
            html: `
            <h1>Thank you for your order, ${name}! 🎉</h1>
            <h2>Order Details:</h2>
            <ul>${itemsList}</ul>
            <h3>Total: $${order.total}</h3>
            <p>Status: ${order.status}</p>
            <p>We'll update you when your order ships!</p>`
        }


        await transport.sendMail(senderMail)
    }catch(err){
        res.status(500).json({message: err.message})
    }
}

const sendOrderStatus = async (toEmail, name, status, orderId) =>{
    try{
        const sendStatus = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: `📦 Order Update — ${status}`,
            html: `
                <h1>Hi ${name}!</h1>
                <p>Your order <strong>#${orderId}</strong> status has been updated to: <strong>${status}</strong></p>`
        }

        await transport.sendMail(sendStatus)
    }
    catch(err){
        res.status(500).json({message: err.message})
    }
}

module.exports = {
    sendOrderConfirmation,
    sendOrderStatus
}