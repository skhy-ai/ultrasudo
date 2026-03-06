use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::fs;
use std::path::{Path as StdPath, PathBuf};
use chrono::{DateTime, Utc};
use tower_http::cors::CorsLayer;
use tracing::info;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone)]
struct Notebook {
    id: String,
    title: String,
    cells: Vec<Cell>,
    last_modified: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Clone)]
struct Cell {
    id: String,
    cell_type: String, // "code" or "markdown"
    content: String,
    output: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct NotebookMeta {
    id: String,
    title: String,
    last_modified: DateTime<Utc>,
}

struct AppState {
    storage_dir: PathBuf,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    info!("Starting Skand Python/Data Science Service on port 5007...");

    // Ensure storage directory exists
    let storage_dir = StdPath::new("python_data").to_path_buf();
    if !storage_dir.exists() {
        fs::create_dir_all(&storage_dir).unwrap();
    }

    let state = Arc::new(AppState { storage_dir });

    let app = Router::new()
        .route("/health", get(|| async { Json(HashMap::from([("status", "ok")])) }))
        .route("/api/python/notebooks", get(list_notebooks).post(save_notebook))
        .route("/api/python/notebooks/:id", get(load_notebook).delete(delete_notebook))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:5007").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn list_notebooks(State(state): State<Arc<AppState>>) -> Json<Vec<NotebookMeta>> {
    let mut list = Vec::new();
    if let Ok(entries) = fs::read_dir(&state.storage_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("dsnb") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(nb) = serde_json::from_str::<Notebook>(&content) {
                        list.push(NotebookMeta {
                            id: nb.id,
                            title: nb.title,
                            last_modified: nb.last_modified,
                        });
                    }
                }
            }
        }
    }
    list.sort_by(|a, b| b.last_modified.cmp(&a.last_modified));
    Json(list)
}

#[derive(Deserialize)]
struct SaveRequest {
    id: Option<String>,
    title: String,
    cells: Vec<Cell>,
}

async fn save_notebook(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SaveRequest>,
) -> Result<Json<Notebook>, StatusCode> {
    let id = payload.id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let nb = Notebook {
        id: id.clone(),
        title: payload.title,
        cells: payload.cells,
        last_modified: Utc::now(),
    };

    let file_path = state.storage_dir.join(format!("{}.dsnb", id));
    let content = serde_json::to_string_pretty(&nb).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    fs::write(file_path, content).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(nb))
}

async fn load_notebook(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<Notebook>, StatusCode> {
    let file_path = state.storage_dir.join(format!("{}.dsnb", id));
    if !file_path.exists() {
        return Err(StatusCode::NOT_FOUND);
    }

    let content = fs::read_to_string(file_path).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let nb: Notebook = serde_json::from_str(&content).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(nb))
}

async fn delete_notebook(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<StatusCode, StatusCode> {
    let file_path = state.storage_dir.join(format!("{}.dsnb", id));
    if !file_path.exists() {
        return Err(StatusCode::NOT_FOUND);
    }

    fs::remove_file(file_path).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::NO_CONTENT)
}
