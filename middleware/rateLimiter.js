const redis = require('./redis')

const rateLimit = (maxRequest = 100, perSecond = 60 ) => async (req, res, next) => {
    try{
        const ip = req.ip || req.connection.remoteAddress;
        const key = `rate limit:${ip}`;
        const request = await redis.get(key)
        const counts = request ? parseInt(request) : 0;

        if (counts >= maxRequest){
            return res.status(429).json({message: `too many request, try again`})
        }

        if(  counts === 0) {
            await redis.set(key, 1 , {ex: perSecond})
        }else{
            await redis.incr(key)
        }

        res.setHeader(`X-rate-limit-Count`, maxRequest)
        res.setHeader(`X-rate-Limit-Remaining`, maxRequest - counts - 1)

        next()

    }
    catch(err){
        res.status(500).json({message: err.message})
        next()
    }
}

module.exports = rateLimit