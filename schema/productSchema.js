    const { z } = require('zod')

const createProductSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0, 'Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  stock: z.number().min(0, 'Stock must be positive').optional()
})

const updateProductSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  price: z.number().min(0).optional(),
  category: z.string().optional(),
  stock: z.number().min(0).optional()
})

module.exports = { createProductSchema, updateProductSchema }