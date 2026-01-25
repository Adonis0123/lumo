# Daemon Module

The daemon is a standalone Rust HTTP service that receives OpenTelemetry Protocol (OTLP) telemetry data from Claude Code and persists it to SQLite.

## Architecture

The daemon follows a layered architecture pattern:

```
Routes → Handlers → Services → Repositories → SQLite
```

### Layer Responsibilities

1. **Routes** (`src/routes/`): Define HTTP endpoints and route configuration
2. **Handlers** (`src/handlers/`): Extract request data, call services, return responses
3. **Services** (`src/services/`): Business logic and data transformation (OTLP parsing)
4. **Repositories**: Data access layer (from `lumo-shared` crate)

## Directory Structure

```
src/
├── main.rs              # Entry point with Tokio runtime
├── config.rs            # Environment-based configuration
├── error.rs             # Error types and conversions
├── server/
│   ├── mod.rs
│   ├── app.rs           # Axum router setup
│   ├── state.rs         # AppState (SqlitePool + Config)
│   └── shutdown.rs      # Graceful shutdown handling
├── routes/
│   ├── mod.rs
│   ├── health.rs        # GET /health
│   └── otlp.rs          # POST /v1/metrics, POST /v1/logs
├── handlers/
│   ├── mod.rs
│   ├── health.rs        # Health check handler
│   ├── metrics.rs       # OTLP metrics handler
│   └── logs.rs          # OTLP logs handler
└── services/
    ├── mod.rs
    └── otlp_parser.rs   # OTLP protocol parsing
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check with version info |
| POST | `/v1/metrics` | Receive OTLP metrics (protobuf JSON) |
| POST | `/v1/logs` | Receive OTLP logs/events (protobuf JSON) |

## Adding New Functionality

### Adding a New Endpoint

1. **Create route** in `src/routes/`:
```rust
// src/routes/my_route.rs
use axum::Router;
use crate::server::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/my-endpoint", get(crate::handlers::my_handler::handle))
}
```

2. **Create handler** in `src/handlers/`:
```rust
// src/handlers/my_handler.rs
use axum::extract::State;
use crate::server::AppState;

pub async fn handle(
    State(state): State<AppState>,
) -> impl IntoResponse {
    // Access database: state.pool
    // Access config: state.config
    Json(json!({ "status": "ok" }))
}
```

3. **Register route** in `src/server/app.rs`:
```rust
pub fn create_app(state: AppState) -> Router {
    Router::new()
        .merge(health::router())
        .merge(otlp::router())
        .merge(my_route::router())  // Add here
        .with_state(state)
}
```

### Adding a New Service

Services contain business logic and should be stateless functions:

```rust
// src/services/my_service.rs
use lumo_shared::database::entities::MyEntity;

pub fn process_data(input: &RawInput) -> Vec<MyEntity> {
    // Transform input to domain entities
}
```

## State Management

The `AppState` struct is shared across all handlers via Axum's State extractor:

```rust
pub struct AppState {
    pub pool: SqlitePool,    // Database connection pool
    pub config: Arc<Config>, // Immutable configuration
}
```

## Error Handling

Handlers should return `Result<impl IntoResponse, AppError>` where `AppError` implements `IntoResponse`:

```rust
pub async fn handle(...) -> Result<Json<Response>, AppError> {
    let data = some_operation().map_err(AppError::Database)?;
    Ok(Json(data))
}
```

## Configuration

Environment variables:
- `LUMO_HOST`: Bind address (default: `127.0.0.1`)
- `LUMO_PORT`: Port number (default: `4318`)
- `RUST_LOG`: Log level (default: `info`)

## Development Commands

```bash
# Run daemon in development
cargo run -p lumo-daemon

# Run with debug logging
RUST_LOG=debug cargo run -p lumo-daemon

# Build release
cargo build -p lumo-daemon --release
```

## Dependencies

Key dependencies:
- `axum`: HTTP framework
- `tokio`: Async runtime
- `sqlx`: Database access (via lumo-shared)
- `opentelemetry-proto`: OTLP protocol types
- `tracing`: Structured logging
