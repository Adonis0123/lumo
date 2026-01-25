# Tauri Backend Module

The Tauri backend provides the desktop application shell with native OS integration, IPC command handlers, and local database management.

## Architecture

The Tauri app follows a command-based architecture for frontend-backend communication:

```
Frontend (React) → invoke() → Commands → Repositories → SQLite
```

### Key Components

1. **Commands** (`src/commands/`): IPC handlers exposed to frontend
2. **Entities** (`src/database/entities/`): Data models with typeshare
3. **Repositories** (`src/database/repositories/`): Database access layer
4. **Connection** (`src/database/connection.rs`): Pool setup and migrations

## Directory Structure

```
src/
├── main.rs              # Entry point with Tokio runtime
├── lib.rs               # Tauri app setup, plugin registration
├── commands/
│   ├── mod.rs           # app_commands! macro
│   └── user_commands.rs # User CRUD commands
└── database/
    ├── mod.rs           # Database module setup
    ├── connection.rs    # Pool creation, migrations
    ├── entities/
    │   ├── mod.rs
    │   └── user_entity.rs
    └── repositories/
        ├── mod.rs
        └── user_repo.rs

migrations/
└── *.sql                # SQLx migration files
```

## Command Pattern

Commands are the IPC bridge between frontend and backend:

```rust
use sqlx::SqlitePool;
use tauri::{command, AppHandle, Manager};

#[command]
pub async fn get_all_users(app_handle: AppHandle) -> Result<Vec<User>, String> {
    let pool = app_handle.state::<SqlitePool>();
    UserRepository::find_all(&pool)
        .await
        .map_err(|e| e.to_string())
}
```

### Command Conventions

- Always async (`pub async fn`)
- First parameter: `app_handle: AppHandle` for state access
- Return `Result<T, String>` for serialization
- Access pool via `app_handle.state::<SqlitePool>()`
- Delegate to repository methods

## Adding New Functionality

### 1. Create Entity

```rust
// src/database/entities/session_entity.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use typeshare::typeshare;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
#[typeshare]
pub struct Session {
    pub id: String,
    pub start_time: i64,
    pub end_time: Option<i64>,
    pub total_tokens: i64,
    pub total_cost: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[typeshare]
pub struct SessionFilter {
    pub start_date: Option<i64>,
    pub end_date: Option<i64>,
}
```

### 2. Create Repository

```rust
// src/database/repositories/session_repo.rs
use sqlx::SqlitePool;
use crate::database::entities::{Session, SessionFilter};

pub struct SessionRepository;

impl SessionRepository {
    pub async fn find_all(pool: &SqlitePool) -> anyhow::Result<Vec<Session>> {
        let sessions = sqlx::query_as!(Session, "SELECT * FROM sessions ORDER BY start_time DESC")
            .fetch_all(pool)
            .await?;
        Ok(sessions)
    }

    pub async fn find_by_filter(
        pool: &SqlitePool,
        filter: SessionFilter
    ) -> anyhow::Result<Vec<Session>> {
        // Build dynamic query based on filter
    }
}
```

### 3. Create Commands

```rust
// src/commands/session_commands.rs
use sqlx::SqlitePool;
use tauri::{command, AppHandle, Manager};
use crate::database::{entities::Session, repositories::SessionRepository};

#[command]
pub async fn get_sessions(app_handle: AppHandle) -> Result<Vec<Session>, String> {
    let pool = app_handle.state::<SqlitePool>();
    SessionRepository::find_all(&pool)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_session_by_id(
    app_handle: AppHandle,
    id: String
) -> Result<Option<Session>, String> {
    let pool = app_handle.state::<SqlitePool>();
    SessionRepository::find_by_id(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}
```

### 4. Register Commands

Update `src/commands/mod.rs`:

```rust
pub mod user_commands;
pub mod session_commands;  // Add this

pub use user_commands::*;
pub use session_commands::*;  // Add this

#[macro_export]
macro_rules! app_commands {
    () => {
        tauri::generate_handler![
            // User commands
            commands::get_all_users,
            commands::get_user_by_id,
            commands::create_user,
            commands::update_user,
            commands::delete_user,
            // Session commands - Add these
            commands::get_sessions,
            commands::get_session_by_id,
        ]
    };
}
```

### 5. Generate TypeScript Types

```bash
pnpm generate-types
```

### 6. Create Frontend Bridge

See `components/CLAUDE.md` for frontend integration.

## Database Setup

Database initialization happens in `lib.rs`:

```rust
.setup(|app| {
    let app_handle = app.handle().clone();
    tokio::spawn(async move {
        if let Err(e) = database::setup(&app_handle).await {
            eprintln!("Failed to initialize database: {}", e);
        }
    });
    Ok(())
})
```

The pool is stored in Tauri's managed state for access in commands.

## Frontend Integration

Commands are invoked from frontend via Tauri's `invoke`:

```typescript
// src/bridges/session-bridge.ts
import { invoke } from "@tauri-apps/api/core";
import type { Session, SessionFilter } from "@/generated/typeshare-types";

export class SessionBridge {
  static async getSessions(): Promise<Session[]> {
    return invoke("get_sessions");
  }

  static async getSessionById(id: string): Promise<Session | null> {
    return invoke("get_session_by_id", { id });
  }
}
```

## Development Commands

```bash
# Run Tauri in development (includes Next.js)
pnpm tauri:dev

# Build production app
pnpm tauri build

# Generate TypeScript types from Rust
pnpm generate-types
```

## State Management

- `SqlitePool`: Database connection pool (managed state)
- Access in commands: `app_handle.state::<SqlitePool>()`
- Plugins: `tauri-plugin-log` for debug logging

## Error Handling

Commands return `Result<T, String>` for frontend compatibility:

```rust
#[command]
pub async fn some_command(app_handle: AppHandle) -> Result<Data, String> {
    do_something()
        .await
        .map_err(|e| e.to_string())  // Convert any error to String
}
```

For more structured errors, define error types with Serialize:

```rust
#[derive(Debug, Serialize)]
pub enum CommandError {
    NotFound(String),
    DatabaseError(String),
    ValidationError(String),
}
```
