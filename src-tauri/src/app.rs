use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, WebviewBuilder, Position, Size, Emitter, PhysicalPosition, PhysicalSize};
use serde::Deserialize;
use url::Url;

#[derive(Deserialize)]
struct WebviewRect {
    x: u32,
    y: u32,
    width: u32,
    height: u32,
}

#[tauri::command]
fn read_data(app: AppHandle) -> Result<HashMap<String, String>, String> {
    let mut data = HashMap::new();
    let file_path = get_data_path(&app);
    if let Ok(contents) = fs::read_to_string(&file_path) {
        if let Ok(parsed) = serde_json::from_str(&contents) {
            data = parsed;
        }
    }
    Ok(data)
}

#[tauri::command]
fn write_data(app: AppHandle, key: String, value: String) -> Result<(), String> {
    let mut data = read_data(app.clone()).unwrap_or_default();
    data.insert(key, value);
    let file_path = get_data_path(&app);
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&file_path, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn create_tab(app: AppHandle, id: String, url: String, rect: WebviewRect) -> Result<(), String> {
    let main_window = app.get_window("main").ok_or("Main window not found")?;
    
    let pos = Position::Physical(PhysicalPosition { x: rect.x as i32, y: rect.y as i32 });
    let size = Size::Physical(PhysicalSize { width: rect.width, height: rect.height });

    let builder = WebviewBuilder::new(&id, tauri::WebviewUrl::App(url.into()))
        .on_page_load(move |webview, payload| {
            let _ = webview.emit("webview-url-changed", (webview.label().to_string(), payload.url().to_string()));
        })
        .initialization_script(r#"
            (function() {
                // Intercept _blank links
                document.addEventListener('click', (e) => {
                    const link = e.target.closest('a');
                    if (link && (link.target === '_blank' || e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        window.__TAURI__.event.emit('new-tab-requested', link.href);
                    }
                }, true);

                // Title observer
                const target = document.querySelector('title');
                if (target) {
                    const observer = new MutationObserver(() => {
                        window.__TAURI__.event.emit('webview-title-changed', [window.__TAURI__.core.label, document.title]);
                    });
                    observer.observe(target, { subtree: true, characterData: true, childList: true });
                }
                // Also emit initial title
                window.__TAURI__.event.emit('webview-title-changed', [window.__TAURI__.core.label, document.title]);
            })();
        "#);
    
    main_window.add_child(builder, pos, size).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
fn switch_tab(app: AppHandle, active_id: String, all_ids: Vec<String>) -> Result<(), String> {
    for id in all_ids {
        if let Some(webview) = app.get_webview(&id) {
            if id == active_id {
                webview.show().map_err(|e| e.to_string())?;
                webview.set_focus().map_err(|e| e.to_string())?;
            } else {
                webview.hide().map_err(|e| e.to_string())?;
            }
        }
    }
    Ok(())
}

#[tauri::command]
fn close_tab(app: AppHandle, id: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&id) {
        webview.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn resize_tabs(app: AppHandle, ids: Vec<String>, rect: WebviewRect) -> Result<(), String> {
    for id in ids {
        if let Some(webview) = app.get_webview(&id) {
            let _ = webview.set_size(Size::Physical(PhysicalSize {
                width: rect.width,
                height: rect.height,
            }));
            let _ = webview.set_position(Position::Physical(PhysicalPosition {
                x: rect.x as i32,
                y: rect.y as i32,
            }));
        }
    }
    Ok(())
}

#[tauri::command]
fn navigate_tab(app: AppHandle, id: String, url: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&id) {
        let url_parsed = Url::parse(&url).map_err(|e: url::ParseError| e.to_string())?;
        webview.navigate(url_parsed).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn go_back(app: AppHandle, id: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&id) {
        webview.eval("window.history.back()").map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn go_forward(app: AppHandle, id: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&id) {
        webview.eval("window.history.forward()").map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn reload_tab(app: AppHandle, id: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&id) {
        webview.reload().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn evaluate_js(app: AppHandle, id: String, js: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&id) {
        webview.eval(&js).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn execute_cli(command: String, args: Vec<String>) -> Result<String, String> {
    let output = std::process::Command::new(command)
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

fn get_data_path(app: &AppHandle) -> PathBuf {
    app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from(".")).join("data.json")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            read_data, 
            write_data, 
            create_tab, 
            switch_tab, 
            close_tab,
            resize_tabs,
            navigate_tab,
            go_back,
            go_forward,
            reload_tab,
            evaluate_js,
            execute_cli
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


