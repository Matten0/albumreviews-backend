require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = express()

app.use(express.json())
app.use(cors())

const User = require("./models/user")
const auth = require("./auth")


app.post("/register", (request, response) => {
    const user = request.body

    bcrypt.hash(user.password, 10)
        .then((hashedPassword) => {
            const newUser = new User({
                name: user.name,
                password: hashedPassword
            })

            newUser.save()
                .then((savedUser) => {
                    response.json(savedUser)
                })
                .catch((error) => {
                    response.status(500).send({
                        message: "User creation failed",
                        error
                    })
                })
        })
        .catch((error) => {
            response.status(500).send({
                message: "Password hashing failed",
                error
            })
        })
})

app.post("/login", (request, response) => {
    const user = request.body
    User.findOne({name: user.name})
        .then((foundUser) => {
            bcrypt.compare(user.password, foundUser.password)
                .then((passwordCompare) => {

                    if (!passwordCompare) {
                        return response.status(400).send({
                            message: "Wrong password",
                            error
                        })
                    }

                    const token = jwt.sign(
                        {
                            id: foundUser._id,
                            name: foundUser.name
                        },
                        "RANDOM-TOKEN"
                    )

                    response.json({
                        message: "Successful login",
                        username: foundUser.name,
                        token
                    })
                })
                .catch((error) => {
                    response.status(400).send({
                        message: "Wrong password",
                        error
                    })
                })
        })
        .catch((error) => {
            response.status(404).send({
                message: "Username not found",
                error
            })
        })
})

app.get("/authtest", auth, (request, response) => {
    response.json({message: "Hello :)"})
})

const PORT = 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
