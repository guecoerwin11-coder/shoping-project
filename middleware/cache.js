const redis = require('./redis')

const cached = (key) => async (req, res, next) => {
    try{
        const isCache = await redis.get(key)

        if(isCache){
            console.log('redis hit')
            return res.status(200).json({
                fromCache: true,
                data: isCache
            })
        }

        console.log('getting to the database')
        next()
    }
    catch(err){
        res.status(500).json({message: err.message})
    }
}

module.exports = cached