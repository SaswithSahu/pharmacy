const mongoose = require('mongoose');

const wholesalerOrderSchema = new mongoose.Schema({
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ID of the buyer
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ID of the seller
    item: {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'WholesalerProduct', required: true }, // ID of the product
        quantity: { type: Number, required: true } // Quantity of the product
    },
    status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered'], default: 'pending' } // Status of the order
});

const WholesalerOrder = mongoose.model('WholesalerOrder', wholesalerOrderSchema);

module.exports = WholesalerOrder;
