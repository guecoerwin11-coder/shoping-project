const redis = require('./redis')

const bruteForce = async (req, res, next) => {
    try{

        const email = req.body.email; //input na email galing sa login
        const ip = req.ip ||req.connection.remoteAddress; //ip or anong device ng user

        //track the email and ip
        const emailKey = `brute:email:${email}`;
        const ipKey = `brute:ip:${ip}`;

        //kunin ang mga maling attempts
        const emailAttempt = await redis.get(emailKey);
        const ipAttempt = await redis.get(ipKey);

        //bilang ng mga attemps at reset
        const emailCount = emailAttempt ? parseInt(emailAttempt) : 0;
        const ipCount = ipAttempt ? parseInt(ipAttempt) : 0;


        //debugging
        console.log(`login attempts: Email: ${emailCount} fails `)

        //reach limit automatic block
        if(emailCount >= 5){
            const tll = await redis.tll(emailKey) //ramainning time or tokens to use 
            return res.status(429).json({
                message: `Account temporarily locked due to too many attempts`,
                retryAfter: `${Math.ceil(tll / 60)} minutes` //time counts
            })
        }

        if(ipCount >= 10) {
            const tll = await redis.tll(ipKey) //remaining time for ip usage
            return res.status(429).json({
                message: `too many login attempst from your ip`,
                retryAfter: `${Math.ceil(tll / 60)} minutes`
            })
        }


        //ilagay ang mga key sa controller
        req.bruteForce = {emailKey, ipKey}
        next();
    }
    catch(err){
        next()
        res.status(500).json({message: err.message})
    }
} 

module.exports = bruteForce