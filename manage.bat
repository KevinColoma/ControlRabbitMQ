@echo off
REM Script de utilidad para gestionar la arquitectura de microservicios (Windows)

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0

REM Funciones de utilidad
:print_info
echo [INFO] %~1
goto :eof

:print_error
echo [ERROR] %~1
goto :eof

REM Mostrar ayuda
:show_help
echo Microservices Architecture Management Script
echo.
echo Usage: %0 [command] [arguments]
echo.
echo Commands:
echo     start           Start infrastructure (RabbitMQ, PostgreSQL, MongoDB)
echo     stop            Stop infrastructure
echo     status          Check service status
echo     logs            View Docker logs
echo     init-inventory  Initialize sample inventory data
echo     help            Show this help message
echo.
goto :eof

REM Punto de entrada principal
if "%1"=="" (
    call :show_help
    exit /b 1
)

if "%1"=="start" (
    echo Starting infrastructure...
    cd /d %SCRIPT_DIR%infrastructure
    docker-compose up -d
    echo Infrastructure started successfully
    echo.
    echo Next steps:
    echo 1. Open new terminal and run: cd order-service ^&^& mvn spring-boot:run
    echo 2. Open another terminal and run: cd inventory-service ^&^& npm install ^&^& npm start
    goto :eof
)

if "%1"=="stop" (
    echo Stopping infrastructure...
    cd /d %SCRIPT_DIR%infrastructure
    docker-compose down
    echo Infrastructure stopped
    goto :eof
)

if "%1"=="status" (
    echo Checking service status...
    docker ps | find "rabbitmq-broker"
    if !errorlevel! equ 0 (
        echo [OK] Infrastructure is running
    ) else (
        echo [NOT RUNNING] Infrastructure is not running
    )
    goto :eof
)

if "%1"=="logs" (
    cd /d %SCRIPT_DIR%infrastructure
    docker-compose logs -f
    goto :eof
)

if "%1"=="init-inventory" (
    echo Initializing sample inventory...
    
    REM Producto 1
    curl -X POST http://localhost:3000/api/v1/inventory ^
      -H "Content-Type: application/json" ^
      -d "{\"productId\": \"PROD-001\", \"productName\": \"Laptop\", \"quantity\": 10, \"price\": 999.99}"
    
    REM Producto 2
    curl -X POST http://localhost:3000/api/v1/inventory ^
      -H "Content-Type: application/json" ^
      -d "{\"productId\": \"PROD-002\", \"productName\": \"Mouse\", \"quantity\": 50, \"price\": 29.99}"
    
    REM Producto 3
    curl -X POST http://localhost:3000/api/v1/inventory ^
      -H "Content-Type: application/json" ^
      -d "{\"productId\": \"PROD-003\", \"productName\": \"Keyboard\", \"quantity\": 25, \"price\": 79.99}"
    
    echo Sample inventory initialized
    goto :eof
)

if "%1"=="help" (
    call :show_help
    goto :eof
)

echo Unknown command: %1
call :show_help
exit /b 1
