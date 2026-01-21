/**
 * Inventory Item Model - Stores product inventory information in MongoDB
 */
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
    {
        productId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        productName: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        reserved: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
        collection: 'inventory'
    }
);

// Calculate available stock (total - reserved)
inventorySchema.virtual('available').get(function () {
    return this.quantity - this.reserved;
});

module.exports = mongoose.model('Inventory', inventorySchema);
