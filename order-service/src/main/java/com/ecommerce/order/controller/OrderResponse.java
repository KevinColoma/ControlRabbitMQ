package com.ecommerce.order.controller;

import com.ecommerce.order.model.OrderItem;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * OrderResponse DTO - Response sent to client when order is created or retrieved
 * Follows exact JSON contract specified in requirements
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderResponse {

    @JsonProperty("orderId")
    private String orderId;

    @JsonProperty("status")
    private String status;

    @JsonProperty("message")
    private String message;

    @JsonProperty("items")
    private List<OrderItem> items;

    @JsonProperty("reason")
    private String reason;

    // Constructor para response POST (creación de orden)
    public OrderResponse(String orderId, String status, String message) {
        this.orderId = orderId;
        this.status = status;
        this.message = message;
    }

    // Constructor para response GET (con items)
    public OrderResponse(String orderId, String status, List<OrderItem> items) {
        this.orderId = orderId;
        this.status = status;
        this.items = items;
    }
}
