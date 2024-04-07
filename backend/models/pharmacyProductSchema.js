const mongoose = require('mongoose');

const pharmacyProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    wholesaler: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pharmacy:{type: mongoose.Schema.Types.ObjectId,ref:"User"},
    newPrice: { type: Number, required: true },
    photo: { type: String },
    finalPrice: { type: Number, required: true },
    
});

const PharmacyProduct = mongoose.model('PharmacyProduct', pharmacyProductSchema);

module.exports = PharmacyProduct;
