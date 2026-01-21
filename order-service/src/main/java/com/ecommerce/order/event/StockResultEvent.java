package com.ecommerce.order.event;

import com.ecommerce.order.model.OrderItem;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.util.List;

/**
 * Base class for stock result events (StockReserved, StockRejected)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockResultEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    @JsonProperty("eventType")
    private String eventType;

    @JsonProperty("orderId")
    private String orderId;

    @JsonProperty("correlationId")
    private String correlationId;

    @JsonProperty("reason")
    private String reason;

    @JsonProperty("reservedItems")
    private List<OrderItem> reservedItems;

    @JsonProperty("reservedAt")
    private String reservedAt;

    @JsonProperty("rejectedAt")
    private String rejectedAt;
}
