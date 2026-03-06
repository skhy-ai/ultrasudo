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
struct Note {
    id: String,
    title: String,
    content: String,
    last_modified: DateTime<Utc>,
}

#[derive(Serialize, Deserialize)]
struct NoteMeta {
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
    info!("Starting Skand Notebook Service on port 5006...");

    // Ensure storage directory exists
    let storage_dir = StdPath::new("notes_data").to_path_buf();
    if !storage_dir.exists() {
        fs::create_dir_all(&storage_dir).unwrap();
    }

    let state = Arc::new(AppState { storage_dir });

    let app = Router::new()
        .route("/health", get(|| async { Json(HashMap::from([("status", "ok")])) }))
        .route("/api/notes", get(list_notes).post(save_note))
        .route("/api/notes/:id", get(load_note).delete(delete_note))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:5006").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn list_notes(State(state): State<Arc<AppState>>) -> Json<Vec<NoteMeta>> {
    let mut notes = Vec::new();
    if let Ok(entries) = fs::read_dir(&state.storage_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("nb") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(note) = serde_json::from_str::<Note>(&content) {
                        notes.push(NoteMeta {
                            id: note.id,
                            title: note.title,
                            last_modified: note.last_modified,
                        });
                    }
                }
            }
        }
    }
    notes.sort_by(|a, b| b.last_modified.cmp(&a.last_modified));
    Json(notes)
}

#[derive(Deserialize)]
struct SaveNoteRequest {
    id: Option<String>,
    title: String,
    content: String,
}

async fn save_note(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SaveNoteRequest>,
) -> Result<Json<Note>, StatusCode> {
    let id = payload.id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let note = Note {
        id: id.clone(),
        title: payload.title,
        content: payload.content,
        last_modified: Utc::now(),
    };

    let file_path = state.storage_dir.join(format!("{}.nb", id));
    let content = serde_json::to_string_pretty(&note).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    fs::write(file_path, content).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(note))
}

async fn load_note(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<Note>, StatusCode> {
    let file_path = state.storage_dir.join(format!("{}.nb", id));
    if !file_path.exists() {
        return Err(StatusCode::NOT_FOUND);
    }

    let content = fs::read_to_string(file_path).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let note: Note = serde_json::from_str(&content).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(note))
}

async fn delete_note(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<StatusCode, StatusCode> {
    let file_path = state.storage_dir.join(format!("{}.nb", id));
    if !file_path.exists() {
        return Err(StatusCode::NOT_FOUND);
    }

    fs::remove_file(file_path).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::NO_CONTENT)
}
