package com.ecommerce.order.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.Embeddable;
import java.io.Serializable;

/**
 * OrderItem - Represents a single item in an order
 */
@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private String productId;
    private Integer quantity;
    private Double price;
}
