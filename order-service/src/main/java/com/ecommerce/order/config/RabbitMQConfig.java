package com.ecommerce.order.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ Configuration for Order Service
 * Configures exchanges, queues, and bindings for asynchronous communication
 */
@Configuration
public class RabbitMQConfig {

    @Value("${rabbitmq.exchange.orders}")
    private String ordersExchange;

    @Value("${rabbitmq.queue.orders.created}")
    private String orderCreatedQueue;

    @Value("${rabbitmq.queue.stock.results}")
    private String stockResultsQueue;

    @Value("${rabbitmq.routing.key.order.created}")
    private String orderCreatedRoutingKey;

    @Value("${rabbitmq.routing.key.stock.result}")
    private String stockResultRoutingKey;

    // ========================
    // Exchange
    // ========================
    @Bean
    public TopicExchange ordersTopicExchange() {
        return new TopicExchange(ordersExchange, true, false);
    }

    // ========================
    // Queues
    // ========================
    @Bean
    public Queue orderCreatedQueue() {
        return new Queue(orderCreatedQueue, true, false, false);
    }

    @Bean
    public Queue stockResultsQueue() {
        return new Queue(stockResultsQueue, true, false, false);
    }

    // ========================
    // Bindings
    // ========================
    @Bean
    public Binding orderCreatedBinding(Queue orderCreatedQueue, TopicExchange ordersTopicExchange) {
        return BindingBuilder.bind(orderCreatedQueue)
                .to(ordersTopicExchange)
                .with(orderCreatedRoutingKey);
    }

    @Bean
    public Binding stockResultsBinding(Queue stockResultsQueue, TopicExchange ordersTopicExchange) {
        return BindingBuilder.bind(stockResultsQueue)
                .to(ordersTopicExchange)
                .with(stockResultRoutingKey);
    }

    // ========================
    // JSON Message Converter
    // ========================
    @Bean
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jackson2JsonMessageConverter());
        return template;
    }
}
