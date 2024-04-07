const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{ type: mongoose.Schema.Types.ObjectId,ref: 'RawMaterial' }],
    status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered'], default: 'pending' },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
