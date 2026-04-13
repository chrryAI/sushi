use serde::Serialize;
use std::path::PathBuf;
use std::process::Stdio;
use std::sync::Arc;
use tauri::{Emitter, Listener, Manager, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as TokioCommand;
use tokio::sync::Mutex;
use uuid::Uuid;

// 🍣 WebSocket Terminal modülü
mod terminal_ws;
use terminal_ws::{TerminalWsServer, WsMessage, WsOutput};

// ─── Types ────────────────────────────────────────────────────────────────────

#[derive(Serialize, Clone)]
pub struct FalkorStatus {
    pub running: bool,
    pub graph_exists: bool,
    pub node_count: i64,
}

#[derive(Serialize, Clone, Debug)]
pub struct ServiceStatus {
    pub name: String,
    pub status: String, // "starting" | "healthy" | "unhealthy" | "stopped"
}

#[derive(Serialize, Clone, Debug)]
pub struct LocalServicesStatus {
    pub docker: bool,
    pub services: Vec<ServiceStatus>,
    pub api: bool,
    pub all_ready: bool,
}

// 🍣 Sushi Terminal Types
#[derive(Serialize, Clone, Debug)]
pub struct TerminalOutput {
    pub id: String,
    pub output: String,
    pub is_error: bool,
    pub is_complete: bool,
    pub exit_code: Option<i32>,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/// Returns the path to the bundled docker-compose file.
/// In dev mode falls back to the repo root; in production uses app resource_dir.
fn compose_file_path(app: &tauri::AppHandle) -> PathBuf {
    // 1. Try the resource dir (production .app bundle)
    let resource_path = app
        .path()
        .resource_dir()
        .unwrap_or_default()
        .join("docker-compose.bundle.yml");

    if resource_path.exists() {
        return resource_path;
    }

    // 2. Dev fallback: walk up from CARGO_MANIFEST_DIR to the repo root
    //    src-tauri → desktop → apps → repo-root
    if let Ok(manifest) = std::env::var("CARGO_MANIFEST_DIR") {
        let dev_path = PathBuf::from(manifest)
            .parent() // desktop
            .and_then(|p| p.parent()) // apps (if inside apps/)
            .map(|p| p.join("desktop/docker-compose.bundle.yml"));
        if let Some(p) = dev_path {
            if p.exists() {
                return p;
            }
        }

        // 3. Also try local.yml as dev fallback
        let local_path = PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap())
            .parent()
            .and_then(|p| p.parent()) // repo root
            .map(|p| p.join("infra/docker/docker-compose.local.yml"));
        if let Some(p) = local_path {
            if p.exists() {
                return p;
            }
        }
    }

    // Final fallback
    resource_path
}

/// Returns the app support directory for persistent data (volumes, .env etc.)
fn app_support_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("/tmp/vex"))
}

/// Run a shell command and return (success, stdout, stderr)
async fn run_cmd(program: &str, args: &[&str], cwd: Option<PathBuf>) -> (bool, String, String) {
    let mut cmd = tokio::process::Command::new(program);
    cmd.args(args);
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());
    if let Some(dir) = cwd {
        cmd.current_dir(dir);
    }
    match cmd.output().await {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            (out.status.success(), stdout, stderr)
        }
        Err(e) => (false, String::new(), e.to_string()),
    }
}

// ─── Tauri Commands ───────────────────────────────────────────────────────────

/// Check if Docker/OrbStack daemon is running.
#[tauri::command]
async fn check_docker() -> bool {
    // Try docker info — works for both Docker Desktop and OrbStack
    let (ok, _, _) = run_cmd("docker", &["info", "--format", "{{.ServerVersion}}"], None).await;
    ok
}

/// Start all local services via docker compose.
#[tauri::command]
async fn start_services(app: tauri::AppHandle) -> Result<bool, String> {
    let compose = compose_file_path(&app);
    let compose_str = compose.to_string_lossy().to_string();
    let data_dir = app_support_dir(&app);

    // Ensure data directory exists
    let _ = tokio::fs::create_dir_all(&data_dir).await;

    let (ok, _out, err) = run_cmd(
        "docker",
        &[
            "compose",
            "-f",
            &compose_str,
            "up",
            "-d",
            "--pull",
            "missing",
        ],
        Some(data_dir),
    )
    .await;

    if !ok {
        return Err(format!("docker compose up failed: {}", err));
    }

    Ok(true)
}

/// Stop all local services.
#[tauri::command]
async fn stop_services(app: tauri::AppHandle) -> bool {
    let compose = compose_file_path(&app);
    let compose_str = compose.to_string_lossy().to_string();
    let (ok, _, _) = run_cmd(
        "docker",
        &["compose", "-f", &compose_str, "stop"],
        None,
    )
    .await;
    ok
}

/// Get the health status of each container.
#[tauri::command]
async fn get_service_status(app: tauri::AppHandle) -> LocalServicesStatus {
    let docker_ok = check_docker().await;

    if !docker_ok {
        return LocalServicesStatus {
            docker: false,
            services: vec![],
            api: false,
            all_ready: false,
        };
    }

    // docker compose ps --format json
    let compose = compose_file_path(&app);
    let compose_str = compose.to_string_lossy().to_string();
    let (_, out, _) = run_cmd(
        "docker",
        &["compose", "-f", &compose_str, "ps", "--format", "json"],
        None,
    )
    .await;

    let mut services: Vec<ServiceStatus> = Vec::new();

    // Parse each JSON line
    for line in out.lines() {
        if line.trim().is_empty() {
            continue;
        }
        if let Ok(obj) = serde_json::from_str::<serde_json::Value>(line) {
            let name = obj["Service"]
                .as_str()
                .unwrap_or("unknown")
                .to_string();
            let health = obj["Health"].as_str().unwrap_or("");
            let state = obj["State"].as_str().unwrap_or("stopped");

            let status = if health == "healthy" {
                "healthy"
            } else if state == "running" {
                "starting"
            } else {
                "stopped"
            };

            services.push(ServiceStatus {
                name,
                status: status.to_string(),
            });
        }
    }

    // Check API health
    let api_ok = match reqwest::get("http://127.0.0.1:3001/health").await {
        Ok(r) => r.status().is_success(),
        Err(_) => false,
    };

    let all_ready = docker_ok
        && !services.is_empty()
        && services.iter().all(|s| s.status == "healthy")
        && api_ok;

    LocalServicesStatus {
        docker: docker_ok,
        services,
        api: api_ok,
        all_ready,
    }
}

/// Legacy: FalkorDB check (kept for compatibility)
#[tauri::command]
async fn falkor_check() -> FalkorStatus {
    use std::io::{Read, Write};
    use std::net::TcpStream;
    use std::time::Duration;

    let Ok(mut stream) = TcpStream::connect_timeout(
        &"127.0.0.1:6380".parse().unwrap(), // FalkorDB port from bundle compose
        Duration::from_secs(2),
    ) else {
        return FalkorStatus {
            running: false,
            graph_exists: false,
            node_count: 0,
        };
    };

    let cmd = "*3\r\n$11\r\nGRAPH.QUERY\r\n$3\r\nVex\r\n$30\r\nMATCH (n) RETURN COUNT(n) AS c\r\n";
    if stream.write_all(cmd.as_bytes()).is_err() {
        return FalkorStatus {
            running: true,
            graph_exists: false,
            node_count: 0,
        };
    }

    let mut buf = vec![0u8; 512];
    let n = stream.read(&mut buf).unwrap_or(0);
    let response = String::from_utf8_lossy(&buf[..n]);
    let graph_exists = !response.contains("-ERR") && !response.contains("-GRAPH");
    let node_count = response
        .lines()
        .find(|l| l.starts_with(':'))
        .and_then(|l| l.trim_start_matches(':').parse::<i64>().ok())
        .unwrap_or(0);

    FalkorStatus {
        running: true,
        graph_exists,
        node_count,
    }
}

// 🍣 Sushi Terminal - Execute Command with Streaming Output
#[tauri::command]
async fn execute_command(
    window: tauri::Window,
    session_id: String,
    command: String,
    args: Vec<String>,
    cwd: String,
) -> Result<String, String> {
    log::info!("🍣 Sushi Terminal executing: {} {:?} in {}", command, args, cwd);

    // Spawn the command
    let mut child = TokioCommand::new(&command)
        .args(&args)
        .current_dir(&cwd)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn command: {}", e))?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;
    
    let window_stdout = window.clone();
    let window_stderr = window.clone();
    let session_id_stdout = session_id.clone();
    let session_id_stderr = session_id.clone();

    // Handle stdout stream
    tokio::spawn(async move {
        let reader = BufReader::new(stdout);
        let mut lines = reader.lines();
        
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = window_stdout.emit("terminal-output", TerminalOutput {
                id: session_id_stdout.clone(),
                output: line,
                is_error: false,
                is_complete: false,
                exit_code: None,
            });
        }
    });

    // Handle stderr stream
    tokio::spawn(async move {
        let reader = BufReader::new(stderr);
        let mut lines = reader.lines();
        
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = window_stderr.emit("terminal-output", TerminalOutput {
                id: session_id_stderr.clone(),
                output: line,
                is_error: true,
                is_complete: false,
                exit_code: None,
            });
        }
    });

    // Wait for process to complete
    let status = child.wait().await.map_err(|e| format!("Failed to wait for command: {}", e))?;
    
    // Send completion event
    let _ = window.emit("terminal-output", TerminalOutput {
        id: session_id.clone(),
        output: String::new(),
        is_error: false,
        is_complete: true,
        exit_code: status.code(),
    });

    log::info!("🍣 Sushi Terminal command completed with exit code: {:?}", status.code());
    Ok(session_id)
}

// ─── App Entry Point ──────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Info)
                    .build(),
            )?;

            #[cfg(any(windows, target_os = "linux"))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                app.handle().deep_link().register("vex")?;
            }

            // ── Deep link handler ──
            let handle = app.handle().clone();
            let handle_clone = handle.clone();
            handle.listen("deep-link://new-url", move |event| {
                let url = event.payload();
                log::info!("Received deep link: {}", url);
                if url.starts_with("vex://auth/callback") {
                    if let Ok(parsed_url) = tauri::Url::parse(url) {
                        for (key, value) in parsed_url.query_pairs() {
                            if key == "auth_token" {
                                log::info!("OAuth callback received with token");
                                let _ = handle_clone.emit("oauth-callback", value.to_string());
                                break;
                            }
                        }
                    }
                }
            });

            // Services are started manually via the frontend button (start_services command)
            log::info!("🍉 Watermelon desktop ready — services can be started from UI");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            falkor_check,
            check_docker,
            start_services,
            stop_services,
            get_service_status,
            execute_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
