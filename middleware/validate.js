const validate = (schema) => (req, res, next) => {
    const results = schema.safeParse(req.body)

    if(!results.success){
        return res.status(429).json({
            error: results.error.flatten().fieldErrors
       })
    }

    req.body = results.data
    next()
}

module.exports = validate