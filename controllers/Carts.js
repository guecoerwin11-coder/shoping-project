const Cart = require('../models/carts')
const Product = require('../models/products')

// helper to calculate total ng nasa cart ibat ibat product at quantity nito
const calculateTotal = (items) => { //total, item each item price at quantity mag add add at mag re return. 0 ang initial value
  return items.reduce((total, item) => {
    return total + (item.product.price * item.quantity)
  }, 0)
}

//kunin ang cart
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }) //hanapin nag cart gamit ang user id
      .populate('items.product') //para lumitaw din ang user reference or data

    if (!cart) { //if wala sa cart yung product
      return res.status(200).json({ items: [], total: 0 })
    } 

    res.status(200).json(cart)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}


//add sa cart ang prouct
const addToCart = async (req, res) => {
  try {
    
    const { productId, quantity = 1 } = req.body; //product id at kung ilang quantity

    const product = await Product.findById(productId) //hahanapin ang product id

    //if wala ang product id
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    //re return sya kapag mas mababa ang stock sa quantity meaning walang stock
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock!' })
    }

    //hahanapin nag user na nasa cart
    let cart = await Cart.findOne({ user: req.user.id })

    //if wala sa cart mag add ito 
    if (!cart) {
      // create new cart
      cart = await Cart.create({ //mag add ang product sa cart
        user: req.user.id, //user references
        items: [{ product: productId, quantity }] //product id, at kung ilan ang quantity
      })
    } else { //kapag ang product ay nasa cart na
      // check if product already in cart
      const itemIndex = cart.items.findIndex(
        item => item.product.toString() === productId //hahanapin ang product id na magiging string dahil toString()
      )

      //if yung product ay meron na mag a add lang ito na quantity which is quantity = 1 + 1
      if (itemIndex > -1) {
        // update quantity
        cart.items[itemIndex].quantity += quantity
      } else {
        // add new item product at quantiy
        cart.items.push({ product: productId, quantity })
      }
    }


    await cart.populate('items.product') //lalabas ang data 
    cart.total = calculateTotal(cart.items) //ang total value ng nasa cart 
    await cart.save() //save 

    res.status(200).json({ message: 'Added to cart!', data: cart })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

//update nag product ni customer
const updateCartItem = async (req, res) => {
  try {

    const { quantity } = req.body; //ang bilang ng product
    const { productId } = req.params //product id na gusto i update

    const cart = await Cart.findOne({ user: req.user.id }) //hanapin nag user id 
    
    //if ang cart ay wala pa
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    //product index 
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    )

    //if ang product ay hidni nag e exist
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' })
    }


    cart.items[itemIndex].quantity = quantity; //mag add ng quantity
    await cart.populate('items.product')
    cart.total = calculateTotal(cart.items) //mababgo ang total value ng nasa cart
    await cart.save()

    res.status(200).json({ message: 'Cart updated!', data: cart })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params; //product id 

    const cart = await Cart.findOne({ user: req.user.id })//hanapin ang user na nasa cart

    //if wala 
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    // i filterize if meron ba na sa product id
    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    )

    await cart.populate('items.product')
    cart.total = calculateTotal(cart.items)
    await cart.save()

    res.status(200).json({ message: 'Item removed!', data: cart })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user.id }) //hanapin ang customer cart at i delete lahat 
    res.status(200).json({ message: 'Cart cleared!' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart }