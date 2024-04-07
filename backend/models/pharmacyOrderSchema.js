const mongoose = require('mongoose');

const pharmacyOrderSchema = new mongoose.Schema({
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ID of the buyer
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ID of the seller
    item: {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'PharmacyProduct', required: true }, // ID of the product
        quantity: { type: Number, required: true } // Quantity of the product
    },
    status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered'], default: 'pending' } // Status of the order
});

const PharmacyOrder = mongoose.model('PharmacyOrder', pharmacyOrderSchema);

module.exports = PharmacyOrder;
