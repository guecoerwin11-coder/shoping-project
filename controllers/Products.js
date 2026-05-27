const Products = require('../models/products')
const mongoose = require('mongoose')
const redis = require('../middleware/redis')
//import ang product model 


const getAllProducts = async (req, res) => {
    try{
        const page = req.query.page || 1; //page show sa product
        const limit = req.query.limit || 10; //limit ang ishow na product
        const skip = (page - 1) * limit //kung ilan ang lalabas sa bawat page
        const search = req.query.search || '' //seach mag hahanap ng product 
        const category = req.query.category || '' //hanapin ang category like electronics

        const filter = {} //dito mag store ang mga sine search or tina type sa search bar
        if(search) filter.name = {$regex: search, $options: 'i'} //kapag na trigger ang search to papasok sa filter variable using $regex ilalabas nya ang data kahit lower or nala upper case ito basta match sa hinahanap. $options: "i" meaning ay insentitive di maselan
        if(category) filter.category = category //same din sa filter but category lang ang hinahanap

        const [products, total ] = await Promise.all([ //ang promise.all ayy isahan function naka paloob sa destructuring kapag ang isa sa loob nito ay nag reject hindi to mag execute
            Products.find(filter).skip(skip).limit(limit).sort({ createdAt: -1}), //first fuction
            Products.countDocuments(filter) //second function
        ])

        //save to redis cache for 60 seconds 
        await redis.set('products', JSON.stringify({ products, total}), {ex: 60})

        //results of the products
        res.status(200).json({
            fromCache: false,
            data: products,
            pagination: {
                page, limit, total, totalPage: Math.ceil(total / limit)
            }
        })

    }catch(err){
        res.status(500).json({message: err.message})
    }
}

//hinahanap ang specific id or isang item
const getProduct = async (req, res) => {
    try{
        //if wala ang product id na hinahanap ito ang re return
        if(!mongoose.Types.ObjectId.isValid(req.params.id)){
            return res.status(404).json({message: 'Products not found'})
        }

        const product = await Products.findById(req.params.id)
        
        //same din sa taas
        if(!product){
            return res.status(404).json({message: 'Product not found'})
        }

        res.status(200).json(product)
    }catch(err){
        res.status(500).json({message: err.message})
    }
}

//add ng product admin only
const createProduct = async (req, res) => {
    try{
        //ilalagay ang image or pwedeng wala
        const image = req.file ? `http://localhost:3000/uploads/products/${req.file.filename}`: null;


        //save sa database
        const product = await Products.create({
            ...req.body, //spread operator
            image, //image upload
            createdBy: req.user.id //admin references
        })

        //delete ang mga na save sa redis cache
        await redis.del('products')

        res.status(201).json({ message: 'Products added!', data: product})
    }
    catch(err){
        res.status(500).json({message: err.message})
    }
}


//update ang product
const updateProduct = async (req, res) => {
    try{

        //if may product na wala 
        if(!mongoose.Types.ObjectId.isValid){
            return res.status(404).json({message: "Products not Found"})
        }
        
        //re uplaod pa pa maupdate ang product
        const image = req.file ?  `http://localhost:3000/uploads/products/${req.file.filename}`: undefined



        const product = await Product.findByIdAndUpdate(
            req.params.id, //product id na i up update
            updateData, //data ng product
            {new: true, runValidators: true} //if is tama lahat
        )

        //ang product ay wala 
        if(!product){
            return res.status(404).json({message: 'Products not found'})
        }


        await redis.del('products')

        res.status(200).json({ message: 'Product updated!', data: product })
    }
    catch(err){
        res.status(500).json({message: err.message})
    }
}

//delete ang product
const delProduct = async (req, res) => {
    try{
        if(!mongoose.Types.ObjectId.isValid){
            return res.status(404).json({message: "Products not Found"})
        }

        const product = await Product.findByIdAndDelete(req.params.id) //hanapin nag id product at i delete

        //if wala ang product id na gusto i delete
        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }

        await redis.del('products')

        res.status(200).json({message: 'Product Deleted'})
    }
    catch(err){
        res.status(500).json({message: err.message})
    }
}

module.exports = {
    getAllProducts, getProduct, createProduct, updateProduct, delProduct
}