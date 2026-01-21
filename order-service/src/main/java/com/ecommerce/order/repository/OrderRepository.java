package com.ecommerce.order.repository;

import com.ecommerce.order.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * OrderRepository - JPA Repository for Order entity
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
}
