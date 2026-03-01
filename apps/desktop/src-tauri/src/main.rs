// Prevents additional console window on Windows in release mode
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder},
    Manager, State, WindowEvent,
};

// Application state
struct AppState {
    services: Mutex<Vec<Service>>,
}

struct Service {
    name: String,
    status: String,
    pid: Option<u32>,
}

// Window control commands
#[tauri::command]
async fn minimize_window(window: tauri::Window) {
    let _ = window.minimize();
}

#[tauri::command]
async fn maximize_window(window: tauri::Window) {
    if window.is_maximized().unwrap_or(false) {
        let _ = window.unmaximize();
    } else {
        let _ = window.maximize();
    }
}

#[tauri::command]
async fn close_window(window: tauri::Window) {
    let _ = window.close();
}

// Service management commands
#[tauri::command]
async fn start_service(state: State<'_, AppState>, name: String) -> Result<(bool, Option<u32>), String> {
    let mut services = state.services.lock().map_err(|e| e.to_string())?;
    
    if let Some(service) = services.iter_mut().find(|s| s.name == name) {
        service.status = "running".to_string();
        service.pid = Some(rand::random::<u32>() % 10000 + 1000);
        Ok((true, service.pid))
    } else {
        Err(format!("Service {} not found", name))
    }
}

#[tauri::command]
async fn stop_service(state: State<'_, AppState>, name: String) -> Result<bool, String> {
    let mut services = state.services.lock().map_err(|e| e.to_string())?;
    
    if let Some(service) = services.iter_mut().find(|s| s.name == name) {
        service.status = "stopped".to_string();
        service.pid = None;
        Ok(true)
    } else {
        Err(format!("Service {} not found", name))
    }
}

#[tauri::command]
async fn get_service_status(state: State<'_, AppState>, name: String) -> Result<(String, Option<u32>), String> {
    let services = state.services.lock().map_err(|e| e.to_string())?;
    
    if let Some(service) = services.iter().find(|s| s.name == name) {
        Ok((service.status.clone(), service.pid))
    } else {
        Err(format!("Service {} not found", name))
    }
}

#[tauri::command]
async fn get_all_services(state: State<'_, AppState>) -> Result<Vec<(String, String, Option<u32>)>, String> {
    let services = state.services.lock().map_err(|e| e.to_string())?;
    Ok(services.iter().map(|s| (s.name.clone(), s.status.clone(), s.pid)).collect())
}

// File system commands
#[tauri::command]
async fn select_directory(window: tauri::Window) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let folder = window.dialog().file().blocking_pick_folder();
    Ok(folder.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
async fn read_file(path: String) -> Result<(bool, Option<String>, Option<String>), String> {
    use std::fs;
    
    match fs::read_to_string(&path) {
        Ok(content) => Ok((true, Some(content), None)),
        Err(e) => Ok((false, None, Some(e.to_string()))),
    }
}

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(bool, Option<String>), String> {
    use std::fs;
    
    match fs::write(&path, content) {
        Ok(_) => Ok((true, None)),
        Err(e) => Ok((false, Some(e.to_string()))),
    }
}

// System info commands
#[tauri::command]
async fn get_platform() -> String {
    std::env::consts::OS.to_string()
}

#[tauri::command]
async fn get_home_path() -> Result<String, String> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not determine home directory".to_string())
}

// Update commands
#[tauri::command]
async fn check_for_updates() -> Result<(bool, String), String> {
    // In production, this would check the update server
    Ok((false, "3.0.0".to_string()))
}

// Notification commands
#[tauri::command]
async fn show_notification(title: String, body: String) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    
    // This would be called from the app handle
    Ok(())
}

fn main() {
    // Initialize services
    let initial_services = vec![
        Service { name: "Backend".to_string(), status: "stopped".to_string(), pid: None },
        Service { name: "Quantum Core".to_string(), status: "stopped".to_string(), pid: None },
        Service { name: "Swarm".to_string(), status: "stopped".to_string(), pid: None },
        Service { name: "Gateway".to_string(), status: "stopped".to_string(), pid: None },
    ];

    tauri::Builder::default()
        .manage(AppState {
            services: Mutex::new(initial_services),
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate![
            minimize_window,
            maximize_window,
            close_window,
            start_service,
            stop_service,
            get_service_status,
            get_all_services,
            select_directory,
            read_file,
            write_file,
            get_platform,
            get_home_path,
            check_for_updates,
            show_notification,
        ])
        .setup(|app| {
            // Create system tray
            let show_i = MenuItem::with_id(app, "show", "Show AppForge", true, None::<&str>)?;
            let start_all_i = MenuItem::with_id(app, "start_all", "Start All Services", true, None::<&str>)?;
            let stop_all_i = MenuItem::with_id(app, "stop_all", "Stop All Services", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            
            let menu = Menu::with_items(app, &[&show_i, &start_all_i, &stop_all_i, &quit_i])?;
            
            let tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "start_all" => {
                        // Emit event to frontend
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("tray-action", "start-all");
                        }
                    }
                    "stop_all" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("tray-action", "stop-all");
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Show window when ready
            let window = app.get_webview_window("main").unwrap();
            window.show().unwrap();
            
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // Hide window instead of closing (keep in tray)
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
