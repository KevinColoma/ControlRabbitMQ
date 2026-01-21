require('dotenv').config();

const amqp = require('amqplib');
const express = require('express');
const app = express();

app.use(express.json());

// Product UUIDs
const PRODUCT_P001_UUID = "550e8400-e29b-41d4-a716-446655440001";
const PRODUCT_P777_UUID = "550e8400-e29b-41d4-a716-446655440002";

// In-Memory Product Stock Database
let productsStock = {
    [PRODUCT_P001_UUID]: { 
        productId: PRODUCT_P001_UUID,
        productName: "Producto Televisor 55\" 4K UHD",
        total: 25, 
        reserved: 0, 
        available: 25, 
        updatedAt: new Date().toISOString() 
    },
    [PRODUCT_P777_UUID]: { 
        productId: PRODUCT_P777_UUID,
        productName: "Product PlayStation 5",
        total: 5, 
        reserved: 0, 
        available: 5, 
        updatedAt: new Date().toISOString() 
    }
};

// Map legacy productIds to UUIDs
const productIdMap = {
    "P-001": PRODUCT_P001_UUID,
    "P-777": PRODUCT_P777_UUID
};

const PORT = process.env.PORT || 18081;

// ========== REST API ENDPOINTS ==========

app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'inventory-service',
        port: PORT,
        timestamp: new Date().toISOString(),
        rabbitmq: 'connecting'
    });
});

app.get('/api/v1/inventory', (req, res) => {
    const inventory = Object.entries(productsStock).map(([productId, data]) => ({
        productId,
        productName: data.productName,
        availableStock: data.available,
        reservedStock: data.reserved,
        totalStock: data.total,
        lastUpdated: data.updatedAt
    }));

    res.json({
        products: inventory,
        totalProducts: inventory.length,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/v1/inventory/:productId', (req, res) => {
    const requestedId = req.params.productId;
    const productId = productIdMap[requestedId] || requestedId;
    const productData = productsStock[productId];

    if (!productData) {
        return res.status(404).json({
            error: "Product not found",
            requestedId: requestedId
        });
    }

    res.json({
        productId: productId,
        productName: productData.productName,
        availableStock: productData.available,
        reservedStock: productData.reserved,
        totalStock: productData.total,
        lastUpdated: productData.updatedAt
    });
});

// ========== START SERVER ==========

const server = app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✓ Inventory Service running on port ${PORT}`);
    console.log(`✓ Server is ready to receive requests`);
    console.log(`${'='.repeat(60)}\n`);

    console.log('📦 Initial Inventory (UUID Format):');
    Object.entries(productsStock).forEach(([id, data]) => {
        console.log(`   ${data.productName} (${id}): total=${data.total}, available=${data.available}, reserved=${data.reserved}`);
    });
    console.log();

    // Setup RabbitMQ Consumer in background (non-blocking)
    setupRabbitMQ();
});

server.on('error', (err) => {
    console.error('[✗] Server error:', err.message);
});

// ========== RABBITMQ SETUP ==========

async function setupRabbitMQ() {
    try {
        const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
        const RABBITMQ_PORT = process.env.RABBITMQ_PORT || 5672;
        const RABBITMQ_USER = process.env.RABBITMQ_USER || 'user';
        const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || 'password';
        const RABBITMQ_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;

        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();
        console.log('[✓] Connected to RabbitMQ');

        const exchange = process.env.RABBITMQ_EXCHANGE || 'orders-exchange';
        const ordersQueue = 'orders-queue';
        const resultsQueue = 'stock-results-queue';

        await channel.assertExchange(exchange, 'topic', { durable: true });
        await channel.assertQueue(ordersQueue, { durable: true });
        await channel.assertQueue(resultsQueue, { durable: true });
        await channel.bindQueue(ordersQueue, exchange, process.env.RABBITMQ_ROUTING_KEY_ORDER_CREATED || 'order.created');
        
        console.log('[✓] RabbitMQ Exchange and Queues configured');

        // Consumer
        channel.consume(ordersQueue, async (msg) => {
            if (!msg) return;

            try {
                const orderCreatedEvent = JSON.parse(msg.content.toString());
                
                console.log(`\n[📥] OrderCreatedEvent received for orderId: ${orderCreatedEvent.orderId}`);
                console.log(`    Items: ${JSON.stringify(orderCreatedEvent.items)}`);

                // Validate Stock Availability
                let hasStock = true;
                let rejectionReason = "";
                const requestedItems = orderCreatedEvent.items || [];

                for (const item of requestedItems) {
                    const productUUID = productIdMap[item.productId] || item.productId;
                    const productData = productsStock[productUUID] || { available: 0 };
                    const availableStock = productData.available || 0;

                    if (availableStock < item.quantity) {
                        hasStock = false;
                        rejectionReason = `Insufficient stock for product ${item.productId}`;
                        break;
                    }
                }

                // Prepare Response Event
                let responseEvent;

                if (hasStock) {
                    // Reserve Stock
                    for (const item of requestedItems) {
                        const productUUID = productIdMap[item.productId] || item.productId;
                        const product = productsStock[productUUID];
                        if (product) {
                            product.available -= item.quantity;
                            product.reserved += item.quantity;
                            product.updatedAt = new Date().toISOString();
                        }
                    }

                    responseEvent = {
                        eventType: "StockReserved",
                        orderId: orderCreatedEvent.orderId,
                        correlationId: orderCreatedEvent.correlationId,
                        reservedItems: requestedItems,
                        reservedAt: new Date().toISOString()
                    };

                    console.log(`[✓] StockReserved event prepared for orderId ${orderCreatedEvent.orderId}`);

                } else {
                    responseEvent = {
                        eventType: "StockRejected",
                        orderId: orderCreatedEvent.orderId,
                        correlationId: orderCreatedEvent.correlationId,
                        reason: rejectionReason,
                        rejectedAt: new Date().toISOString()
                    };

                    console.log(`[✗] StockRejected event prepared for orderId ${orderCreatedEvent.orderId}`);
                }

                // Send Response to RabbitMQ
                channel.sendToQueue(resultsQueue, Buffer.from(JSON.stringify(responseEvent)));
                console.log(`[📤] Response event published to ${resultsQueue}\n`);

                // Acknowledge Message Processing
                channel.ack(msg);

            } catch (error) {
                console.error('[✗] Error processing OrderCreatedEvent:', error.message);
                channel.nack(msg, false, true);
            }
        }, { noAck: false });

        console.log('[✓] Listening for OrderCreated events...\n');
        
    } catch (error) {
        console.error('[✗] Failed to setup RabbitMQ:', error.message);
        console.log('[↻] Retrying RabbitMQ connection in 5 seconds...\n');
        setTimeout(() => {
            setupRabbitMQ();
        }, 5000);
    }
}

// Global error handlers
process.on('uncaughtException', (error) => {
    console.error('[FATAL] Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('[FATAL] Unhandled Rejection:', reason?.message || reason);
});
