package com.ecommerce.order.controller;

import com.ecommerce.order.model.OrderItem;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * OrderRequest DTO - Request body for creating a new order
 * Follows exact JSON contract specified in requirements
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {

    @JsonProperty("customerId")
    private String customerId;

    @JsonProperty("items")
    private List<OrderItem> items;

    @JsonProperty("shippingAddress")
    private ShippingAddress shippingAddress;

    @JsonProperty("paymentReference")
    private String paymentReference;

    /**
     * Nested DTO for shipping address
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShippingAddress {
        @JsonProperty("city")
        private String city;

        @JsonProperty("street")
        private String street;

        @JsonProperty("zip")
        private String zip;
    }
}
