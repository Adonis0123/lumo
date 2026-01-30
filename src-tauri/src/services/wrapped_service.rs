//! Wrapped service
//!
//! Business logic for the personal report card (Wrapped) feature.

use anyhow::Result;
use chrono::{Datelike, Local, NaiveDate, TimeZone};
use sqlx::SqlitePool;

use crate::types::{format_model_display_name, LanguageRank, WrappedData, WrappedPeriod};

/// Service for wrapped report operations
pub struct WrappedService;

impl WrappedService {
    /// Get all wrapped data for a period
    pub async fn get_wrapped_data(
        pool: &SqlitePool,
        period: WrappedPeriod,
    ) -> Result<WrappedData> {
        let (start_time, end_time) = Self::get_period_bounds(period);

        // Sessions stats
        let session_stats = Self::get_session_stats(pool, start_time, end_time).await?;

        // Top model
        let (top_model, top_model_pct) =
            Self::get_top_model(pool, start_time, end_time).await?;

        // Top tool
        let (top_tool, top_tool_count) =
            Self::get_top_tool(pool, start_time, end_time).await?;

        // Longest streak
        let longest_streak = Self::get_longest_streak(pool, start_time, end_time).await?;

        // Peak hour
        let (peak_hour, peak_hour_label) =
            Self::get_peak_hour(pool, start_time, end_time).await?;

        // Top languages
        let top_languages = Self::get_top_languages(pool, start_time, end_time).await?;

        // Cost sparkline (daily costs)
        let cost_sparkline = Self::get_cost_sparkline(pool, start_time, end_time).await?;

        let days = ((end_time - start_time) as f64 / (86400.0 * 1000.0)).max(1.0);
        let daily_avg_cost = session_stats.total_cost / days as f32;

        Ok(WrappedData {
            total_sessions: session_stats.total_sessions,
            total_active_hours: session_stats.total_duration_ms as f32 / 3_600_000.0,
            total_cost: session_stats.total_cost,
            total_tokens: session_stats.total_tokens,
            top_model,
            top_model_percentage: top_model_pct,
            top_tool,
            top_tool_count,
            longest_streak_days: longest_streak,
            peak_hour,
            peak_hour_label,
            top_languages,
            daily_avg_cost,
            cost_sparkline,
        })
    }

    async fn get_session_stats(
        pool: &SqlitePool,
        start_time: i64,
        end_time: i64,
    ) -> Result<SessionAgg> {
        let row: Option<SessionAggRow> = sqlx::query_as(
            r#"
            SELECT
                COUNT(*) as total_sessions,
                COALESCE(SUM(duration_ms), 0) as total_duration_ms,
                COALESCE(SUM(total_cost_usd), 0.0) as total_cost,
                COALESCE(SUM(total_input_tokens + total_output_tokens), 0) as total_tokens
            FROM sessions
            WHERE start_time >= ? AND start_time <= ?
            "#,
        )
        .bind(start_time)
        .bind(end_time)
        .fetch_optional(pool)
        .await?;

        Ok(row
            .map(|r| SessionAgg {
                total_sessions: r.total_sessions as i32,
                total_duration_ms: r.total_duration_ms,
                total_cost: r.total_cost as f32,
                total_tokens: r.total_tokens as i32,
            })
            .unwrap_or_default())
    }

    async fn get_top_model(
        pool: &SqlitePool,
        start_time: i64,
        end_time: i64,
    ) -> Result<(String, f32)> {
        let row: Option<TopModelRow> = sqlx::query_as(
            r#"
            SELECT
                COALESCE(model, 'unknown') as model,
                COUNT(*) as count
            FROM events
            WHERE timestamp >= ? AND timestamp <= ?
                AND name = 'claude_code.api_request'
                AND model IS NOT NULL
            GROUP BY model
            ORDER BY count DESC
            LIMIT 1
            "#,
        )
        .bind(start_time)
        .bind(end_time)
        .fetch_optional(pool)
        .await?;

        let total: Option<CountRow> = sqlx::query_as(
            r#"
            SELECT COUNT(*) as count
            FROM events
            WHERE timestamp >= ? AND timestamp <= ?
                AND name = 'claude_code.api_request'
            "#,
        )
        .bind(start_time)
        .bind(end_time)
        .fetch_optional(pool)
        .await?;

        let total_count = total.map(|r| r.count).unwrap_or(1).max(1);

        match row {
            Some(r) => {
                let pct = (r.count as f32 / total_count as f32) * 100.0;
                Ok((format_model_display_name(&r.model), pct))
            }
            None => Ok(("Unknown".to_string(), 0.0)),
        }
    }

    async fn get_top_tool(
        pool: &SqlitePool,
        start_time: i64,
        end_time: i64,
    ) -> Result<(String, i32)> {
        let row: Option<TopToolRow> = sqlx::query_as(
            r#"
            SELECT
                COALESCE(tool_name, 'unknown') as tool_name,
                COUNT(*) as count
            FROM events
            WHERE timestamp >= ? AND timestamp <= ?
                AND name = 'claude_code.tool_result'
                AND tool_name IS NOT NULL
            GROUP BY tool_name
            ORDER BY count DESC
            LIMIT 1
            "#,
        )
        .bind(start_time)
        .bind(end_time)
        .fetch_optional(pool)
        .await?;

        match row {
            Some(r) => Ok((r.tool_name, r.count as i32)),
            None => Ok(("None".to_string(), 0)),
        }
    }

    async fn get_longest_streak(
        pool: &SqlitePool,
        start_time: i64,
        end_time: i64,
    ) -> Result<i32> {
        let rows: Vec<DateRow> = sqlx::query_as(
            r#"
            SELECT DISTINCT
                strftime('%Y-%m-%d', datetime(start_time / 1000, 'unixepoch', 'localtime')) as date
            FROM sessions
            WHERE start_time >= ? AND start_time <= ?
            ORDER BY date ASC
            "#,
        )
        .bind(start_time)
        .bind(end_time)
        .fetch_all(pool)
        .await?;

        if rows.is_empty() {
            return Ok(0);
        }

        let dates: Vec<NaiveDate> = rows
            .iter()
            .filter_map(|r| NaiveDate::parse_from_str(&r.date, "%Y-%m-%d").ok())
            .collect();

        let mut max_streak = 1;
        let mut current_streak = 1;

        for i in 1..dates.len() {
            if dates[i].signed_duration_since(dates[i - 1]).num_days() == 1 {
                current_streak += 1;
                max_streak = max_streak.max(current_streak);
            } else {
                current_streak = 1;
            }
        }

        Ok(max_streak)
    }

    async fn get_peak_hour(
        pool: &SqlitePool,
        start_time: i64,
        end_time: i64,
    ) -> Result<(i32, String)> {
        let row: Option<HourRow> = sqlx::query_as(
            r#"
            SELECT
                CAST(strftime('%H', datetime(timestamp / 1000, 'unixepoch', 'localtime')) AS INTEGER) as hour,
                COUNT(*) as count
            FROM events
            WHERE timestamp >= ? AND timestamp <= ?
                AND name = 'claude_code.api_request'
            GROUP BY hour
            ORDER BY count DESC
            LIMIT 1
            "#,
        )
        .bind(start_time)
        .bind(end_time)
        .fetch_optional(pool)
        .await?;

        match row {
            Some(r) => {
                let label = if r.hour >= 5 && r.hour < 12 {
                    format!("Early Bird — Peak at {:02}:00", r.hour)
                } else if r.hour >= 12 && r.hour < 18 {
                    format!("Afternoon Coder — Peak at {:02}:00", r.hour)
                } else if r.hour >= 18 && r.hour < 22 {
                    format!("Evening Warrior — Peak at {:02}:00", r.hour)
                } else {
                    format!("Night Owl — Peak at {:02}:00", r.hour)
                };
                Ok((r.hour as i32, label))
            }
            None => Ok((0, "No data".to_string())),
        }
    }

    async fn get_top_languages(
        pool: &SqlitePool,
        start_time: i64,
        end_time: i64,
    ) -> Result<Vec<LanguageRank>> {
        let rows: Vec<LangRow> = sqlx::query_as(
            r#"
            SELECT
                COALESCE(language, 'unknown') as language,
                CAST(SUM(value) AS INTEGER) as count
            FROM metrics
            WHERE name = 'claude_code.code_edit_tool.decision'
                AND timestamp >= ? AND timestamp <= ?
                AND language IS NOT NULL
            GROUP BY language
            ORDER BY count DESC
            LIMIT 5
            "#,
        )
        .bind(start_time)
        .bind(end_time)
        .fetch_all(pool)
        .await?;

        Ok(rows
            .into_iter()
            .map(|r| LanguageRank {
                language: r.language,
                count: r.count as i32,
            })
            .collect())
    }

    async fn get_cost_sparkline(
        pool: &SqlitePool,
        start_time: i64,
        end_time: i64,
    ) -> Result<Vec<f32>> {
        let rows: Vec<DailyCostRow> = sqlx::query_as(
            r#"
            SELECT
                strftime('%Y-%m-%d', datetime(timestamp / 1000, 'unixepoch', 'localtime')) as date,
                COALESCE(SUM(cost_usd), 0.0) as cost
            FROM events
            WHERE timestamp >= ? AND timestamp <= ?
                AND name = 'claude_code.api_request'
            GROUP BY date
            ORDER BY date ASC
            "#,
        )
        .bind(start_time)
        .bind(end_time)
        .fetch_all(pool)
        .await?;

        Ok(rows.into_iter().map(|r| r.cost as f32).collect())
    }

    fn get_period_bounds(period: WrappedPeriod) -> (i64, i64) {
        let now = Local::now();
        let end_time = now.timestamp_millis();

        let start = match period {
            WrappedPeriod::Month => now
                .date_naive()
                .with_day(1)
                .unwrap()
                .and_hms_opt(0, 0, 0)
                .unwrap(),
            WrappedPeriod::All => {
                // Go back 10 years as "all time"
                NaiveDate::from_ymd_opt(2020, 1, 1)
                    .unwrap()
                    .and_hms_opt(0, 0, 0)
                    .unwrap()
            }
        };

        let start_time = Local
            .from_local_datetime(&start)
            .unwrap()
            .timestamp_millis();
        (start_time, end_time)
    }
}

#[derive(Debug, sqlx::FromRow)]
struct SessionAggRow {
    total_sessions: i64,
    total_duration_ms: i64,
    total_cost: f64,
    total_tokens: i64,
}

#[derive(Debug, Default)]
struct SessionAgg {
    total_sessions: i32,
    total_duration_ms: i64,
    total_cost: f32,
    total_tokens: i32,
}

#[derive(Debug, sqlx::FromRow)]
struct TopModelRow {
    model: String,
    count: i64,
}

#[derive(Debug, sqlx::FromRow)]
struct CountRow {
    count: i64,
}

#[derive(Debug, sqlx::FromRow)]
struct TopToolRow {
    tool_name: String,
    count: i64,
}

#[derive(Debug, sqlx::FromRow)]
struct DateRow {
    date: String,
}

#[derive(Debug, sqlx::FromRow)]
struct HourRow {
    hour: i64,
    count: i64,
}

#[derive(Debug, sqlx::FromRow)]
struct LangRow {
    language: String,
    count: i64,
}

#[derive(Debug, sqlx::FromRow)]
struct DailyCostRow {
    #[allow(dead_code)]
    date: String,
    cost: f64,
}
