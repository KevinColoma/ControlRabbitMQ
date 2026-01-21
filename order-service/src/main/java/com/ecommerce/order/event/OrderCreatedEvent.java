package com.ecommerce.order.event;

import com.ecommerce.order.model.OrderItem;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * OrderCreatedEvent - Event published when an order is created
 * This event is sent to RabbitMQ for the Inventory Service to process
 * Format: Exact JSON contract as specified
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreatedEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    @JsonProperty("eventType")
    private String eventType = "OrderCreated";

    @JsonProperty("orderId")
    private String orderId;

    @JsonProperty("correlationId")
    private String correlationId;

    @JsonProperty("createdAt")
    private String createdAt;

    @JsonProperty("items")
    private List<OrderItem> items;

    public OrderCreatedEvent(String orderId, List<OrderItem> items) {
        this.eventType = "OrderCreated";
        this.orderId = orderId;
        this.correlationId = UUID.randomUUID().toString();
        this.createdAt = LocalDateTime.now(ZoneId.of("UTC"))
                .format(DateTimeFormatter.ISO_DATE_TIME) + "Z";
        this.items = items;
    }
}
