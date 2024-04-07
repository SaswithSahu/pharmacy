const mongoose = require('mongoose');

const manufacturerOrderSchema = new mongoose.Schema({
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    item: {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true }
    },
    status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered'], default: 'pending' }
});

const ManufacturerOrder = mongoose.model('ManufacturerOrder', manufacturerOrderSchema);

module.exports = ManufacturerOrder;
