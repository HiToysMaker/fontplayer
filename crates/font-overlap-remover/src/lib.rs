use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::json;

use flo_curves::bezier::path::{SimpleBezierPath, path_add};
use flo_curves::Coordinate2D;
use flo_curves::geo::Coord2;

#[wasm_bindgen(start)]
pub fn start() {
    #[cfg(feature = "console_error_panic_hook")]
    {
        console_error_panic_hook::set_once();
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Segment {
    #[serde(rename = "LINE")]
    Line { start: Point, end: Point },

    #[serde(rename = "QUADRATIC_BEZIER")]
    Quadratic { start: Point, control: Point, end: Point },

    #[serde(rename = "CUBIC_BEZIER")]
    Cubic { start: Point, control1: Point, control2: Point, end: Point },
}

type Contour = Vec<Segment>;
type Contours = Vec<Contour>;

fn p_to_coord(p: Point) -> Coord2 { 
    Coord2(p.x, p.y) 
}

fn coord_to_p(c: &Coord2) -> Point { 
    Point { x: c.x(), y: c.y() } 
}

// 二次贝塞尔 -> 三次
fn quad_to_cubic(start: Point, control: Point, end: Point) -> (Point, Point) {
    let c1 = Point {
        x: start.x + (2.0 / 3.0) * (control.x - start.x),
        y: start.y + (2.0 / 3.0) * (control.y - start.y),
    };
    let c2 = Point {
        x: end.x + (2.0 / 3.0) * (control.x - end.x),
        y: end.y + (2.0 / 3.0) * (control.y - end.y),
    };
    (c1, c2)
}

// 线段 -> 三次（控制点用端点）
fn line_to_cubic(start: Point, end: Point) -> (Point, Point) { 
    (start, end) 
}

// 将一个轮廓转成 SimpleBezierPath
fn contour_to_simple_path(contour: &Contour) -> Option<SimpleBezierPath> {
    if contour.is_empty() {
        return None;
    }

    // 起点：取第一段的 start
    let first_start = match contour.first().unwrap() {
        Segment::Line { start, .. } => *start,
        Segment::Quadratic { start, .. } => *start,
        Segment::Cubic { start, .. } => *start,
    };
    let mut triples: Vec<(Coord2, Coord2, Coord2)> = Vec::new();

    for seg in contour {
        match seg {
            Segment::Line { start: _, end } => {
                let (c1, c2) = line_to_cubic(first_start, *end);
                triples.push((p_to_coord(c1), p_to_coord(c2), p_to_coord(*end)));
            }
            Segment::Quadratic { start: _, control, end } => {
                let (c1, c2) = quad_to_cubic(first_start, *control, *end);
                triples.push((p_to_coord(c1), p_to_coord(c2), p_to_coord(*end)));
            }
            Segment::Cubic { start: _, control1, control2, end } => {
                triples.push((p_to_coord(*control1), p_to_coord(*control2), p_to_coord(*end)));
            }
        }
    }

    Some((p_to_coord(first_start), triples))
}

// 将 SimpleBezierPath 转回三次贝塞尔轮廓
fn simple_path_to_contour(path: &SimpleBezierPath) -> Contour {
    let (start, triples) = path;
    let mut contour: Contour = Vec::new();
    let mut current = coord_to_p(start);

    for (c1, c2, end) in triples.iter() {
        contour.push(Segment::Cubic {
            start: current,
            control1: coord_to_p(c1),
            control2: coord_to_p(c2),
            end: coord_to_p(end),
        });
        current = coord_to_p(end);
    }

    contour
}

// 使用 flo_curves 的 path_add 进行布尔运算（Union）
fn union_paths(paths: &[SimpleBezierPath]) -> Vec<SimpleBezierPath> {
    if paths.is_empty() { 
        return vec![]; 
    }
    
    if paths.len() == 1 {
        return vec![paths[0].clone()];
    }

    // 将 SimpleBezierPath 转换为 Vec<SimpleBezierPath> 格式
    let mut result = vec![paths[0].clone()];
    
    // 依次与每个路径进行 Union 运算
    for path in &paths[1..] {
        let current_paths = vec![path.clone()];
        
        // 使用 path_add 进行 Union 运算
        // accuracy 参数控制精度，0.1 是一个合理的默认值
        let unioned = path_add(&result, &current_paths, 0.1);
        
        result = unioned;
    }

    result
}

#[wasm_bindgen]
pub fn remove_overlap(contours_json: &str) -> String {
    let contours: Contours = match serde_json::from_str(contours_json) {
        Ok(c) => c,
        Err(err) => {
            return json!({ "ok": false, "error": format!("invalid json: {err}") }).to_string();
        }
    };

    let mut paths: Vec<SimpleBezierPath> = Vec::new();
    for contour in &contours {
        if let Some(path) = contour_to_simple_path(contour) {
            paths.push(path);
        }
    }

    if paths.is_empty() {
        let empty: Contours = Vec::new();
        return json!({ "ok": true, "contours": empty }).to_string();
    }

    let united = union_paths(&paths);

    let mut out_contours: Contours = Vec::new();
    for path in &united {
        let c = simple_path_to_contour(path);
        if !c.is_empty() {
            out_contours.push(c);
        }
    }

    json!({ "ok": true, "contours": out_contours }).to_string()
}