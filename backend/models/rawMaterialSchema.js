const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    photo: { type: String },
    description:{type:String}, 
    price: { type: Number, required: true },
    quantityAvailable: { type: Number, required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

});

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);
