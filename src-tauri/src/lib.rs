use std::env;
use std::net::SocketAddr;
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{copy_bidirectional, AsyncReadExt, AsyncWriteExt};
use tokio::runtime::Runtime;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // ----------------------------
    // 1️⃣ Устанавливаем прокси для всего приложения
    // ----------------------------
    env::set_var("HTTP_PROXY", "http://127.0.0.1:8888");
    env::set_var("HTTPS_PROXY", "http://127.0.0.1:8888");

    // ----------------------------
    // 2️⃣ Создаём Tokio runtime и запускаем прокси в фоне
    // ----------------------------
    let rt = Runtime::new().expect("Failed to create Tokio runtime");
    rt.spawn(async {
        if let Err(e) = start_tcp_proxy("127.0.0.1:8888").await {
            eprintln!("Proxy failed: {}", e);
        }
    });

    // ----------------------------
    // 3️⃣ Запускаем Tauri-приложение синхронно
    // ----------------------------
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ----------------------------
// 🔹 TCP-прокси с поддержкой CONNECT
// ----------------------------
async fn start_tcp_proxy(addr: &str) -> std::io::Result<()> {
    let listener = TcpListener::bind(addr).await?;
    println!("TCP Proxy running on {}", addr);

    loop {
        let (mut inbound, _) = listener.accept().await?;

        tokio::spawn(async move {
            if let Err(e) = handle_connection(&mut inbound).await {
                eprintln!("Connection error: {}", e);
            }
        });
    }
}

// Обработка одного подключения
async fn handle_connection(inbound: &mut TcpStream) -> std::io::Result<()> {
    let mut buf = [0u8; 1024];
    let n = inbound.peek(&mut buf).await?;
    if n == 0 {
        return Ok(());
    }

    let first_line = String::from_utf8_lossy(&buf[..n]);
    let mut parts = first_line.split_whitespace();
    let method = parts.next().unwrap_or("");
    let target = parts.next().unwrap_or("");

    if method.eq_ignore_ascii_case("CONNECT") {
        // HTTPS CONNECT
        let mut target_parts = target.split(':');
        let host = target_parts.next().unwrap_or("");
        let port = target_parts.next().unwrap_or("443");
        let target_addr = format!("{}:{}", host, port);

        // Устанавливаем соединение с настоящим сервером
        match TcpStream::connect(&target_addr).await {
            Ok(mut outbound) => {
                // Отправляем клиенту подтверждение CONNECT
                inbound.write_all(b"HTTP/1.1 200 Connection Established\r\n\r\n").await?;

                // Пробрасываем данные в обе стороны
                let _ = copy_bidirectional(&mut *inbound, &mut outbound).await;
            }
            Err(e) => {
                eprintln!("Failed to connect to target {}: {}", target_addr, e);
            }
        }
    } else {
        // Для обычного HTTP GET/POST
        let mut parts = first_line.split_whitespace();
        let _method = parts.next().unwrap_or("");
        let url = parts.next().unwrap_or("");

        // Простая реализация — TCP соединение с хостом
        if let Ok(uri) = url.parse::<hyper::Uri>() {
            if let Some(host) = uri.host() {
                let port = uri.port_u16().unwrap_or(80);
                let target_addr = format!("{}:{}", host, port);

                match TcpStream::connect(target_addr).await {
                    Ok(mut outbound) => {
                        let _ = outbound.write_all(&buf[..n]).await;
                        let _ = copy_bidirectional(&mut *inbound, &mut outbound).await;
                    }
                    Err(e) => eprintln!("Failed to connect HTTP target: {}", e),
                }
            }
        }
    }

    Ok(())
}
