const mongoose = require('mongoose')

const database = () => {
    try{
        mongoose.connect(process.env.MONGODB_URI, {
            tls: true,
            tlsAllowInvalidCertificates: true,
            serverSelectionTimeoutMS: 10000
        })
        console.log('mongo database is connected')
    }   
    catch(err){
        console.log('database error', err.message)
    }
}

module.exports = database