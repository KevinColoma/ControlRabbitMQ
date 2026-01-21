/**
 * Order Event Consumer - Listens to order.created events from RabbitMQ
 * Processes stock reservation and publishes results back to Order Service
 */
const { getChannel } = require('../config/rabbitmq');
const InventoryService = require('../services/InventoryService');
const logger = require('../config/logger');

class OrderEventConsumer {
    /**
     * Start consuming order events
     */
    async startConsuming() {
        try {
            const channel = getChannel();
            const queue = process.env.RABBITMQ_QUEUE_ORDER_CREATED;

            logger.info(`Starting to consume messages from queue: ${queue}`);

            channel.consume(queue, async (msg) => {
                if (msg) {
                    await this.handleOrderCreatedEvent(msg, channel);
                }
            });

        } catch (error) {
            logger.error('Error starting consumer:', error);
            throw error;
        }
    }

    /**
     * Handle OrderCreatedEvent message
     * @param {Object} msg - RabbitMQ message
     * @param {Object} channel - RabbitMQ channel
     */
    async handleOrderCreatedEvent(msg, channel) {
        try {
            const event = JSON.parse(msg.content.toString());
            logger.info(`Received OrderCreatedEvent for orderId: ${event.orderId}`);

            const { orderId, items } = event;

            // Try to reserve stock
            const result = await InventoryService.reserveStock(items);

            // Publish result event back to Order Service
            await this.publishStockResult(orderId, result);

            // Acknowledge message
            channel.ack(msg);

        } catch (error) {
            logger.error('Error handling order created event:', error);
            channel.nack(msg, false, true); // Requeue the message
        }
    }

    /**
     * Publish stock reservation result to RabbitMQ
     * @param {String} orderId
     * @param {Object} result - Reservation result
     */
    async publishStockResult(orderId, result) {
        try {
            const channel = getChannel();
            const exchange = process.env.RABBITMQ_EXCHANGE;
            const routingKey = process.env.RABBITMQ_ROUTING_KEY_STOCK_RESULT;

            const stockResultEvent = {
                orderId,
                eventType: result.success ? 'StockReserved' : 'StockRejected',
                reason: result.success ? null : result.reason,
                timestamp: new Date().toISOString()
            };

            channel.publish(
                exchange,
                routingKey,
                Buffer.from(JSON.stringify(stockResultEvent)),
                { persistent: true }
            );

            logger.info(
                `StockResultEvent published for orderId: ${orderId}. EventType: ${stockResultEvent.eventType}`
            );

        } catch (error) {
            logger.error('Error publishing stock result:', error);
            throw error;
        }
    }
}

module.exports = new OrderEventConsumer();
