# Shared Library Module

The shared library (`lumo-shared`) provides the database layer used by both the daemon and Tauri application. It contains entities, repositories, and database connection management.

## Architecture

The database layer follows a clean separation pattern:

```
Entities (Row + Domain) → Repositories (Static Methods) → SQLite
```

### Key Patterns

1. **Row/Domain Type Split**: Separate types for database mapping and API exposure
2. **Static Repository Pattern**: Stateless repository methods that take `&SqlitePool`
3. **Typeshare Integration**: Domain types annotated for TypeScript generation

## Directory Structure

```
src/
├── lib.rs               # Crate root, re-exports
├── error.rs             # Error types (Error, Result)
└── database/
    ├── mod.rs           # Module exports
    ├── connection.rs    # Pool creation and migrations
    ├── entities/
    │   ├── mod.rs
    │   ├── event.rs     # EventRow, Event, NewEvent
    │   ├── metric.rs    # MetricRow, Metric, NewMetric
    │   └── session.rs   # Session (view-based)
    └── repositories/
        ├── mod.rs
        ├── event_repo.rs
        ├── metric_repo.rs
        └── session_repo.rs

migrations/
└── 20250125000001_create_tables.sql  # Schema definition
```

## Entity Pattern

Each entity has three types:

```rust
// 1. Row type - maps directly to database columns
#[derive(Debug, Clone, FromRow)]
pub struct EventRow {
    pub id: i64,
    pub session_id: String,
    pub name: String,
    pub timestamp: i64,  // stored as integer
    // ... other fields
}

// 2. Domain type - public API with proper types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[typeshare]
pub struct Event {
    pub id: i64,
    pub session_id: String,
    pub name: String,
    pub timestamp: i64,
    // ... other fields
}

// 3. New type - for insertions (no id field)
#[derive(Debug, Clone)]
pub struct NewEvent {
    pub session_id: String,
    pub name: String,
    pub timestamp: i64,
    // ... other fields
}

// Conversion from Row to Domain
impl From<EventRow> for Event {
    fn from(row: EventRow) -> Self {
        Self {
            id: row.id,
            session_id: row.session_id,
            // ... handle any data transformations
        }
    }
}
```

## Repository Pattern

Repositories use static async methods:

```rust
pub struct EventRepository;

impl EventRepository {
    /// Insert a single event
    pub async fn insert(pool: &SqlitePool, event: &NewEvent) -> Result<i64> {
        let id = sqlx::query!(
            r#"INSERT INTO events (session_id, name, timestamp)
               VALUES (?, ?, ?)"#,
            event.session_id,
            event.name,
            event.timestamp
        )
        .execute(pool)
        .await?
        .last_insert_rowid();

        Ok(id)
    }

    /// Find events by session
    pub async fn find_by_session(pool: &SqlitePool, session_id: &str) -> Result<Vec<Event>> {
        let rows = sqlx::query_as!(
            EventRow,
            "SELECT * FROM events WHERE session_id = ? ORDER BY timestamp DESC",
            session_id
        )
        .fetch_all(pool)
        .await?;

        Ok(rows.into_iter().map(Event::from).collect())
    }
}
```

## Adding a New Entity

### 1. Create Migration

Create a new migration file in `migrations/` with timestamp prefix:

```sql
-- migrations/20250126000001_add_my_table.sql
CREATE TABLE IF NOT EXISTS my_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value REAL NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_my_table_name ON my_table(name);
```

### 2. Define Entity Types

Create `src/database/entities/my_entity.rs`:

```rust
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use typeshare::typeshare;

#[derive(Debug, Clone, FromRow)]
pub struct MyEntityRow {
    pub id: i64,
    pub name: String,
    pub value: f64,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[typeshare]
pub struct MyEntity {
    pub id: i64,
    pub name: String,
    pub value: f64,
    pub created_at: i64,
}

#[derive(Debug, Clone)]
pub struct NewMyEntity {
    pub name: String,
    pub value: f64,
}

impl From<MyEntityRow> for MyEntity {
    fn from(row: MyEntityRow) -> Self {
        Self {
            id: row.id,
            name: row.name,
            value: row.value,
            created_at: row.created_at,
        }
    }
}
```

### 3. Create Repository

Create `src/database/repositories/my_entity_repo.rs`:

```rust
use sqlx::SqlitePool;
use crate::database::entities::{MyEntity, MyEntityRow, NewMyEntity};
use crate::error::Result;

pub struct MyEntityRepository;

impl MyEntityRepository {
    pub async fn insert(pool: &SqlitePool, entity: &NewMyEntity) -> Result<i64> {
        let id = sqlx::query!(
            "INSERT INTO my_table (name, value) VALUES (?, ?)",
            entity.name,
            entity.value
        )
        .execute(pool)
        .await?
        .last_insert_rowid();

        Ok(id)
    }

    pub async fn find_all(pool: &SqlitePool) -> Result<Vec<MyEntity>> {
        let rows = sqlx::query_as!(MyEntityRow, "SELECT * FROM my_table ORDER BY created_at DESC")
            .fetch_all(pool)
            .await?;

        Ok(rows.into_iter().map(MyEntity::from).collect())
    }

    pub async fn find_by_id(pool: &SqlitePool, id: i64) -> Result<Option<MyEntity>> {
        let row = sqlx::query_as!(MyEntityRow, "SELECT * FROM my_table WHERE id = ?", id)
            .fetch_optional(pool)
            .await?;

        Ok(row.map(MyEntity::from))
    }

    pub async fn delete(pool: &SqlitePool, id: i64) -> Result<bool> {
        let result = sqlx::query!("DELETE FROM my_table WHERE id = ?", id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
```

### 4. Export in mod.rs

Update `src/database/entities/mod.rs`:
```rust
mod my_entity;
pub use my_entity::*;
```

Update `src/database/repositories/mod.rs`:
```rust
mod my_entity_repo;
pub use my_entity_repo::*;
```

### 5. Generate TypeScript Types

Run from project root:
```bash
pnpm generate-types
```

## Database Schema

### Tables

**metrics** - Aggregated OTLP metrics
- Primary metrics data from Claude Code
- Dimensions: model, tool, decision, language
- Indexed by: session_id, name, timestamp, model

**events** - OTLP log events
- Detailed event data (API requests, tool calls, prompts)
- Rich metadata: tokens, cost, duration, errors
- Indexed by: session_id, name, timestamp, tool_name, model

### Views

**sessions** - Aggregated session statistics
- Computed from events table
- Provides: time ranges, counts, token totals, cost totals
- Read-only, automatically updated

## Connection Management

```rust
use lumo_shared::database::{create_pool, run_migrations, get_db_path};

// Get database path (~/.lumo/lumo.db)
let db_path = get_db_path()?;

// Create connection pool
let pool = create_pool(&db_path).await?;

// Run migrations
run_migrations(&pool).await?;
```

Pool configuration:
- Max connections: 5
- WAL journal mode (better concurrent access)
- Busy timeout: 30 seconds

## Error Handling

```rust
use lumo_shared::error::{Error, Result};

// Error variants
pub enum Error {
    Database(sqlx::Error),
    Migration(sqlx::migrate::MigrateError),
    Serialization(serde_json::Error),
    Io(std::io::Error),
    NotFound(String),
    InvalidData(String),
}
```

## Development Commands

```bash
# Check SQL queries at compile time
cargo check -p lumo-shared

# Run with SQLx offline mode (if needed)
cargo sqlx prepare --workspace
```
