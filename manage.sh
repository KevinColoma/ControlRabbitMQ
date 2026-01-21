#!/bin/bash

# Script de utilidad para gestionar la arquitectura de microservicios

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colores para salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funciones de utilidad
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Iniciar infraestructura
start_infrastructure() {
    print_info "Starting infrastructure (RabbitMQ, PostgreSQL, MongoDB)..."
    cd "$SCRIPT_DIR/infrastructure"
    docker-compose up -d
    print_info "Infrastructure started successfully"
    
    # Esperar a que los servicios estén listos
    print_info "Waiting for services to be ready..."
    sleep 5
}

# Detener infraestructura
stop_infrastructure() {
    print_info "Stopping infrastructure..."
    cd "$SCRIPT_DIR/infrastructure"
    docker-compose down
    print_info "Infrastructure stopped"
}

# Iniciar Order Service
start_order_service() {
    print_info "Starting Order Service..."
    cd "$SCRIPT_DIR/order-service"
    
    if ! command -v mvn &> /dev/null; then
        print_error "Maven not found. Please install Maven first."
        exit 1
    fi
    
    mvn spring-boot:run &
    print_info "Order Service started (running in background)"
}

# Iniciar Inventory Service
start_inventory_service() {
    print_info "Starting Inventory Service..."
    cd "$SCRIPT_DIR/inventory-service"
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js first."
        exit 1
    fi
    
    npm install
    npm start &
    print_info "Inventory Service started (running in background)"
}

# Ver logs
view_logs() {
    if [ -z "$1" ]; then
        print_warn "Usage: $0 logs [rabbitmq|postgres|mongodb|all]"
        return 1
    fi
    
    case "$1" in
        rabbitmq)
            docker logs -f rabbitmq-broker
            ;;
        postgres)
            docker logs -f postgres-orders
            ;;
        mongodb)
            docker logs -f mongodb-inventory
            ;;
        all)
            cd "$SCRIPT_DIR/infrastructure"
            docker-compose logs -f
            ;;
        *)
            print_error "Unknown service: $1"
            return 1
            ;;
    esac
}

# Verificar estado
check_status() {
    print_info "Checking service status..."
    
    # Check infrastructure
    if docker ps | grep -q "rabbitmq-broker\|postgres-orders\|mongodb-inventory"; then
        print_info "Infrastructure: Running"
    else
        print_warn "Infrastructure: Not running"
    fi
    
    # Check Order Service
    if curl -s http://localhost:8080/actuator/health &> /dev/null; then
        print_info "Order Service: Running"
    else
        print_warn "Order Service: Not running"
    fi
    
    # Check Inventory Service
    if curl -s http://localhost:3000/api/v1/health &> /dev/null; then
        print_info "Inventory Service: Running"
    else
        print_warn "Inventory Service: Not running"
    fi
}

# Inicializar inventario de prueba
init_sample_inventory() {
    print_info "Initializing sample inventory..."
    
    curl -X POST http://localhost:3000/api/v1/inventory \
      -H "Content-Type: application/json" \
      -d '{
        "productId": "PROD-001",
        "productName": "Laptop",
        "quantity": 10,
        "price": 999.99
      }'
    
    curl -X POST http://localhost:3000/api/v1/inventory \
      -H "Content-Type: application/json" \
      -d '{
        "productId": "PROD-002",
        "productName": "Mouse",
        "quantity": 50,
        "price": 29.99
      }'
    
    curl -X POST http://localhost:3000/api/v1/inventory \
      -H "Content-Type: application/json" \
      -d '{
        "productId": "PROD-003",
        "productName": "Keyboard",
        "quantity": 25,
        "price": 79.99
      }'
    
    print_info "Sample inventory initialized"
}

# Mostrar ayuda
show_help() {
    cat << EOF
Microservices Architecture Management Script

Usage: $0 [command] [arguments]

Commands:
    start           Start all services (infrastructure + microservices)
    stop            Stop all services
    status          Check service status
    logs [service]  View logs (rabbitmq, postgres, mongodb, all)
    init-inventory  Initialize sample inventory data
    help            Show this help message

Examples:
    $0 start
    $0 stop
    $0 status
    $0 logs rabbitmq
    $0 init-inventory

EOF
}

# Punto de entrada principal
main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 1
    fi
    
    case "$1" in
        start)
            start_infrastructure
            print_info "Services started. You can now run:"
            echo "  cd order-service && mvn spring-boot:run"
            echo "  cd inventory-service && npm start"
            ;;
        stop)
            stop_infrastructure
            ;;
        status)
            check_status
            ;;
        logs)
            view_logs "$2"
            ;;
        init-inventory)
            init_sample_inventory
            ;;
        help)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
