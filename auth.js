require('dotenv').config()
const jwt = require("jsonwebtoken")

module.exports = async (request, response, next) => {
    try {
        const token = await request.headers.authorization.split(" ")[1]
        //console.log(token)
        const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET)
        //console.log(decodedToken)
        request.user = decodedToken
        next()
    } catch (error) {
        response.status(401).json({
            error: new Error("Request is invalid")
        })
    }
}
