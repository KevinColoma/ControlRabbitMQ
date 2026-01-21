/**
 * RabbitMQ Connection Manager
 * Handles connection and channel creation for both consuming and publishing
 */
const amqp = require('amqplib');
const logger = require('./logger');

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
    try {
        const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}${process.env.RABBITMQ_VHOST}`;
        
        connection = await amqp.connect(url);
        channel = await connection.createChannel();

        logger.info('RabbitMQ connected successfully');

        // Set up queue handlers
        await setupQueuesAndExchanges();

        return channel;
    } catch (error) {
        logger.error('Failed to connect to RabbitMQ:', error);
        throw error;
    }
};

const setupQueuesAndExchanges = async () => {
    try {
        // Declare exchange
        await channel.assertExchange(process.env.RABBITMQ_EXCHANGE, 'direct', { durable: true });
        logger.info(`Exchange ${process.env.RABBITMQ_EXCHANGE} declared`);

        // Declare queues
        await channel.assertQueue(process.env.RABBITMQ_QUEUE_ORDER_CREATED, { durable: true });
        await channel.assertQueue(process.env.RABBITMQ_QUEUE_STOCK_RESULTS, { durable: true });
        logger.info('Queues declared');

        // Bind queues to exchange
        await channel.bindQueue(
            process.env.RABBITMQ_QUEUE_ORDER_CREATED,
            process.env.RABBITMQ_EXCHANGE,
            process.env.RABBITMQ_ROUTING_KEY_ORDER_CREATED
        );
        logger.info(`Queue ${process.env.RABBITMQ_QUEUE_ORDER_CREATED} bound to exchange`);

    } catch (error) {
        logger.error('Error setting up queues and exchanges:', error);
        throw error;
    }
};

const getChannel = () => {
    if (!channel) {
        throw new Error('RabbitMQ channel not initialized');
    }
    return channel;
};

const closeConnection = async () => {
    try {
        if (channel) {
            await channel.close();
        }
        if (connection) {
            await connection.close();
        }
        logger.info('RabbitMQ connection closed');
    } catch (error) {
        logger.error('Error closing RabbitMQ connection:', error);
    }
};

module.exports = {
    connectRabbitMQ,
    getChannel,
    closeConnection
};
