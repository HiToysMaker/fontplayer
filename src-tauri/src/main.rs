// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::panic;

fn main() {
  // 设置 panic 钩子
  panic::set_hook(Box::new(|panic_info| {
    println!("捕获到 panic: {:?}", panic_info);
  }));

  app_lib::run();
}