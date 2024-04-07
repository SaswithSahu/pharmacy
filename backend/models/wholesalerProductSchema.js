const mongoose = require('mongoose');

const wholesalerProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    wholesaler: { type: mongoose.Schema.Types.ObjectId, ref: 'Wholesaler' },
    newPrice: { type: Number, required: true },
    photo: { type: String },
    
});

const WholesalerProduct = mongoose.model('WholesalerProduct', wholesalerProductSchema);

module.exports = WholesalerProduct;
