package com.ecommerce.order.model;

/**
 * OrderStatus - Enum for order statuses
 */
public enum OrderStatus {
    PENDING,      // Order created, waiting for inventory confirmation
    CONFIRMED,    // Inventory confirmed stock availability
    CANCELLED     // Order cancelled, stock not available
}
