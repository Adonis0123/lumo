//! Wrapped types
//!
//! Types for the personal report card (Wrapped) feature.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

/// Period filter for wrapped data
#[typeshare]
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum WrappedPeriod {
    Today,
    Week,
    Month,
    All,
}

/// Token consumption breakdown
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenBreakdown {
    pub input_tokens: i32,
    pub output_tokens: i32,
    pub cache_read_tokens: i32,
    pub cache_creation_tokens: i32,
}

/// Aggregated wrapped data for all cards
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WrappedData {
    pub total_sessions: i32,
    pub total_active_hours: f32,
    pub total_cost: f32,
    pub total_tokens: i32,
    pub top_model: String,
    pub top_model_percentage: f32,
    pub top_tool: String,
    pub top_tool_count: i32,
    pub longest_streak_days: i32,
    pub peak_hour: i32,
    pub peak_hour_label: String,
    pub token_breakdown: TokenBreakdown,
    pub daily_avg_cost: f32,
    pub cost_sparkline: Vec<f32>,
}
