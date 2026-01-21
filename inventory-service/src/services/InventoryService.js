/**
 * Inventory Service - Business logic for managing inventory
 * Handles stock reservation and updates
 */
const Inventory = require('../models/Inventory');
const logger = require('../config/logger');

class InventoryService {
    /**
     * Reserve stock for an order
     * @param {Array} items - Array of items with productId and quantity
     * @returns {Object} - Result with reserved items or rejection reason
     */
    async reserveStock(items) {
        const session = await Inventory.startSession();
        session.startTransaction();

        try {
            const reservedItems = [];

            for (const item of items) {
                const inventory = await Inventory.findOne({ productId: item.productId }).session(session);

                if (!inventory) {
                    await session.abortTransaction();
                    session.endSession();
                    
                    logger.warn(`Product not found: ${item.productId}`);
                    return {
                        success: false,
                        reason: `Product ${item.productId} not found in inventory`
                    };
                }

                const availableStock = inventory.quantity - inventory.reserved;

                if (availableStock < item.quantity) {
                    await session.abortTransaction();
                    session.endSession();

                    logger.warn(
                        `Insufficient stock for product ${item.productId}. Required: ${item.quantity}, Available: ${availableStock}`
                    );
                    return {
                        success: false,
                        reason: `Insufficient stock for product ${item.productId}. Required: ${item.quantity}, Available: ${availableStock}`
                    };
                }

                // Reserve the stock
                inventory.reserved += item.quantity;
                await inventory.save({ session });
                reservedItems.push(item);

                logger.info(
                    `Stock reserved for product ${item.productId}: ${item.quantity} units. Available now: ${availableStock - item.quantity}`
                );
            }

            await session.commitTransaction();
            session.endSession();

            return {
                success: true,
                reservedItems
            };

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error('Error reserving stock:', error);
            throw error;
        }
    }

    /**
     * Release reserved stock (for cancelled orders)
     * @param {Array} items - Array of items to release
     */
    async releaseStock(items) {
        try {
            for (const item of items) {
                const inventory = await Inventory.findOne({ productId: item.productId });

                if (inventory) {
                    inventory.reserved = Math.max(0, inventory.reserved - item.quantity);
                    await inventory.save();
                    logger.info(`Stock released for product ${item.productId}: ${item.quantity} units`);
                }
            }
        } catch (error) {
            logger.error('Error releasing stock:', error);
            throw error;
        }
    }

    /**
     * Get inventory status for a product
     * @param {String} productId
     */
    async getInventoryStatus(productId) {
        try {
            const inventory = await Inventory.findOne({ productId });
            return inventory || null;
        } catch (error) {
            logger.error(`Error getting inventory status for ${productId}:`, error);
            throw error;
        }
    }
}

module.exports = new InventoryService();
