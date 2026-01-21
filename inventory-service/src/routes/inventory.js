/**
 * Express API for Inventory Service
 * Provides REST endpoints for inventory management and health checks
 */
const express = require('express');
const Inventory = require('../models/Inventory');
const InventoryService = require('../services/InventoryService');
const logger = require('../config/logger');

const router = express.Router();

/**
 * GET /health - Health check endpoint
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        service: 'inventory-service',
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /inventory/:productId - Get inventory status for a product
 */
router.get('/inventory/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const inventory = await InventoryService.getInventoryStatus(productId);

        if (!inventory) {
            return res.status(404).json({
                error: 'Product not found',
                productId
            });
        }

        res.json({
            productId: inventory.productId,
            productName: inventory.productName,
            totalQuantity: inventory.quantity,
            reserved: inventory.reserved,
            available: inventory.available,
            price: inventory.price
        });

    } catch (error) {
        logger.error('Error getting inventory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /inventory - Create initial inventory for a product
 */
router.post('/inventory', async (req, res) => {
    try {
        const { productId, productName, quantity, price } = req.body;

        if (!productId || !productName || quantity === undefined || !price) {
            return res.status(400).json({
                error: 'Missing required fields: productId, productName, quantity, price'
            });
        }

        const inventory = new Inventory({
            productId,
            productName,
            quantity,
            price,
            reserved: 0
        });

        await inventory.save();
        logger.info(`Inventory created for product: ${productId}`);

        res.status(201).json({
            message: 'Inventory created successfully',
            inventory
        });

    } catch (error) {
        logger.error('Error creating inventory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /inventory/:productId - Update inventory quantity
 */
router.put('/inventory/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined) {
            return res.status(400).json({
                error: 'Missing required field: quantity'
            });
        }

        const inventory = await Inventory.findOneAndUpdate(
            { productId },
            { quantity },
            { new: true }
        );

        if (!inventory) {
            return res.status(404).json({
                error: 'Product not found',
                productId
            });
        }

        logger.info(`Inventory updated for product: ${productId}. New quantity: ${quantity}`);

        res.json({
            message: 'Inventory updated successfully',
            inventory
        });

    } catch (error) {
        logger.error('Error updating inventory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
