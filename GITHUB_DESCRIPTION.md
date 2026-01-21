Tecnología de Microservicios de Pedidos y Gestión de Inventario
================================================================

## Descripción Breve para GitHub

**ControlRabbit** es una arquitectura de microservicios event-driven que implementa un sistema completo de gestión de órdenes e inventario con:

- ✅ **UUIDs en todos los IDs** (orderId, customerId, productId)
- ✅ **Event-Driven Architecture** con RabbitMQ
- ✅ **Microservicios desacoplados** (Order Service + Inventory Service)
- ✅ **API REST** con Spring Boot y Express.js
- ✅ **Persistencia en PostgreSQL**
- ✅ **Stock tracking** en tiempo real

### Stack Tecnológico

| Component | Tecnología | Propósito |
|-----------|-----------|----------|
| **Backend - Órdenes** | Java 17, Spring Boot 3.2, JPA/Hibernate | API REST + Persistencia |
| **Backend - Inventario** | Node.js 18, Express.js | Gestión de stock + Eventos |
| **Message Broker** | RabbitMQ 3 | Comunicación asíncrona |
| **Base de Datos** | PostgreSQL 15 | Persistencia de órdenes |
| **Containerización** | Docker, Docker Compose | Orquestación |

### Características Principales

1. **UUID Completo** - Todos los IDs (orden, cliente, producto) son UUID v4
2. **Event-Driven** - Órdenes generan eventos que disparan reservas de stock
3. **Stock Tracking** - Seguimiento de stock disponible y reservado
4. **Backward Compatible** - Acepta IDs legacy (P-001) y mapea a UUID
5. **Escalable** - Sin coordinación centralizada de IDs

### Flujo End-to-End

```
Cliente → POST /orders → Order Service (genera UUID)
                ↓
            PostgreSQL persiste
                ↓
        Publica OrderCreatedEvent
                ↓
            RabbitMQ enruta
                ↓
        Inventory Service consume
                ↓
        Valida stock + Reserva
                ↓
        Publica StockReserved/Rejected
                ↓
        Order Service consume
                ↓
        Actualiza estado (CONFIRMED/REJECTED)
                ↓
        Cliente GET /orders/{id} → Respuesta final
```

### Quick Start

```bash
# 1. Clonar y entrar al proyecto
git clone https://github.com/tu-usuario/ControlRabbit.git
cd ControlRabbit

# 2. Iniciar infraestructura
docker-compose up -d

# 3. Compilar Order Service
cd order-service 
mvn clean package -DskipTests -q

# 4. Terminal 1 - Order Service
cd order-service/target
java -jar order-service-1.0.0.jar

# 5. Terminal 2 - Inventory Service
cd inventory-service
node index.js

# 6. Terminal 3 - Pruebas
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/orders" -Method GET
Invoke-WebRequest -Uri "http://localhost:18081/api/v1/inventory" -Method GET
```

### Endpoints Principales

**Order Service (8080)**
- `POST /api/v1/orders` - Crear orden
- `GET /api/v1/orders` - Listar órdenes
- `GET /api/v1/orders/{orderId}` - Obtener orden

**Inventory Service (18081)**
- `GET /api/v1/inventory` - Listar productos
- `GET /api/v1/inventory/{productId}` - Stock de producto

### Documentación

- 📖 [README.md](README.md) - Guía completa de uso
- 🔄 [UUID_MIGRATION.md](UUID_MIGRATION.md) - Detalles de migración UUID
- 📦 [ControlRabbit.postman_collection.json](ControlRabbit.postman_collection.json) - Requests para Postman

### Requisitos

- Java 17+
- Node.js 18+
- Docker & Docker Compose
- Maven 3.8+


### Autor

Kevin Coloma / Tu Organización

---

 **Versión**: 2.1.0
