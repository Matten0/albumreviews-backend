const mongoose = require('mongoose')

mongoose.set('strictQuery', false)

const url = process.env.MONGODB_URI

console.log('connecting to', url)
mongoose.connect(url)
    .then(result => {
        console.log('connected to MongoDB')
    })
    .catch((error) => {
        console.log('error connecting to MongoDB:', error.message)
    })

const reviewSchema = new mongoose.Schema({
    artist: {
        type: String,
        required: [true, "Artist name required"]
    },
    album: {
        type: String,
        required: [true, "Album name required"]
    },
    text: {
        type: String,
        required: [true, "Review text required"]
    },
    score: {
        type: Number,
        required: [true, "Review score required"]
    },
    username: {
        type: String,
        requred: [true, "Review needs an author"]
    }
})

reviewSchema.set('toJSON',{
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Review', reviewSchema)
