package com.ecommerce.order.consumer;

import com.ecommerce.order.event.StockResultEvent;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.repository.OrderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * OrderResultConsumer - Listens to stock-results-queue from RabbitMQ
 * Processes StockReserved and StockRejected events from Inventory Service
 * Updates order status: PENDING -> CONFIRMED (StockReserved) or CANCELLED (StockRejected)
 */
@Slf4j
@Service
public class OrderResultConsumer {

    @Autowired
    private OrderRepository orderRepository;

    /**
     * Handle stock result events (StockReserved or StockRejected)
     * Updates order status and persists to database
     *
     * @param event StockResultEvent containing orderId, eventType, and correlation data
     */
    @RabbitListener(queues = "${rabbitmq.queue.stock.results}")
    public void handleStockResult(StockResultEvent event) {
        try {
            log.info("[📥] Processing stock result event for orderId: {} | eventType: {} | correlationId: {}", 
                     event.getOrderId(), event.getEventType(), event.getCorrelationId());

            // Find the order
            Order order = orderRepository.findById(event.getOrderId()).orElse(null);

            if (order == null) {
                log.warn("[!] Order not found: {}", event.getOrderId());
                return;
            }

            // Update order status based on event type
            if ("StockReserved".equals(event.getEventType())) {
                order.setStatus(OrderStatus.CONFIRMED);
                log.info("[✓] Order {} status updated to CONFIRMED at {}", 
                        order.getOrderId(), event.getReservedAt());

            } else if ("StockRejected".equals(event.getEventType())) {
                order.setStatus(OrderStatus.CANCELLED);
                order.setReason(event.getReason() != null ? 
                        event.getReason() : "Insufficient stock");
                log.warn("[✗] Order {} status updated to CANCELLED at {} | Reason: {}", 
                        order.getOrderId(), event.getRejectedAt(), order.getReason());
            } else {
                log.warn("[!] Unknown event type: {}", event.getEventType());
                return;
            }

            // Save updated order to database
            orderRepository.save(order);
            log.info("[✓] Order persisted to database: {}", order.getOrderId());

        } catch (Exception e) {
            log.error("[✗] Error processing stock result event", e);
        }
    }
}
