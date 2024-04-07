const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    photo: { type: String },
    price: { type: Number, required: true },
    expiryDate: { type: Date },
    manufacturerDate: { type: Date },
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: { type: { type: String }, coordinates: [Number] },
    address:{type: String},
});

productSchema.index({ location: '2dsphere' })
module.exports = mongoose.model('Product', productSchema);
