# Node.js Inventory Service Configuration
NODE_ENV=development
PORT=18081

# RabbitMQ Configuration
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=user
RABBITMQ_PASSWORD=password
RABBITMQ_VHOST=/

# Exchange and Queue Configuration
RABBITMQ_EXCHANGE=orders-exchange
RABBITMQ_QUEUE_ORDER_CREATED=orders-queue
RABBITMQ_QUEUE_STOCK_RESULTS=stock-results-queue
RABBITMQ_ROUTING_KEY_ORDER_CREATED=order.created
RABBITMQ_ROUTING_KEY_STOCK_RESULT=stock.result

# Logging
LOG_LEVEL=info
