//! Route definitions
//!
//! Organizes routes by functionality.

mod health;
mod otlp;

pub use health::health_routes;
pub use otlp::otlp_routes;
