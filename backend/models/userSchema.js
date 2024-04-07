const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required:true},
    profilePic:{type: String},
    description:{type: String},
    role: { type: String, enum: ['supplier', 'manufacturer', 'wholesaler', 'pharmacy', 'customer'], required: true },
    location: { type: String },
});

module.exports = mongoose.model('User', userSchema);
