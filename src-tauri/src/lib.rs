#![allow(unused)]

use native_dialog::FileDialog;
use std::collections::HashMap;
use std::fs::write;
use std::fs::File;
use std::io::{self, Write};
use std::path::PathBuf;
use tauri::menu::{Menu, MenuItem, MenuItemBuilder, MenuItemKind, PredefinedMenuItem, Submenu};
use tauri::Size;
use tauri::{AppHandle, Emitter};
use tauri::{Manager, Window};

#[tauri::command]
fn test(app: AppHandle) {
  app.emit("create-file", ()).unwrap();
}

#[tauri::command]
fn create_file(app: AppHandle) {
  app.emit("create-file", ()).unwrap();
}

#[tauri::command]
fn open_file(app: AppHandle) {
  app.emit("open-file", ()).unwrap();
}

#[tauri::command]
fn save_file(app: AppHandle) {
  app.emit("save-file", ()).unwrap();
}

#[tauri::command]
fn save_as(app: AppHandle) {
  app.emit("save-as", ()).unwrap();
}

#[tauri::command]
fn undo(app: AppHandle) {
  app.emit("undo", ()).unwrap();
}

#[tauri::command]
fn redo(app: AppHandle) {
  app.emit("redo", ()).unwrap();
}

#[tauri::command]
fn cut(app: AppHandle) {
  app.emit("cut", ()).unwrap();
}

#[tauri::command]
fn copy(app: AppHandle) {
  app.emit("copy", ()).unwrap();
}

#[tauri::command]
fn paste(app: AppHandle) {
  app.emit("paste", ()).unwrap();
}

#[tauri::command]
fn del(app: AppHandle) {
  app.emit("delete", ()).unwrap();
}

#[tauri::command]
fn import_font_file(app: AppHandle) {
  app.emit("import-font-file", ()).unwrap();
}

#[tauri::command]
fn import_templates_file(app: AppHandle) {
  app.emit("import-templates-file", ()).unwrap();
}

#[tauri::command]
fn import_glyphs(app: AppHandle) {
  app.emit("import-glyphs", ()).unwrap();
}

#[tauri::command]
fn import_pic(app: AppHandle) {
  app.emit("import-pic", ()).unwrap();
}

#[tauri::command]
fn import_svg(app: AppHandle) {
  app.emit("import-svg", ()).unwrap();
}

#[tauri::command]
fn export_font_file(app: AppHandle) {
  app.emit("export-font-file", ()).unwrap();
}

#[tauri::command]
fn export_glyphs(app: AppHandle) {
  app.emit("export-glyphs", ()).unwrap();
}

#[tauri::command]
fn export_jpeg(app: AppHandle) {
  app.emit("export-jpeg", ()).unwrap();
}

#[tauri::command]
fn export_png(app: AppHandle) {
  app.emit("export-png", ()).unwrap();
}

#[tauri::command]
fn export_svg(app: AppHandle) {
  app.emit("export-svg", ()).unwrap();
}

#[tauri::command]
fn add_character(app: AppHandle) {
  app.emit("add-character", ()).unwrap();
}

#[tauri::command]
fn add_icon(app: AppHandle) {
  app.emit("add-icon", ()).unwrap();
}

#[tauri::command]
fn font_settings(app: AppHandle) {
  app.emit("font-settings", ()).unwrap();
}

#[tauri::command]
fn preference_settings(app: AppHandle) {
  app.emit("preference-settings", ()).unwrap();
}

#[tauri::command]
fn language_settings(app: AppHandle) {
  app.emit("language-settings", ()).unwrap();
}

#[tauri::command]
fn import_template1(app: AppHandle) {
  app.emit("template-1", ()).unwrap();
}

#[tauri::command]
fn remove_overlap(app: AppHandle) {
  app.emit("remove_overlap", ()).unwrap();
}

fn enable(edit_status: &str) -> bool {
  true
}

fn enable_at_edit(edit_status: &str) -> bool {
  match edit_status {
    "edit" | "glyph" => true,
    _ => false,
  }
}

fn enable_at_list(edit_status: &str) -> bool {
  match edit_status {
    "edit" | "glyph" | "pic" => false,
    _ => true,
  }
}

fn template_enable(edit_status: &str) -> bool {
  match edit_status {
    "edit" | "glyph" | "pic" => false,
    _ => true,
  }
}

// 定义用于启用/禁用菜单项的映射
fn build_menu_enabled_map() -> HashMap<String, Box<dyn Fn(&str) -> bool>> {
  let menu_enabled_map: HashMap<String, Box<dyn Fn(&str) -> bool>> = HashMap::from([
    (
      "about".to_string(),
      Box::new(enable) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "create-file".to_string(),
      Box::new(enable_at_list) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "open-file".to_string(),
      Box::new(enable_at_list) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "save-file".to_string(),
      Box::new(enable) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "save-as".to_string(),
      Box::new(enable) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "undo".to_string(),
      Box::new(enable_at_edit) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "redo".to_string(),
      Box::new(enable_at_edit) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "cut".to_string(),
      Box::new(enable_at_edit) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "copy".to_string(),
      Box::new(enable_at_edit) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "paste".to_string(),
      Box::new(enable_at_edit) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "delete".to_string(),
      Box::new(enable_at_edit) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "import-font-file".to_string(),
      Box::new(enable_at_list) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "import-glyphs".to_string(),
      Box::new(enable_at_list) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "import-pic".to_string(),
      Box::new(enable_at_edit) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "import-svg".to_string(),
      Box::new(enable_at_edit) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "export-font-file".to_string(),
      Box::new(enable) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "export-glyphs".to_string(),
      Box::new(enable_at_list) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "export-jpeg".to_string(),
      Box::new(enable_at_edit) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "export-png".to_string(),
      Box::new(enable_at_edit) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "export-svg".to_string(),
      Box::new(enable_at_edit) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "add-character".to_string(),
      Box::new(enable_at_list) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "add-icon".to_string(),
      Box::new(enable_at_list) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "font-settings".to_string(),
      Box::new(enable) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "preference-settings".to_string(),
      Box::new(enable) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "language-settings".to_string(),
      Box::new(enable) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "template-1".to_string(),
      Box::new(template_enable) as Box<dyn Fn(&str) -> bool>,
    ),
    (
      "remove-overlap".to_string(),
      Box::new(enable_at_edit) as Box<dyn Fn(&str) -> bool>,
    ),
  ]);
  menu_enabled_map
}

#[tauri::command]
fn toggle_menu_disabled(app: AppHandle, edit_status: String) {
  let map = build_menu_enabled_map();
  let window = app.get_webview_window("main").unwrap();
  let menu = window.menu().unwrap();
  for submenu in menu.items().unwrap() {
    match submenu {
      // 如果是 Submenu 类型，调用 items() 获取子菜单项
      MenuItemKind::Submenu(submenu) => {
        // 获取并遍历子菜单中的菜单项
        for item in submenu.items().unwrap() {
          match item {
            MenuItemKind::MenuItem(item) => {
              let id: String = item.id().0.clone();
              let status: String = edit_status.clone();
              let enabled: bool = map.get(&id).expect("Error")(&status);
              item.set_enabled(enabled);
            }

            _ => {
              // 如果是其他未处理的类型，使用 `_` 捕获
            }
          }
        }
      }

      _ => {
        // 如果是其他未处理的类型，使用 `_` 捕获
      }
    }
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_clipboard_manager::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .setup(|app| {
      // 获取名为 "main" 的 Webview 窗口句柄
      let window = app.get_webview_window("main").unwrap();

      // 获取窗口尺寸
      let primary_display = window.inner_size().unwrap();
      let screen_width = primary_display.width;
      let screen_height = primary_display.height;

      // 获取主显示器的 DPI 缩放因子
      let scale_factor = window.scale_factor().unwrap();

      // 设置最大窗口尺寸
      let max_width = 1280;
      let max_height = 800;

      // 根据 DPI 缩放因子调整窗口尺寸
      let adjusted_width = (max_width as f64 * scale_factor) as u32;
      let adjusted_height = (max_height as f64 * scale_factor) as u32;

      // 计算窗口大小，确保窗口大小不超过屏幕大小
      let window_width = screen_width.min(adjusted_width);
      let window_height = screen_height.min(adjusted_height);

      // 获取窗口并设置尺寸
      window
          .set_size(Size::new(tauri::PhysicalSize::new(
              window_width as u32,
              window_height as u32,
          )))
          .unwrap();

      app.on_menu_event(move |app, event| {
        if event.id() == "create-file" {
          create_file(app.app_handle().clone())
        } else if event.id() == "open-file" {
          open_file(app.app_handle().clone())
        } else if event.id() == "save-file" {
          save_file(app.app_handle().clone())
        } else if event.id() == "save-as" {
          save_as(app.app_handle().clone())
        } else if event.id() == "undo" {
          undo(app.app_handle().clone())
        } else if event.id() == "redo" {
          redo(app.app_handle().clone())
        } else if event.id() == "cut" {
          cut(app.app_handle().clone())
        } else if event.id() == "copy" {
          copy(app.app_handle().clone())
        } else if event.id() == "paste" {
          paste(app.app_handle().clone())
        } else if event.id() == "delete" {
          del(app.app_handle().clone())
        } else if event.id() == "import-font-file" {
          import_font_file(app.app_handle().clone())
        } else if event.id() == "import-templates-file" {
          import_templates_file(app.app_handle().clone())
        } else if event.id() == "import-glyphs" {
          import_glyphs(app.app_handle().clone())
        } else if event.id() == "import-pic" {
          import_pic(app.app_handle().clone())
        } else if event.id() == "import-svg" {
          import_svg(app.app_handle().clone())
        } else if event.id() == "export-font-file" {
          export_font_file(app.app_handle().clone())
        } else if event.id() == "export-glyphs" {
          export_glyphs(app.app_handle().clone())
        } else if event.id() == "export-jpeg" {
          export_jpeg(app.app_handle().clone())
        } else if event.id() == "export-png" {
          export_png(app.app_handle().clone())
        } else if event.id() == "export-svg" {
          export_svg(app.app_handle().clone())
        } else if event.id() == "add-character" {
          add_character(app.app_handle().clone())
        } else if event.id() == "add-icon" {
          add_icon(app.app_handle().clone())
        } else if event.id() == "font-settings" {
          font_settings(app.app_handle().clone())
        } else if event.id() == "preference-settings" {
          preference_settings(app.app_handle().clone())
        } else if event.id() == "language-settings" {
          language_settings(app.app_handle().clone())
        } else if event.id() == "template-1" {
          import_template1(app.app_handle().clone())
        } else if event.id() == "remove_overlap" {
          remove_overlap(app.app_handle().clone())
        }
      });

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .menu(|handle| {
      Menu::with_items(
        handle,
        &[
          &Submenu::with_items(
            handle,
            "字玩",
            true,
            &[&MenuItemBuilder::with_id("about", "关于")
              .build(handle)
              .expect("Error")],
          )?,
          &Submenu::with_items(
            handle,
            "文件",
            true,
            &[
              &MenuItemBuilder::with_id("create-file", "新建工程")
                .build(handle)
                .expect("Error"),
              &MenuItemBuilder::with_id("open-file", "打开工程")
                .build(handle)
                .expect("Error"),
              &MenuItemBuilder::with_id("save-file", "保存工程")
                .build(handle)
                .expect("Error"),
              &MenuItemBuilder::with_id("save-as", "另存为")
                .build(handle)
                .expect("Error"),
            ],
          )?,
          &Submenu::with_items(
            handle,
            "编辑",
            true,
            &[
              &MenuItemBuilder::with_id("undo", "撤销")
                .enabled(false)
                .build(handle)
                .expect("Error"),
              &MenuItemBuilder::with_id("redo", "重做")
                .enabled(false)
                .build(handle)
                .expect("Error"),
              &MenuItemBuilder::with_id("cut", "剪切")
                .enabled(false)
                .build(handle)
                .expect("Error"),
              &MenuItemBuilder::with_id("paste", "粘贴")
                .enabled(false)
                .build(handle)
                .expect("Error"),
              &MenuItemBuilder::with_id("copy", "复制")
                .enabled(false)
                .build(handle)
                .expect("Error"),
              &MenuItemBuilder::with_id("delete", "删除")
                .enabled(false)
                .build(handle)
                .expect("Error"),
            ],
          )?,
          &Submenu::with_items(
            handle,
            "导入",
            true,
            &[
              &MenuItemBuilder::with_id("import-font-file", "导入字体库")
                .build(handle)
                .expect("Error"),
              &MenuItemBuilder::with_id("import-glyphs", "导入字形")
                .build(handle)
                .expect("Error"),
              &MenuItemBuilder::with_id("import-pic", "识别图片")
                .enabled(false)
                .build(handle)
                .expect("Error"),
              &MenuItemBuilder::with_id("import-svg", "导入SVG")
                .enabled(false)
                .build(handle)
                .expect("Error"),
            ],
          )?,
          &Submenu::with_items(
            handle,
            "导出",
            true,
            &[
              &MenuItemBuilder::with_id("export-font-file", "导出字体库")
                .build(handle)
                .expect("Error"),
              &MenuItemBuilder::with_id("export-glyphs", "导出字形")
                .build(handle)
                .expect("Error"),
              &MenuItemBuilder::with_id("export-jpeg", "导出JPEG")
                .enabled(false)
                .build(handle)
                .expect("Error"),
              &MenuItemBuilder::with_id("export-png", "导出PNG")
                .enabled(false)
                .build(handle)
                .expect("Error"),
              &MenuItemBuilder::with_id("export-svg", "导出SVG")
                .enabled(false)
                .build(handle)
                .expect("Error"),
            ],
          )?,
          &Submenu::with_items(
            handle,
            "字符与图标",
            true,
            &[
              &MenuItemBuilder::with_id("add-character", "添加字符")
                .build(handle)
                .expect("Error"),
              &MenuItemBuilder::with_id("add-icon", "添加图标")
                .build(handle)
                .expect("Error"),
            ],
          )?,
          &Submenu::with_items(
              handle,
              "设置",
              true,
              &[
                &MenuItemBuilder::with_id("font-settings", "字体设置")
                  .build(handle)
                  .expect("Error"),
                &MenuItemBuilder::with_id("preference-settings", "偏好设置")
                  .build(handle)
                  .expect("Error"),
                &MenuItemBuilder::with_id("language-settings", "语言设置")
                  .build(handle)
                  .expect("Error"),
              ],
          )?,
          &Submenu::with_items(
            handle,
            "模板",
            true,
            &[&MenuItemBuilder::with_id("template-1", "测试模板")
              .build(handle)
              .expect("Error")],
          )?,
          &Submenu::with_items(
            handle,
            "工具",
            true,
            &[&MenuItemBuilder::with_id("remove-overlap", "去除重叠")
              .enabled(false)
              .build(handle)
              .expect("Error")],
          )?,
        ],
      )
    })
    .invoke_handler(tauri::generate_handler![toggle_menu_disabled])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}