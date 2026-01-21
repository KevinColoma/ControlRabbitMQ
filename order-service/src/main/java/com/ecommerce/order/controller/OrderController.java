package com.ecommerce.order.controller;

import com.ecommerce.order.event.OrderCreatedEvent;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.repository.OrderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.List;

/**
 * OrderController - REST API endpoints for order management
 * Handles order creation and retrieval
 * Follows exact JSON contract specified in requirements
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchange.orders}")
    private String ordersExchange;

    @Value("${rabbitmq.routing.key.order.created}")
    private String orderCreatedRoutingKey;

    /**
     * POST /api/v1/orders - Create a new order
     * Accepts: customerId (optional, generates UUID if empty), items, shippingAddress, paymentReference
     * Returns 201 Created with orderId, status=PENDING, message
     */
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody OrderRequest request) {
        try {
            // 1. Generate orderId (UUID)
            String orderId = generateOrderId();
            
            // 2. Generate customerId if not provided (UUID)
            String customerId = (request.getCustomerId() == null || request.getCustomerId().isEmpty()) 
                    ? generateUUID() 
                    : request.getCustomerId();
            
            Order order = new Order(orderId, request.getItems(), "PENDING");
            order.setCustomerId(customerId);

            // 3. Save to database
            orderRepository.save(order);
            log.info("[✓] Order created: {} with customerId: {} status PENDING", orderId, customerId);

            // 4. Publish OrderCreatedEvent to RabbitMQ
            OrderCreatedEvent event = new OrderCreatedEvent(orderId, request.getItems());
            rabbitTemplate.convertAndSend(ordersExchange, orderCreatedRoutingKey, event);
            log.info("[✓] OrderCreatedEvent published for orderId: {} with correlationId: {}", 
                    orderId, event.getCorrelationId());

            // 5. Return 201 Created response (exact format from requirements)
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new OrderResponse(orderId, "PENDING", "Order received. Inventory check in progress."));

        } catch (Exception e) {
            log.error("[✗] Error creating order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new OrderResponse(null, "ERROR", "Failed to create order: " + e.getMessage()));
        }
    }

    /**
     * GET /api/v1/orders - List all orders
     * Returns list of all orders in the system
     */
    @GetMapping
    public ResponseEntity<?> getAllOrders() {
        try {
            List<Order> orders = orderRepository.findAll();
            log.info("[✓] Retrieved {} orders", orders.size());
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            log.error("[✗] Error retrieving orders", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new OrderResponse(null, "ERROR", "Failed to retrieve orders: " + e.getMessage()));
        }
    }

    /**
     * GET /api/v1/orders/{orderId} - Retrieve order details
     * Returns order with status and items
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable String orderId) {
        try {
            Order order = orderRepository.findById(orderId).orElse(null);

            if (order == null) {
                log.warn("[!] Order not found: {}", orderId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new OrderResponse(orderId, "NOT_FOUND", "Order not found"));
            }

            OrderResponse response = new OrderResponse(
                    order.getOrderId(),
                    order.getStatus().toString(),
                    order.getItems()
            );
            
            // Add reason if order was cancelled
            if (order.getReason() != null) {
                response.setReason(order.getReason());
            }

            log.info("[✓] Order retrieved: {} with status: {}", orderId, order.getStatus());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("[✗] Error retrieving order: {}", orderId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new OrderResponse(orderId, "ERROR", "Failed to retrieve order: " + e.getMessage()));
        }
    }

    /**
     * Generate orderId as UUID (e.g., 550e8400-e29b-41d4-a716-446655440000)
     * Automatic UUID generation ensures global uniqueness
     */
    private String generateOrderId() {
        return UUID.randomUUID().toString();
    }

    /**
     * Generate UUID (reusable for any ID)
     */
    private String generateUUID() {
        return UUID.randomUUID().toString();
    }
}
