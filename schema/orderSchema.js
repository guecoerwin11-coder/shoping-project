const { z } = require('zod')

const placeOrderSchema = z.object({
  shippingAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    country: z.string().min(1, 'Country is required'),
    zipCode: z.string().min(1, 'Zip code is required')
  })
})

module.exports = { placeOrderSchema }