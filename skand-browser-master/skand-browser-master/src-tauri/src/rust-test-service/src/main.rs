use std::time::Duration;
use tokio::time;

#[tokio::main]
async fn main() {
    println!(">>> Rust Test Service Booting Up!");
    
    let mut interval = time::interval(Duration::from_secs(3));
    
    loop {
        interval.tick().await;
        println!(">>> Rust Test Service: Heartbeat!");
    }
}
