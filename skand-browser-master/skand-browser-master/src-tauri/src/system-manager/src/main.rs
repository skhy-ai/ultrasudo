use axum::{
    extract::{State, Query},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::process::Child;
use tokio::process::Command;
use tokio::signal;
use tokio::sync::RwLock;
use tower_http::services::ServeDir;
use tracing::{error, info};
use walkdir::WalkDir;
use sysinfo::{CpuExt, System, SystemExt};

// Global App State
#[derive(Clone)]
struct AppState {
    data_store: Arc<RwLock<HashMap<String, String>>>,
    network_logs: Arc<RwLock<Vec<NetworkLog>>>,
    services: Arc<RwLock<HashMap<String, ServiceInfo>>>,
}

struct ServiceInfo {
    name: String,
    child: Child,
    service_type: String, // "rust" or "python"
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

#[derive(Serialize)]
struct SystemStats {
    cpu_usage: f32,
    memory_used: u64,
    memory_total: u64,
    services_active: usize,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    info!("Starting Skand System Manager...");

    let mut init_data = HashMap::new();
    if let Ok(data) = std::fs::read_to_string("data.json") {
        if let Ok(parsed) = serde_json::from_str(&data) {
            init_data = parsed;
        }
    }

    let app_state = AppState {
        data_store: Arc::new(RwLock::new(init_data)),
        network_logs: Arc::new(RwLock::new(Vec::new())),
        services: Arc::new(RwLock::new(HashMap::new())),
    };

    // Discovery phase
    let root_dir = Path::new("..");
    let mut services = app_state.services.write().await;
    
    for entry in WalkDir::new(root_dir).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        
        if path.components().any(|c| {
            let s = c.as_os_str().to_string_lossy();
            s.starts_with('.') || s == "venv" || s == "node_modules" || s == "dist" || s == "electron-bkp"
        }) {
            continue;
        }

        // Rust Discovery
        if path.is_file() && path.file_name().unwrap() == "Cargo.toml" {
            let service_dir = path.parent().unwrap();
            let service_name = service_dir.file_name().unwrap().to_string_lossy().to_string();
            
            if service_name == "system-manager" || service_name == "src-tauri" { continue; }

            info!("Discovered Rust Service: {}", service_name);
            if let Ok(child) = Command::new("cargo").arg("run").arg("--release").current_dir(service_dir).spawn() {
                services.insert(service_name.clone(), ServiceInfo { name: service_name, child, service_type: "rust".into() });
            }
        }

        // Python Discovery
        if path.is_file() && path.file_name().unwrap() == "python_service.py" {
            let service_dir = path.parent().unwrap();
            let service_name = service_dir.file_name().unwrap().to_string_lossy().to_string();

            info!("Discovered Python Service: {}", service_name);
            // Assuming python3 is available in PATH
            if let Ok(child) = Command::new("python3").arg("python_service.py").current_dir(service_dir).spawn() {
                services.insert(service_name.clone(), ServiceInfo { name: service_name, child, service_type: "python".into() });
            }
        }
    }
    drop(services);

    let api_routes = Router::new()
        .route("/data", get(get_all_data).post(set_data))
        .route("/network", get(get_network_logs).post(add_network_log))
        .route("/stats", get(get_system_stats))
        .route("/health", get(get_health));

    let app_router = Router::new()
        .nest("/api", api_routes)
        .with_state(app_state.clone())
        .fallback_service(ServeDir::new(root_dir));

    let port = 8000;
    let addr = format!("0.0.0.0:{}", port);
    info!("System Manager API on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();

    axum::serve(listener, app_router)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();

    // Cleanup
    let mut services = app_state.services.write().await;
    for (name, mut info) in services.drain() {
        info!("Stopping {}...", name);
        let _ = info.child.kill().await;
    }
}

async fn get_system_stats(State(state): State<AppState>) -> Json<SystemStats> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    let active_count = state.services.read().await.len();
    
    Json(SystemStats {
        cpu_usage: sys.global_cpu_info().cpu_usage(),
        memory_used: sys.used_memory(),
        memory_total: sys.total_memory(),
        services_active: active_count,
    })
}

async fn get_health(State(state): State<AppState>) -> Json<HashMap<String, String>> {
    let mut services = state.services.write().await;
    let mut report = HashMap::new();
    
    for (name, info) in services.iter_mut() {
        let status = match info.child.try_wait() {
            Ok(None) => "running",
            Ok(Some(_)) => "crashed",
            Err(_) => "error",
        };
        report.insert(name.clone(), status.to_string());
    }
    
    Json(report)
}

async fn get_all_data(State(state): State<AppState>) -> Json<HashMap<String, String>> {
    let store = state.data_store.read().await;
    Json(store.clone())
}

async fn set_data(State(state): State<AppState>, Json(payload): Json<DataPayload>) -> StatusCode {
    let mut store = state.data_store.write().await;
    if payload.value.is_empty() { store.remove(&payload.key); } 
    else { store.insert(payload.key, payload.value); }
    
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

async fn add_network_log(State(state): State<AppState>, Json(log): Json<NetworkLog>) -> StatusCode {
    let mut logs = state.network_logs.write().await;
    logs.push(log);
    if logs.len() > 1000 { logs.remove(0); } // Management limit
    StatusCode::OK
}

async fn shutdown_signal() {
    let ctrl_c = async { signal::ctrl_c().await.expect("failed to install Ctrl+C handler"); };
    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate()).expect("failed to install signal handler").recv().await;
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    tokio::select! { _ = ctrl_c => {}, _ = terminate => {}, }
}
