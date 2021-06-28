const mongoose = require('mongoose');

const Schema = mongoose.Schema;


// perhatikan bahwa ada second argument pada new Schema, yaitu timestamp 
// If true, Mongoose adds createdAt and updatedAt properties to your schema and manages those properties for you.
const postSchema = new Schema({
    title: {
        required: true,
        type: String
    },
    content: {
        required: true,
        type: String
    },
    imageUrl: {
        type: String,
        required: true
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Post', postSchema);