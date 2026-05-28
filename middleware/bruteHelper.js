const redis = require('./redis')


//this will function when the login attempt fails
const recordFailedAttempts = async (emailKey, ipKey) => {
    try{
        //increement email attempts
        const emailCount = await redis.get(emailKey);

        if(!emailCount){
            await redis.set(emailKey,1, {ex: 15 * 60}) //15 to locked when it reach the limit
        }
        else{
            await redis.incr(emailKey) //increement the emailKey to emailCount
        }

        //increement ip attempts
        const ipCount = await redis.get(ipKey);

        if(!ipCount){
            await redis.set(ipKey,1, {ex: 15 * 60}) //15 minutes locked
        }else{
            await redis.incr(ipKey) //increement the ipKey
        }


        //update the count
        const newEmailCount = await redis.get(emailKey);
        const newIpCount = await redis.get(ipKey);

        console.log(`❌ Failed login - Email attempts: ${newEmailCount}/5, IP attempts: ${newIpCount}/10`)

        return {
            emailAttempts: parseInt(newEmailCount),
            ipAttempts: parseInt(newIpCount)
        }
    }catch(err){
        res.status(500).json({message: err.message})
    }
}

//if the login attemps is successfull
const clearAttempts = async (emailKey, ipKey) => {
    try{
        
        await redis.del(emailKey);
        await redis.del(ipKey);
        console.log('Login successfull')
    }
    catch(err){
        res.status(500).json({message: err.message})
    }
}

module.exports = {
    recordFailedAttempts, clearAttempts
}