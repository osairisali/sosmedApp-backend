const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        required: true,
        type: String
    },
    email: {
        required: true,
        type: String
    },
    password: {
        required: true,
        type: String
    },
    status: {
        type: String,
        default: 'I am a new user'
    },
    posts: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }]
});

module.exports = mongoose.model('User', userSchema);