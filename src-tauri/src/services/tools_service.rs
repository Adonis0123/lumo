//! Tools service
//!
//! Business logic for tool usage analysis.

use anyhow::Result;
use chrono::{Datelike, Local, TimeZone};
use sqlx::SqlitePool;

use crate::types::{CodeEditLanguageStats, TimeRange, ToolTrend, ToolUsageStats};

/// Service for tool analysis operations
pub struct ToolsService;

impl ToolsService {
    /// Get tool usage statistics (frequency, success rate, avg duration)
    pub async fn get_tool_usage_stats(
        pool: &SqlitePool,
        time_range: TimeRange,
    ) -> Result<Vec<ToolUsageStats>> {
        let (start_time, end_time) = Self::get_time_range_bounds(time_range);

        let rows: Vec<ToolUsageRow> = sqlx::query_as(
            r#"
            SELECT
                COALESCE(tool_name, 'unknown') as tool_name,
                COUNT(*) as count,
                COALESCE(SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END), 0) as successes,
                COALESCE(SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END), 0) as failures,
                AVG(duration_ms) as avg_duration_ms
            FROM events
            WHERE timestamp >= ? AND timestamp <= ?
                AND name = 'claude_code.tool_result'
                AND tool_name IS NOT NULL
            GROUP BY tool_name
            ORDER BY count DESC
            "#,
        )
        .bind(start_time)
        .bind(end_time)
        .fetch_all(pool)
        .await?;

        Ok(rows
            .into_iter()
            .map(|r| ToolUsageStats {
                tool_name: r.tool_name,
                count: r.count as i32,
                successes: r.successes as i32,
                failures: r.failures as i32,
                avg_duration_ms: r.avg_duration_ms.map(|v| v as f32),
            })
            .collect())
    }

    /// Get code edit decisions grouped by language
    pub async fn get_code_edit_by_language(
        pool: &SqlitePool,
        time_range: TimeRange,
    ) -> Result<Vec<CodeEditLanguageStats>> {
        let (start_time, end_time) = Self::get_time_range_bounds(time_range);

        let rows: Vec<CodeEditLangRow> = sqlx::query_as(
            r#"
            SELECT
                COALESCE(language, 'unknown') as language,
                COALESCE(SUM(CASE WHEN decision = 'accept' THEN value ELSE 0.0 END), 0.0) as accepts,
                COALESCE(SUM(CASE WHEN decision = 'reject' THEN value ELSE 0.0 END), 0.0) as rejects
            FROM metrics
            WHERE name = 'claude_code.code_edit_tool.decision'
                AND timestamp >= ? AND timestamp <= ?
            GROUP BY language
            ORDER BY (accepts + rejects) DESC
            "#,
        )
        .bind(start_time)
        .bind(end_time)
        .fetch_all(pool)
        .await?;

        Ok(rows
            .into_iter()
            .map(|r| CodeEditLanguageStats {
                language: r.language,
                accepts: r.accepts as i32,
                rejects: r.rejects as i32,
            })
            .collect())
    }

    /// Get tool usage trends (top 5 tools, daily counts)
    pub async fn get_tool_trends(
        pool: &SqlitePool,
        time_range: TimeRange,
    ) -> Result<Vec<ToolTrend>> {
        let (start_time, end_time) = Self::get_time_range_bounds(time_range);

        let rows: Vec<ToolTrendRow> = sqlx::query_as(
            r#"
            SELECT
                COALESCE(tool_name, 'unknown') as tool_name,
                strftime('%Y-%m-%d', datetime(timestamp / 1000, 'unixepoch', 'localtime')) as date,
                COUNT(*) as count
            FROM events
            WHERE timestamp >= ? AND timestamp <= ?
                AND name = 'claude_code.tool_result'
                AND tool_name IN (
                    SELECT tool_name FROM events
                    WHERE timestamp >= ? AND timestamp <= ?
                        AND name = 'claude_code.tool_result'
                        AND tool_name IS NOT NULL
                    GROUP BY tool_name
                    ORDER BY COUNT(*) DESC
                    LIMIT 5
                )
            GROUP BY tool_name, date
            ORDER BY date ASC, count DESC
            "#,
        )
        .bind(start_time)
        .bind(end_time)
        .bind(start_time)
        .bind(end_time)
        .fetch_all(pool)
        .await?;

        Ok(rows
            .into_iter()
            .map(|r| ToolTrend {
                tool_name: r.tool_name,
                date: r.date,
                count: r.count as i32,
            })
            .collect())
    }

    fn get_time_range_bounds(time_range: TimeRange) -> (i64, i64) {
        let now = Local::now();
        let end_time = now.timestamp_millis();

        let start = match time_range {
            TimeRange::Today => now.date_naive().and_hms_opt(0, 0, 0).unwrap(),
            TimeRange::Week => {
                let days_since_monday = now.weekday().num_days_from_monday() as i64;
                (now - chrono::Duration::days(days_since_monday))
                    .date_naive()
                    .and_hms_opt(0, 0, 0)
                    .unwrap()
            }
            TimeRange::Month => now
                .date_naive()
                .with_day(1)
                .unwrap()
                .and_hms_opt(0, 0, 0)
                .unwrap(),
        };

        let start_time = Local.from_local_datetime(&start).unwrap().timestamp_millis();
        (start_time, end_time)
    }
}

#[derive(Debug, sqlx::FromRow)]
struct ToolUsageRow {
    tool_name: String,
    count: i64,
    successes: i64,
    failures: i64,
    avg_duration_ms: Option<f64>,
}

#[derive(Debug, sqlx::FromRow)]
struct CodeEditLangRow {
    language: String,
    accepts: f64,
    rejects: f64,
}

#[derive(Debug, sqlx::FromRow)]
struct ToolTrendRow {
    tool_name: String,
    date: String,
    count: i64,
}
