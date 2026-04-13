// 🍣 Sushi Terminal WebSocket Server
// Direkt websocket üzerinden terminal erişimi - arayüz yok!

use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::broadcast;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WsMessage {
    pub id: String,
    pub cmd: String,
    pub args: Vec<String>,
    pub cwd: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct WsOutput {
    pub id: String,
    pub output: String,
    pub is_error: bool,
    pub is_complete: bool,
    pub exit_code: Option<i32>,
}

pub struct TerminalWsServer {
    tx: broadcast::Sender<WsOutput>,
}

impl TerminalWsServer {
    pub fn new() -> Self {
        let (tx, _rx) = broadcast::channel(100);
        Self { tx }
    }

    pub fn subscribe(&self) -> broadcast::Receiver<WsOutput> {
        self.tx.subscribe()
    }

    pub async fn execute(&self, msg: WsMessage) -> Result<String, String> {
        let WsMessage { id, cmd, args, cwd } = msg;
        
        log::info!("🍣 WS Terminal executing: {} {:?} in {}", cmd, args, cwd);

        let mut child = Command::new(&cmd)
            .args(&args)
            .current_dir(&cwd)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn: {}", e))?;

        let stdout = child.stdout.take().ok_or("No stdout")?;
        let stderr = child.stderr.take().ok_or("No stderr")?;
        let tx_stdout = self.tx.clone();
        let tx_stderr = self.tx.clone();
        let id_stdout = id.clone();
        let id_stderr = id.clone();
        let id_complete = id.clone();

        // stdout stream
        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = tx_stdout.send(WsOutput {
                    id: id_stdout.clone(),
                    output: line,
                    is_error: false,
                    is_complete: false,
                    exit_code: None,
                });
            }
        });

        // stderr stream
        tokio::spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = tx_stderr.send(WsOutput {
                    id: id_stderr.clone(),
                    output: line,
                    is_error: true,
                    is_complete: false,
                    exit_code: None,
                });
            }
        });

        // Wait and send completion
        let tx_complete = self.tx.clone();
        tokio::spawn(async move {
            let status = child.wait().await.ok();
            let exit_code = status.and_then(|s| s.code());
            
            let _ = tx_complete.send(WsOutput {
                id: id_complete,
                output: String::new(),
                is_error: false,
                is_complete: true,
                exit_code,
            });
        });

        Ok(id)
    }
}

impl Default for TerminalWsServer {
    fn default() -> Self {
        Self::new()
    }
}
