use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::process::Command;
use tokio::signal;
use tokio::sync::RwLock;
use tower_http::services::ServeDir;
use tracing::{error, info};
use walkdir::WalkDir;

// Global App State
#[derive(Default, Clone)]
struct AppState {
    // Key-Value data store replacing LocalStorage data-manager sync logs
    data_store: Arc<RwLock<HashMap<String, String>>>,
    // Traffic logs replacing network-manager arrays
    network_logs: Arc<RwLock<Vec<NetworkLog>>>,
}

#[derive(Serialize, Deserialize, Clone)]
struct NetworkLog {
    timestamp: u64,
    method: String,
    url: String,
    status: u16,
    duration: u64,
    size: u64,
    #[serde(rename = "type")]
    log_type: String,
}

#[derive(Serialize, Deserialize)]
struct DataPayload {
    key: String,
    value: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    info!("Starting Skand System Manager...");

    // Load persisted data if available
    let mut init_data = HashMap::new();
    if let Ok(data) = std::fs::read_to_string("data.json") {
        if let Ok(parsed) = serde_json::from_str(&data) {
            init_data = parsed;
        }
    }

    let app_state = AppState {
        data_store: Arc::new(RwLock::new(init_data)),
        network_logs: Arc::new(RwLock::new(Vec::new())),
    };

    // 1. Discover and start Rust background services
    let mut child_processes = Vec::new();
    let root_dir = Path::new("..");
    
    for entry in WalkDir::new(root_dir).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        
        if path.components().any(|c| {
            let s = c.as_os_str().to_string_lossy();
            s.starts_with('.') || s == "venv" || s == "node_modules" || s == "dist"
        }) {
            continue;
        }

        if path.is_file() && path.file_name().unwrap() == "Cargo.toml" {
            let service_dir = path.parent().unwrap();
            let service_name = service_dir.file_name().unwrap().to_string_lossy();
            
            if service_name == "system-manager" {
                continue;
            }

            info!("Found Native Rust Backend Service: {}", service_name);

            match Command::new("cargo")
                .arg("run")
                .arg("--release")
                .current_dir(service_dir)
                .spawn()
            {
                Ok(child) => {
                    info!("Successfully booted Rust service: {}", service_name);
                    child_processes.push((service_name.into_owned(), child));
                }
                Err(e) => {
                    error!("Failed to spawn Rust service {}: {}", service_name, e);
                }
            }
        }
    }

    // 2. Setup Axum REST API and Static File Server
    let api_routes = Router::new()
        .route("/data", get(get_all_data).post(set_data))
        .route("/network", get(get_network_logs).post(add_network_log))
        // The cache API can be expanded later
        .route("/cache", get(|| async { Json(vec!["Status: Online"]) }));

    let app_router = Router::new()
        .nest("/api", api_routes)
        .with_state(app_state)
        .fallback_service(ServeDir::new(root_dir));

    let port = 8000;
    let addr = format!("0.0.0.0:{}", port);
    info!("Starting static file server on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();

    axum::serve(listener, app_router)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();

    // 3. Graceful Shutdown
    info!("Shutting down System Manager. Cleaning up processes...");
    for (name, mut child) in child_processes {
        info!("Terminating service: {}", name);
        let _ = child.kill().await;
    }
    info!("Shutdown complete.");
}

// --- API Handlers ---

async fn get_all_data(State(state): State<AppState>) -> Json<HashMap<String, String>> {
    let store = state.data_store.read().await;
    Json(store.clone())
}

async fn set_data(
    State(state): State<AppState>,
    Json(payload): Json<DataPayload>,
) -> StatusCode {
    let mut store = state.data_store.write().await;
    
    if payload.value.is_empty() {
        store.remove(&payload.key);
    } else {
        store.insert(payload.key, payload.value);
    }

    // Save state to disk to persist across system boots
    let store_clone = store.clone();
    tokio::spawn(async move {
        if let Ok(json) = serde_json::to_string(&store_clone) {
            let _ = tokio::fs::write("data.json", json).await;
        }
    });

    StatusCode::OK
}

async fn get_network_logs(State(state): State<AppState>) -> Json<Vec<NetworkLog>> {
    let logs = state.network_logs.read().await;
    Json(logs.clone())
}

async fn add_network_log(
    State(state): State<AppState>,
    Json(log): Json<NetworkLog>,
) -> StatusCode {
    let mut logs = state.network_logs.write().await;
    logs.push(log);
    // Keep only the last 100 to prevent memory blowup
    if logs.len() > 100 {
        logs.remove(0);
    }
    StatusCode::OK
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}
