/**
 * MongoDB Connection Manager
 */
const mongoose = require('mongoose');
const logger = require('./logger');

const connectMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: process.env.MONGODB_CONNECT_TIMEOUT || 10000,
            socketTimeoutMS: 45000
        });

        logger.info('MongoDB connected successfully');
        return mongoose;
    } catch (error) {
        logger.error('Failed to connect to MongoDB:', error);
        throw error;
    }
};

const closeConnection = async () => {
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
    } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
    }
};

module.exports = {
    connectMongoDB,
    closeConnection
};
