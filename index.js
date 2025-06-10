require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = express()

app.use(express.json())
app.use(cors())
app.use(express.static('dist'))

const User = require("./models/user")
const Review = require("./models/review")
const auth = require("./auth")


app.post("/api/users/register", (request, response) => {
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

app.post("/api/users/login", (request, response, next) => {
    const user = request.body
    User.findOne({name: user.name})
        .then((foundUser) => {
            bcrypt.compare(user.password, foundUser.password)
                .then((passwordCompare) => {
                    if (!passwordCompare) {
                        return response.status(400).send({
                            message: "Incorrect password",
                            error
                        })
                    }
                    const token = jwt.sign(
                        {
                            name: foundUser.name
                        },
                        process.env.TOKEN_SECRET,
                        { "expiresIn": "2h" }
                    )
                    response.json({
                        message: "Successful login",
                        username: foundUser.name,
                        token: token
                    })
                })
                .catch(error => next(error))
        })
        .catch((error) => {
            response.status(404).send({
                message: "Username not found",
                error
            })
        })
})

app.get("/api/users", (request, response, next) => {
    User.find({})
        .then(users => {
            var usernames = users.map(u => u.name)
            response.json(usernames)
        })
        .catch(error => next(error))
})

app.get("/api/reviews", (request, response, next) => {
    const artistSearch = request.query.artist?.toLowerCase() || ''
    const albumSearch = request.query.album?.toLowerCase() || ''
    const username = request.query.user

    Review.find({})
        .then(reviews => {
            var filtered = reviews.filter(r => r.artist.toLowerCase().includes(artistSearch) && r.album.toLowerCase().includes(albumSearch))
            if (username)
                filtered = filtered.filter(r => r.username === username)
            response.json(filtered)
        })
        .catch(error => next(error))
})

app.post("/api/reviews", auth, (request, response, next) => {
    const body = request.body
    const username = request.user.name

    if (!body.artist || !body.album || !body.text || (!body.score & body.score!=0) || !username) {
        return response.status(400).json({ 
            error: 'Missing information' 
        })
    }

    const newReview = new Review({
        artist: body.artist,
        album: body.album,
        text: body.text,
        score: body.score,
        username: username
    })

    newReview.save()
        .then(savedReview => {
            console.log("Review saved")
            response.json(savedReview)
        })
        .catch(error => next(error))
})

app.get('/api/reviews/:id', (request, response, next) => {
    Review.findById(request.params.id)
        .then(review => {
            if (review) {
                response.json(review)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
})

app.delete('/api/reviews/:id', auth, (request, response, next) => {
    Review.findById(request.params.id)
        .then(review => {
            if (!(review.username === request.user.name)) {
                return response.status(400).json({
                    error: 'Incorrect username'
                })
            } else {
                Review.deleteOne(review)
                    .then(result => {
                        response.status(204).end()
                    })
                    .catch(error => next(error))
            }
        })
        .catch(error => next(error))
})

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
