use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use yahoo_finance_api as yahoo;
use chrono::{DateTime, Utc};
use tower_http::cors::CorsLayer;
use tracing::info;

struct AppState {
    provider: yahoo::YahooConnector,
}

#[derive(Serialize, Deserialize)]
struct HistoryPoint {
    date: String,
    close: f64,
}

#[derive(Serialize, Deserialize)]
struct Overview {
    price: Option<f64>,
    #[serde(rename = "PERatio")]
    pe_ratio: Option<f64>,
    #[serde(rename = "52WeekHigh")]
    high_52w: Option<f64>,
    #[serde(rename = "52WeekLow")]
    low_52w: Option<f64>,
    updated: Option<String>,
}

#[derive(Deserialize)]
struct IndQuery {
    ind: Option<String>,
    #[serde(default = "default_period")]
    period: String,
    #[serde(default = "default_interval")]
    interval: String,
}

fn default_period() -> String { "6mo".into() }
fn default_interval() -> String { "1d".into() }

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    info!("Starting Skand Financial Service on port 5005...");

    let state = AppState {
        provider: yahoo::YahooConnector::new().unwrap(),
    };

    let app = Router::new()
        .route("/health", get(|| async { Json(HashMap::from([("status", "ok")])) }))
        .route("/history/:symbol", get(get_history))
        .route("/overview/:symbol", get(get_overview))
        .route("/indicators/:symbol", get(get_indicators))
        .route("/universe/:market", get(get_universe))
        .layer(CorsLayer::permissive())
        .with_state(Arc::new(state));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:5005").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn get_history(
    State(state): State<Arc<AppState>>,
    Path(symbol): Path<String>,
) -> Result<Json<Vec<HistoryPoint>>, StatusCode> {
    let response = state.provider.get_quote_range(&symbol, "1d", "6mo")
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let quotes = response.quotes().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let history = quotes.into_iter().map(|q| {
        let dt = DateTime::<Utc>::from_timestamp(q.timestamp as i64, 0).unwrap();
        HistoryPoint {
            date: dt.format("%Y-%m-%d").to_string(),
            close: q.close,
        }
    }).collect();

    Ok(Json(history))
}

async fn get_overview(
    State(state): State<Arc<AppState>>,
    Path(symbol): Path<String>,
) -> Result<Json<Overview>, StatusCode> {
    let response = state.provider.get_latest_quotes(&symbol, "1d")
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let quote = response.last_quote().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // Yahoo connector doesn't provide full fundamental info like PE in the basic quote
    // In a real scenario, we might need to scrape or use a different endpoint
    // For now, we'll return what we have (price and updated date)
    
    let dt = DateTime::<Utc>::from_timestamp(quote.timestamp as i64, 0).unwrap();

    Ok(Json(Overview {
        price: Some(quote.close),
        pe_ratio: None, // Requires more complex fundamental fetching
        high_52w: None,
        low_52w: None,
        updated: Some(dt.format("%Y-%m-%d").to_string()),
    }))
}

async fn get_indicators(
    State(state): State<Arc<AppState>>,
    Path(symbol): Path<String>,
    Query(params): Query<IndQuery>,
) -> Result<Json<HashMap<String, Option<f64>>>, StatusCode> {
    let response = state.provider.get_quote_range(&symbol, &params.interval, &params.period)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let quotes = response.quotes().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let closes: Vec<f64> = quotes.iter().map(|q| q.close).collect();
    
    let mut results = HashMap::new();
    let requested = params.ind.unwrap_or_default().to_uppercase();
    let inds: Vec<&str> = requested.split(',').collect();

    if inds.contains(&"SMA20") && closes.len() >= 20 {
        let sum: f64 = closes.iter().rev().take(20).sum();
        results.insert("SMA20".into(), Some(sum / 20.0));
    }

    if inds.contains(&"RSI") && closes.len() >= 14 {
        // Simple RSI calc
        let mut gains = 0.0;
        let mut losses = 0.0;
        for i in (closes.len() - 14)..(closes.len() - 1) {
            let diff = closes[i+1] - closes[i];
            if diff > 0.0 { gains += diff; } else { losses -= diff; }
        }
        let rs = if losses == 0.0 { 100.0 } else { gains / losses };
        results.insert("RSI".into(), Some(100.0 - (100.0 / (1.0 + rs))));
    }

    Ok(Json(results))
}

async fn get_universe(Path(market): Path<String>) -> Json<HashMap<String, Vec<String>>> {
    let m = market.to_uppercase();
    let mut data = HashMap::new();

    if m == "US" {
        data.insert("Technology".into(), vec!["AAPL".into(), "MSFT".into(), "NVDA".into(), "GOOGL".into()]);
        data.insert("Financials".into(), vec!["JPM".into(), "BAC".into(), "GS".into()]);
    } else if m == "IN" {
        data.insert("Technology".into(), vec!["TCS.NS".into(), "INFY.NS".into(), "WIPRO.NS".into()]);
        data.insert("Financials".into(), vec!["HDFCBANK.NS".into(), "ICICIBANK.NS".into()]);
    }

    Json(data)
}
